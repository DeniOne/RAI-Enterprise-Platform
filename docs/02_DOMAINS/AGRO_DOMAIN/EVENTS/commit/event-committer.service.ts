import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../apps/api/src/shared/prisma/prisma.service';
import { CommittedEvent } from '../event-draft.schema';
import { ControllerMetricsService } from '../../CONTROL/controller-metrics.service';

@Injectable()
export class EventCommitterService {
    private readonly logger = new Logger(EventCommitterService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly controllerMetrics: ControllerMetricsService,
    ) { }

    async commit(event: CommittedEvent) {
        this.logger.log(`Committing event ${event.id} to storage...`);

        // 1) persist (идемпотентно)
        await (this.prisma as any).agroEventCommitted.upsert({
            where: { id: event.id },
            update: {
                tenantId: event.tenantId,
                farmRef: event.farmRef ?? null,
                fieldRef: event.fieldRef ?? null,
                taskRef: event.taskRef ?? null,
                eventType: event.eventType,
                payloadJson: event.payload as any,
                evidenceJson: event.evidence as any,
                timestamp: new Date(event.timestamp),
                committedAt: new Date(event.committedAt),
                committedBy: event.committedBy,
                provenanceHash: event.provenanceHash,
            },
            create: {
                id: event.id,
                tenantId: event.tenantId,
                farmRef: event.farmRef ?? null,
                fieldRef: event.fieldRef ?? null,
                taskRef: event.taskRef ?? null,
                eventType: event.eventType,
                payloadJson: event.payload as any,
                evidenceJson: event.evidence as any,
                timestamp: new Date(event.timestamp),
                committedAt: new Date(event.committedAt),
                committedBy: event.committedBy,
                provenanceHash: event.provenanceHash,
            },
        });

        // 2) trigger metrics/controller
        await this.controllerMetrics.handleCommittedEvent(event);
    }
}