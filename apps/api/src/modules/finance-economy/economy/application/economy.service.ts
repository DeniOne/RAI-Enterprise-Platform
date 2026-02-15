import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EconomicEventType, EconomicEvent } from '@rai/prisma-client';
import { CostAttributionRules } from '../domain/rules/cost-attribution.rules';

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
        this.logger.log(`Ingesting economic event: ${dto.type} for company ${dto.companyId}`);

        return this.prisma.$transaction(async (tx) => {
            // 1. Сохранение сырого события
            const event = await tx.economicEvent.create({
                data: {
                    type: dto.type,
                    amount: dto.amount,
                    currency: dto.currency || 'RUB',
                    metadata: dto.metadata,
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
                throw new Error(`Integrity Violation: cashImpact=true requires cashAccountId and cashDirection (Event ${event.id})`);
            }
        } else {
            if (cashAccountId || cashDirection) {
                throw new Error(`Integrity Violation: cashImpact=false requires NULL cashAccountId and cashDirection (Event ${event.id})`);
            }
        }

        // Создаем записи в LedgerEntry используя транзакционный контекст
        await tx.ledgerEntry.createMany({
            data: attributions.map((attr) => ({
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
}
