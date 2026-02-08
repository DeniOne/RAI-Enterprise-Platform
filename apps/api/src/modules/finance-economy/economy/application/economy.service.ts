import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EconomicEventType, EconomicEvent } from '@prisma/client';
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

@Injectable()
export class EconomyService {
    private readonly logger = new Logger(EconomyService.name);

    constructor(private readonly prisma: PrismaService) { }

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
            /**
             * TODO [ARCH-DECISION]: На этапе B3 проекции создаются синхронно в той же транзакции.
             * В B4/B5 необходимо вынести LedgerProjection в отдельный EventSubscriber/Handler
             * для обеспечения полной изоляции Ingestor от проекций (Event Sourcing Pattern).
             */
            await this.generateLedgerEntries(event, tx);

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

        // Создаем записи в LedgerEntry используя транзакционный контекст
        await tx.ledgerEntry.createMany({
            data: attributions.map((attr) => ({
                economicEventId: event.id,
                amount: attr.amount,
                type: attr.type,
                accountCode: attr.accountCode,
                companyId: event.companyId,
                isImmutable: true,
            })),
        });
    }
}
