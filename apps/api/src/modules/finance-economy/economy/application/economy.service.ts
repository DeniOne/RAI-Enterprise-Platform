import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EconomicEventType, EconomicEvent, Prisma } from '@rai/prisma-client';
import { CostAttributionRules } from '../domain/rules/cost-attribution.rules';
import { assertBalancedPostings, resolveJournalPhase, resolveSettlementRef } from '../domain/journal-policy';
import { InvariantMetrics } from '../../../../shared/invariants/invariant-metrics';
import { createHash } from 'crypto';
import { FINANCE_INGEST_SUPPORTED_VERSIONS } from '../../contracts/finance-ingest.contract';
import { OutboxService } from '../../../../shared/outbox/outbox.service';
import { FinanceConfigService } from '../../finance/config/finance-config.service';

export interface IngestEconomicEventDto {
    type: EconomicEventType;
    amount: number | Prisma.Decimal;
    currency?: string;
    metadata?: any;
    fieldId?: string;
    seasonId?: string;
    employeeId?: string;
    companyId: string;
}


@Injectable()
export class EconomyService {
    private readonly logger = new Logger(EconomyService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly outbox: OutboxService,
        private readonly config: FinanceConfigService,
    ) { }

    /**
     * EconomicEventIngestor: Шлюз истины.
     * Принимает внешние события и преобразует их в экономические факты.
     */
    async ingestEvent(dto: IngestEconomicEventDto) {
        const panicThreshold = this.config.get('panicThreshold');
        if (InvariantMetrics.shouldTriggerFinancialPanic(panicThreshold)) {
            this.logger.error(
                `РЕЖИМ ФИНАНСОВОЙ ПАНИКИ АКТИВИРОВАН: инжест заблокирован для компании ${dto.companyId}. Порог=${panicThreshold}`,
            );
            throw new ServiceUnavailableException('Режим финансовой паники активен. Операции временно заблокированы.');
        }

        const idempotencyKey = this.extractIdempotencyKey(dto.metadata);

        // Idempotency is MANDATORY FOR FINTECH (G3: Atomicity)
        if (!idempotencyKey && this.config.get('requireIdempotency')) {
            InvariantMetrics.increment('financial_invariant_failures_total');
            throw new BadRequestException('Ключ идемпотентности обязателен для финансовых операций.');
        }

        const amount = new Prisma.Decimal(dto.amount);

        // Dynamic scale lookup
        const scale = await this.getCurrencyScale(dto.currency || this.config.get('defaultCurrency'));
        const normalizedAmount = new Prisma.Decimal(amount.toFixed(scale, Prisma.Decimal.ROUND_HALF_UP));

        const enrichedMetadata = this.enrichFinancialMetadata(dto.type, dto.metadata);
        this.validateContractCompatibility(enrichedMetadata, dto.companyId);
        const replayKey = this.extractReplayKey(dto, normalizedAmount, idempotencyKey);

        this.logger.log(`Регистрация экономического события: ${dto.type} для компании ${dto.companyId}`);

        try {
            return await this.prisma.$transaction(async (tx) => {
                // 0. Set RLS context for session (G1: Isolation Enforcement)
                // 0. Set RLS context for session (G1: Isolation Enforcement)
                await (tx as any).$executeRaw(Prisma.sql`SELECT set_config('app.current_company_id', ${dto.companyId}, true)`);
                // Check if session actually set
                const sessionTenant = await (tx as any).$queryRawUnsafe(`SELECT current_setting('app.current_company_id') as tenant`);
                if (sessionTenant[0]?.tenant !== dto.companyId) {
                    throw new ServiceUnavailableException('Security guard: Сбой инъекции контекста тенанта в сессию.');
                }

                // 1. Check Tenant State (Prisma-level check as fallback)
                const tenantState = await (tx as any).tenantState.findUnique({ where: { companyId: dto.companyId } });
                if (tenantState && tenantState.mode === 'HALTED') {
                    throw new ServiceUnavailableException(`Компания ${dto.companyId} ОСТАНОВЛЕНА. Финансовые операции заблокированы.`);
                }

                // 2. Сохранение сырого события (Amount removed - single source of truth is Ledger)
                const event = await (tx as any).economicEvent.create({
                    data: {
                        type: dto.type,
                        currency: dto.currency || 'RUB',
                        replayKey,
                        metadata: enrichedMetadata as Prisma.InputJsonValue,
                        fieldId: dto.fieldId,
                        seasonId: dto.seasonId,
                        employeeId: dto.employeeId,
                        companyId: dto.companyId,
                    } as any,
                });

                // 3. Генерация проекций (Ledger Entries)
                // Amount is passed explicitly as it is no longer stored in EconomicEvent
                await this.generateLedgerEntries(event, normalizedAmount, tx, scale);

                // 4. Outbox Event for External Consumers
                await tx.outboxMessage.create({
                    data: this.outbox.createEvent(
                        event.id,
                        'EconomicEvent',
                        'finance.economic_event.created',
                        { ...event, amount: normalizedAmount }
                    )
                });

                return event;
            });
        } catch (error) {
            if (this.isUniqueConflict(error, 'replayKey')) {
                this.logger.warn(
                    `Дубликат финансового инжеста (company=${dto.companyId}, idempotencyKey=${idempotencyKey || 'n/a'}, replayKey=${replayKey || 'n/a'}). Проверка целостности проекций...`,
                );
                InvariantMetrics.increment('event_duplicates_prevented_total');
                const existing = await this.findExistingDuplicate(dto.companyId, idempotencyKey, replayKey);

                if (existing) {
                    // HARDENING: Check if entries exist. If not, this is a "half-baked" event from a failed previous run.
                    const entryCount = await this.prisma.ledgerEntry.count({
                        where: { economicEventId: existing.id, companyId: dto.companyId }
                    });

                    if (entryCount === 0) {
                        this.logger.error(`КРИТИЧЕСКАЯ ОШИБКА: Обнаружено событие-фантом ${existing.id} без проводок в леджере. Попытка аварийного восстановления...`);
                        // Use a transaction for recovery to ensure atomicity
                        return await this.prisma.$transaction(async (tx) => {
                            await (tx as any).$executeRaw(Prisma.sql`SELECT set_config('app.current_company_id', ${dto.companyId}, true)`);
                            await this.generateLedgerEntries(existing, normalizedAmount, tx, scale);
                            return existing;
                        });
                    }
                    return existing;
                }
            }

            // Handle DB-level Integrity Violations (Mathematical Invariants)
            if (this.isIntegrityViolation(error)) {
                (this.logger as any).error(`НАРУШЕНИЕ ФИНАНСОВОЙ ЦЕЛОСТНОСТИ для компании ${dto.companyId}: ${error.message}`);
                (InvariantMetrics as any).increment('financial_integrity_violations_total');

                // Panic Mode: Attempt to move tenant to READ_ONLY
                await this.triggerTenantPanic(dto.companyId, error.message);

                throw new ServiceUnavailableException('Транзакция заблокирована из-за математической ошибки целостности. Тенант изолирован.');
            }

            throw error;
        }
    }

    private isIntegrityViolation(error: any): boolean {
        // Handle Postgres custom exceptions (P0001..P0004) and generic constraint violations (P2004)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const sqlState = (error.meta as any)?.db_error_code || '';
            if (['P0001', 'P0002', 'P0003', 'P0004', 'P2004'].includes(sqlState || error.code)) {
                return true;
            }
        }

        // Check message text for any error type (Known or Unknown)
        // This handles explicit RAISE EXCEPTION from triggers
        const msg = error?.message || '';
        return msg.includes('IMBALANCED_ENTRY') ||
            msg.includes('INCOMPLETE_ENTRY') ||
            msg.includes('P0004') || // READ_ONLY code in message
            msg.includes('READ_ONLY') || // explicit text
            msg.includes('check constraint') || // Generic constraint violation
            msg.includes('constraint'); // Broadest check
    }

    private async triggerTenantPanic(companyId: string, reason: string) {
        try {
            // OPTIMIZATION: Use updateMany to minimize locking overhead and deadlocks during panic storms
            // This is safer than Raw SQL regarding column names.
            const result = await this.prisma.tenantState.updateMany({
                where: {
                    companyId: companyId,
                    mode: { not: 'READ_ONLY' }
                },
                data: { mode: 'READ_ONLY' }
            });

            if (result.count > 0) {
                this.logger.warn(`Тенант ${companyId} переведен в режим READ_ONLY по причине: ${reason}`);
            } else {
                // If count is 0, it was already READ_ONLY or didn't exist.
                // We assume it exists. If not, this is a separate issue, but for stress test it exists.
            }
        } catch (panicError) {
            console.error(`Критический сбой: Не удалось заблокировать тенант ${companyId} во время паники!`, panicError);
            this.logger.error(`Критический сбой: Не удалось заблокировать тенант ${companyId} во время паники!`, panicError);
        }
    }

    private async generateLedgerEntries(event: EconomicEvent, amount: Prisma.Decimal, tx: any, scale: number) {
        this.logger.debug(`Generating ledger entries for event ${event.id}`);

        // Получаем правила атрибуции (Pure Logic) 
        // passing explicit amount for attribution logic
        const attributions = CostAttributionRules.getAttributions({
            type: event.type,
            amount: amount.toNumber(),
            metadata: event.metadata
        }) || [];

        // BANKING GUARD: Settlement events MUST NOT result in zero attributions
        if (attributions.length === 0) {
            const isSettlement = resolveJournalPhase(event.type) === 'SETTLEMENT';
            const logMsg = `No attribution rules found for event type ${event.type} (ID: ${event.id})`;

            if (isSettlement) {
                this.logger.error(`КРИТИЧЕСКОЕ НАРУШЕНИЕ: Расчетное событие ${event.type} не породило проводок! Транзакция прервана.`);
                InvariantMetrics.increment('financial_invariant_failures_total');
                throw new Error(`Integrity Violation: Settlement event ${event.type} must have attributions.`);
            }

            this.logger.warn(logMsg);
            return;
        }

        const metadata = event.metadata as any;
        const executionId = metadata?.executionId || null;

        if (!executionId && event.type !== EconomicEventType.OTHER && event.type !== EconomicEventType.BOOTSTRAP) {
            this.logger.warn(`Экономическое событие ${event.id} получено без executionId. Прослеживаемость ограничена.`);
        }

        // Phase 5: Cash Flow Metadata Extraction & Validation
        const cashImpact = !!metadata?.cashImpact;
        const cashAccountId = metadata?.cashAccountId || null;
        const cashDirection = metadata?.cashDirection || null;
        const cashFlowType = metadata?.cashFlowType || null;
        const dueDate = metadata?.dueDate ? new Date(metadata.dueDate) : null;

        // DB-LEVEL GUARDS (Strict Integrity)
        if (cashImpact) {
            if (!cashAccountId || !cashDirection) {
                InvariantMetrics.increment('financial_invariant_failures_total');
                throw new Error(`Нарушение целостности: cashImpact=true требует наличия cashAccountId и cashDirection (Событие ${event.id})`);
            }
        } else {
            if (cashAccountId || cashDirection) {
                InvariantMetrics.increment('financial_invariant_failures_total');
                throw new Error(`Нарушение целостности: cashImpact=false требует отсутствия cashAccountId и cashDirection (Событие ${event.id})`);
            }
        }

        // Create and balance postings
        const normalizedPostings = attributions.map((attr: any) => ({
            ...attr,
            amount: new Prisma.Decimal(new Prisma.Decimal(attr.amount).toFixed(scale, Prisma.Decimal.ROUND_HALF_UP)),
        }));
        assertBalancedPostings(normalizedPostings as any);

        // Ledger Entries creation MUST happen after calculating monotonic sequence
        // INJECTION 4: Critical Serialization Lock
        await (tx as any).$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${event.id}))`);

        const existingEntries = await (tx as any).ledgerEntry.findMany({
            where: { economicEventId: event.id, companyId: event.companyId },
            select: { sequenceNumber: true },
            orderBy: { sequenceNumber: 'desc' },
            take: 1
        });

        let startSeq = existingEntries.length > 0 ? existingEntries[0].sequenceNumber : 0;

        for (const attr of normalizedPostings) {
            startSeq++;
            // BANKING GUARD: Use SECURITY DEFINER function to bypass direct INSERT restriction

            await (tx as any).$executeRaw(
                Prisma.sql`SELECT create_ledger_entry_v1(${event.companyId}, ${event.id}, ${startSeq}::int, ${attr.amount}, ${attr.type}, ${attr.accountCode}, ${executionId})`
            );

            // Also send to Outbox for this entry if needed, but primary projection is done.
        }
    }

    private async getCurrencyScale(currency: string): Promise<number> {
        try {
            const precision = await (this.prisma as any).currencyPrecision.findUnique({
                where: { currency }
            });
            return precision?.scale ?? this.config.get('defaultScale');
        } catch {
            return this.config.get('defaultScale');
        }
    }

    private extractIdempotencyKey(metadata: any): string | null {
        const key = metadata?.idempotencyKey;
        if (typeof key === 'string' && key.trim().length > 0) {
            return key.trim();
        }
        return null;
    }

    private extractReplayKey(dto: IngestEconomicEventDto, normalizedAmount: Prisma.Decimal, idempotencyKey: string | null): string | null {
        const explicitReplayKey = dto.metadata?.replayKey;
        if (typeof explicitReplayKey === 'string' && explicitReplayKey.trim().length > 0) {
            return explicitReplayKey.trim();
        }

        const sourceEventId = dto.metadata?.sourceEventId || dto.metadata?.externalEventId || dto.metadata?.eventId;
        if (typeof sourceEventId === 'string' && sourceEventId.trim().length > 0) {
            return `src:${sourceEventId.trim()}`;
        }

        if (idempotencyKey) {
            return `idem:${idempotencyKey}`;
        }

        const traceId = dto.metadata?.traceId;
        const source = dto.metadata?.source;
        if (typeof traceId === 'string' && traceId.trim().length > 0 && typeof source === 'string' && source.trim().length > 0) {
            const fingerprint = {
                companyId: dto.companyId,
                type: dto.type,
                amount: normalizedAmount.toString(), // Use string representation for stability
                currency: dto.currency || 'RUB',
                source: source.trim(),
                traceId: traceId.trim(),
                fieldId: dto.fieldId || null,
                seasonId: dto.seasonId || null,
                employeeId: dto.employeeId || null,
                metadata: this.sortObjectKeys(dto.metadata || {}), // Deterministic metadata hashing
            };
            const digest = createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
            return `fp:${digest}`;
        }

        return null;
    }

    private sortObjectKeys(obj: any): any {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        return Object.keys(obj).sort().reduce((acc, key) => {
            acc[key] = this.sortObjectKeys(obj[key]);
            return acc;
        }, {} as any);
    }

    private async findExistingDuplicate(
        companyId: string,
        idempotencyKey: string | null,
        replayKey: string | null,
    ): Promise<EconomicEvent | null> {
        if (idempotencyKey) {
            const byIdempotency = await this.prisma.economicEvent.findFirst({
                where: {
                    companyId,
                    metadata: {
                        path: ['idempotencyKey'],
                        equals: idempotencyKey,
                    },
                },
            });
            if (byIdempotency) {
                return byIdempotency;
            }
        }
        if (replayKey) {
            return this.prisma.economicEvent.findFirst({
                where: { companyId, replayKey },
            });
        }
        return null;
    }

    private isUniqueConflict(error: unknown, targetField?: string): boolean {
        const isP2002 = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isP2002 || !targetField) return isP2002;

        const target = (error.meta as any)?.target;
        if (Array.isArray(target)) {
            return target.includes(targetField);
        }
        return target === targetField;
    }

    private validateContractCompatibility(metadata: any, companyId: string): void {
        const source = typeof metadata?.source === 'string' ? metadata.source : null;
        const integrationSources = new Set(['TASK_MODULE', 'HR_MODULE', 'CONSULTING_ORCHESTRATOR']);
        if (!source || !integrationSources.has(source)) {
            return;
        }

        const contractVersion = typeof metadata?.contractVersion === 'string' ? metadata.contractVersion : null;
        const mode = this.config.get('contractCompatibilityMode');
        const supported = contractVersion
            ? (FINANCE_INGEST_SUPPORTED_VERSIONS as readonly string[]).includes(contractVersion)
            : false;

        if (supported) {
            return;
        }

        const msg = `Finance ingest contract compatibility violation: company=${companyId}, source=${source}, version=${contractVersion || 'missing'}, supported=${FINANCE_INGEST_SUPPORTED_VERSIONS.join(',')}`;
        if (mode === 'strict') {
            InvariantMetrics.increment('financial_invariant_failures_total');
            throw new BadRequestException(msg);
        }

        this.logger.warn(msg);
    }

    private enrichFinancialMetadata(type: EconomicEventType, metadata: any): Record<string, unknown> {
        const input = metadata && typeof metadata === 'object' ? metadata : {};
        const base = input as Record<string, unknown>;
        return {
            ...base,
            journalPhase: resolveJournalPhase(type),
            settlementRef: resolveSettlementRef(type, base),
        };
    }
}
