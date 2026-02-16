import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EconomicEventType, EconomicEvent, Prisma } from '@rai/prisma-client';
import { CostAttributionRules } from '../domain/rules/cost-attribution.rules';
import { assertBalancedPostings, resolveJournalPhase, resolveSettlementRef } from '../domain/journal-policy';
import { InvariantMetrics } from '../../../../shared/invariants/invariant-metrics';
import { createHash } from 'crypto';
import { roundMoney } from '../../finance/domain/policies/monetary-rounding.policy';
import { FINANCE_INGEST_SUPPORTED_VERSIONS } from '../../contracts/finance-ingest.contract';

export interface IngestEconomicEventDto {
    type: EconomicEventType;
    amount: number;
    currency?: string;
    metadata?: any;
    fieldId?: string;
    seasonId?: string;
    employeeId?: string;
    companyId: string;
}

import { OutboxService } from '../../../../shared/outbox/outbox.service';

@Injectable()
export class EconomyService {
    private readonly logger = new Logger(EconomyService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly outbox: OutboxService,
    ) { }

    /**
     * EconomicEventIngestor: Шлюз истины.
     * Принимает внешние события и преобразует их в экономические факты.
     */
    async ingestEvent(dto: IngestEconomicEventDto) {
        const panicThreshold = Number(process.env.FINANCIAL_PANIC_THRESHOLD || 5);
        if (InvariantMetrics.shouldTriggerFinancialPanic(panicThreshold)) {
            this.logger.error(
                `FINANCIAL PANIC MODE ACTIVE: blocked ingest for company ${dto.companyId}. threshold=${panicThreshold}`,
            );
            throw new ServiceUnavailableException('Financial panic mode active. Ingest temporarily blocked.');
        }

        const idempotencyKey = this.extractIdempotencyKey(dto.metadata);
        const normalizedAmount = roundMoney(dto.amount);
        const enrichedMetadata = this.enrichFinancialMetadata(dto.type, dto.metadata);
        this.validateContractCompatibility(enrichedMetadata, dto.companyId);
        const replayKey = this.extractReplayKey(dto, idempotencyKey);
        const requireIdempotency = (process.env.FINANCIAL_REQUIRE_IDEMPOTENCY || 'false') === 'true';
        if (requireIdempotency && !idempotencyKey) {
            InvariantMetrics.increment('financial_invariant_failures_total');
            throw new BadRequestException('Idempotency key is required for financial ingest.');
        }

        this.logger.log(`Ingesting economic event: ${dto.type} for company ${dto.companyId}`);

        try {
            return await this.prisma.$transaction(async (tx) => {
            // 1. Сохранение сырого события
            const event = await tx.economicEvent.create({
                data: {
                    type: dto.type,
                    amount: normalizedAmount,
                    currency: dto.currency || 'RUB',
                    replayKey,
                    metadata: enrichedMetadata as Prisma.InputJsonValue,
                    fieldId: dto.fieldId,
                    seasonId: dto.seasonId,
                    employeeId: dto.employeeId,
                    companyId: dto.companyId,
                },
            });

            // 2. Генерация проекций (Ledger Entries)
            // Synchronous for Phase 1 as per strict safety requirements.
            await this.generateLedgerEntries(event, tx);

            // 3. (Refactor Phase 1) Outbox Event for External Consumers
            // Even though Ledger is sync, we emit an event for analytics/notifications.
            await tx.outboxMessage.create({
                data: this.outbox.createEvent(
                    event.id,
                    'EconomicEvent',
                    'finance.economic_event.created',
                    event
                )
            });

                return event;
            });
        } catch (error) {
            if (this.isUniqueConflict(error)) {
                this.logger.warn(
                    `Duplicate/replay financial ingest suppressed (company=${dto.companyId}, idempotencyKey=${idempotencyKey || 'n/a'}, replayKey=${replayKey || 'n/a'})`,
                );
                InvariantMetrics.increment('event_duplicates_prevented_total');
                const existing = await this.findExistingDuplicate(dto.companyId, idempotencyKey, replayKey);
                if (existing) {
                    return existing;
                }
            }
            throw error;
        }
    }

    private async generateLedgerEntries(event: EconomicEvent, tx: any) {
        this.logger.debug(`Generating ledger entries for event ${event.id}`);

        // Получаем правила атрибуции (Pure Logic)
        const attributions = CostAttributionRules.getAttributions(event);

        if (attributions.length === 0) {
            this.logger.warn(`No attribution rules found for event type ${event.type}`);
            return;
        }

        const metadata = event.metadata as any;
        const executionId = metadata?.executionId || null;

        if (!executionId && event.type !== EconomicEventType.OTHER && event.type !== EconomicEventType.BOOTSTRAP) {
            this.logger.warn(`EconomicEvent ${event.id} ingested without executionId. Traceability limited.`);
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
                throw new Error(`Integrity Violation: cashImpact=true requires cashAccountId and cashDirection (Event ${event.id})`);
            }
        } else {
            if (cashAccountId || cashDirection) {
                InvariantMetrics.increment('financial_invariant_failures_total');
                throw new Error(`Integrity Violation: cashImpact=false requires NULL cashAccountId and cashDirection (Event ${event.id})`);
            }
        }

        // Создаем записи в LedgerEntry используя транзакционный контекст
        const normalizedPostings = attributions.map((attr) => ({
            ...attr,
            amount: roundMoney(attr.amount),
        }));
        assertBalancedPostings(normalizedPostings);

        await tx.ledgerEntry.createMany({
            data: normalizedPostings.map((attr) => ({
                economicEventId: event.id,
                amount: attr.amount,
                type: attr.type,
                accountCode: attr.accountCode,
                companyId: event.companyId,
                isImmutable: true,
                executionId: executionId,
                // Cash Flow Projection Data
                cashImpact,
                cashAccountId,
                cashDirection,
                cashFlowType,
                dueDate
            })),
        });
    }

    private extractIdempotencyKey(metadata: any): string | null {
        const key = metadata?.idempotencyKey;
        if (typeof key === 'string' && key.trim().length > 0) {
            return key.trim();
        }
        return null;
    }

    private extractReplayKey(dto: IngestEconomicEventDto, idempotencyKey: string | null): string | null {
        const normalizedAmount = roundMoney(dto.amount);
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
                amount: normalizedAmount,
                currency: dto.currency || 'RUB',
                source: source.trim(),
                traceId: traceId.trim(),
                fieldId: dto.fieldId || null,
                seasonId: dto.seasonId || null,
                employeeId: dto.employeeId || null,
            };
            const digest = createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
            return `fp:${digest}`;
        }

        return null;
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

    private isUniqueConflict(error: unknown): boolean {
        return (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        );
    }

    private validateContractCompatibility(metadata: any, companyId: string): void {
        const source = typeof metadata?.source === 'string' ? metadata.source : null;
        const integrationSources = new Set(['TASK_MODULE', 'HR_MODULE', 'CONSULTING_ORCHESTRATOR']);
        if (!source || !integrationSources.has(source)) {
            return;
        }

        const contractVersion = typeof metadata?.contractVersion === 'string' ? metadata.contractVersion : null;
        const mode = (process.env.FINANCE_CONTRACT_COMPATIBILITY_MODE || 'warn').toLowerCase();
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
