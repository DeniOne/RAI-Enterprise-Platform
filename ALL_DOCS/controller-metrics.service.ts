import { Injectable, Logger } from '@nestjs/common';
import { CommittedEvent } from '../EVENTS/commit/committed-event.schema';

import { PrismaService } from '../../../../apps/api/src/shared/prisma/prisma.service';

import { MVP_DEVIATION_RULES, Severity } from './deviation-policy';
import { MetricResult, ControllerMetricKey } from './controller-metrics';

@Injectable()
export class ControllerMetricsService {
    private readonly logger = new Logger(ControllerMetricsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async handleCommittedEvent(event: CommittedEvent): Promise<MetricResult | null> {
        // STEP 1 — Фильтрация
        if (event.eventType !== 'FIELD_OPERATION') return null;

        const payload = event.payload;
        if (payload?.status !== 'COMPLETED') return null;

        if (!event.taskRef) {
            this.logger.warn(`Event ${event.id} is COMPLETED but missing taskRef. Skipping metrics.`);
            return null;
        }

        this.logger.log(`Calculating metrics for completed operation: ${event.taskRef}`);

        // STEP 2 — Получить plannedEnd
        const operation = await this.prisma.mapOperation.findUnique({
            where: { id: event.taskRef },
            select: { plannedEndTime: true }
        });

        if (!operation || !operation.plannedEndTime) {
            this.logger.warn(`Planned task ${event.taskRef} or its plannedEndTime not found for event ${event.id}`);
            return null;
        }

        // STEP 3 — Вычислить delay
        const completedAt = new Date(event.committedAt).getTime();
        const plannedEnd = new Date(operation.plannedEndTime).getTime();

        const diffMs = completedAt - plannedEnd;
        const delayDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const resultDelay = delayDays < 0 ? 0 : delayDays;

        // STEP 4 — Оценка Severity (15.3)
        const { severity } = this.evaluateSeverity('operationDelayDays', resultDelay);

        const explain = `Planned: ${new Date(operation.plannedEndTime).toISOString().split('T')[0]}\n` +
            `Completed: ${new Date(event.committedAt).toISOString().split('T')[0]}\n` +
            `Delay: ${resultDelay} days`;

        const metricResult: MetricResult = {
            metricKey: 'operationDelayDays',
            value: resultDelay,
            severity,
            explain,
            references: {
                taskRef: event.taskRef,
                fieldRef: event.fieldRef,
                eventId: event.id
            }
        };

        this.logger.log(`[MetricResult] ${severity} for ${event.taskRef}: ${resultDelay} days. Explain: ${explain.replace(/\n/g, ' ')}`);

        // STEP 5 — Escalation (15.4)
        const rule = MVP_DEVIATION_RULES.find(r => r.metric === 'operationDelayDays');
        const escalateAt = rule?.escalateAt || 'S3';

        const severityOrder: Severity[] = ['S0', 'S1', 'S2', 'S3', 'S4'];
        const currentIdx = severityOrder.indexOf(severity);
        const targetIdx = severityOrder.indexOf(escalateAt as Severity);

        if (currentIdx >= targetIdx && currentIdx > 0) {
            await this.createEscalation(event.companyId, metricResult);
        }

        return metricResult;
    }

    private async createEscalation(companyId: string, metric: MetricResult) {
        this.logger.warn(`!!! AUTO-ESCALATION !!! ${metric.severity} depth for task ${metric.references.taskRef}`);

        await this.prisma.agroEscalation.create({
            data: {
                companyId,
                metricKey: metric.metricKey,
                severity: metric.severity,
                reason: metric.explain,
                status: 'OPEN',
                references: metric.references as any // taskRef, fieldRef, eventId
            }
        });
    }

    private evaluateSeverity(key: ControllerMetricKey, value: number): { severity: Severity } {
        const rule = MVP_DEVIATION_RULES.find(r => r.metric === key);
        if (!rule) return { severity: 'S0' };

        // Идем от большего к меньшему
        if (value >= rule.s4) return { severity: 'S4' };
        if (value >= rule.s3) return { severity: 'S3' };
        if (value >= rule.s2) return { severity: 'S2' };
        if (value >= rule.s1) return { severity: 'S1' };

        return { severity: 'S0' };
    }
}
