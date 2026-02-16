import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { InvariantMetrics } from '../../../../shared/invariants/invariant-metrics';
import { OutboxService } from '../../../../shared/outbox/outbox.service';

@Injectable()
export class ReconciliationJob {
    private readonly logger = new Logger(ReconciliationJob.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly outbox: OutboxService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async run(): Promise<void> {
        const lookbackHours = Number(process.env.FINANCE_RECON_LOOKBACK_HOURS || 24);
        const from = new Date(Date.now() - Math.max(1, lookbackHours) * 60 * 60 * 1000);

        const eventsWithoutLedger = await this.prisma.economicEvent.findMany({
            where: {
                createdAt: { gte: from },
                ledgerEntries: { none: {} },
            },
            select: { id: true, companyId: true, type: true, createdAt: true },
            take: 200,
        });

        const alertPayloads: any[] = [];

        for (const event of eventsWithoutLedger) {
            alertPayloads.push(this.prepareAlert(event.companyId, 'MISSING_LEDGER_ENTRIES', {
                economicEventId: event.id,
                eventType: event.type,
                createdAt: event.createdAt.toISOString(),
            }));
        }

        const candidates = await this.prisma.economicEvent.findMany({
            where: {
                createdAt: { gte: from },
                ledgerEntries: { some: {} },
            },
            select: {
                id: true,
                companyId: true,
                ledgerEntries: {
                    select: {
                        type: true,
                        amount: true,
                    },
                },
            },
            take: 500,
        });

        for (const event of candidates) {
            let debit = 0;
            let credit = 0;
            for (const entry of event.ledgerEntries) {
                const value = Number(entry.amount);
                if (entry.type === 'DEBIT') debit += value;
                if (entry.type === 'CREDIT') credit += value;
            }
            if (Math.abs(debit - credit) > 0.0001) {
                alertPayloads.push(this.prepareAlert(event.companyId, 'DOUBLE_ENTRY_MISMATCH', {
                    economicEventId: event.id,
                    debit,
                    credit,
                    delta: Number((debit - credit).toFixed(4)),
                }));
            }
        }

        if (alertPayloads.length > 0) {
            this.logger.warn(`[RECON] Flushing ${alertPayloads.length} alerts to Outbox`);
            await this.prisma.outboxMessage.createMany({
                data: alertPayloads
            });
        }
    }

    private prepareAlert(companyId: string, anomalyType: string, details: Record<string, unknown>) {
        InvariantMetrics.increment('reconciliation_alerts_total');
        this.logger.error(`[RECON] ${anomalyType} company=${companyId} details=${JSON.stringify(details)}`);

        // Use OutboxService to format the event, but create entry for createMany
        return this.outbox.createEvent(
            `${companyId}:${anomalyType}`,
            'FinanceReconciliation',
            'finance.reconciliation.alert',
            {
                companyId,
                anomalyType,
                details,
                detectedAt: new Date().toISOString(),
            },
        );
    }
}
