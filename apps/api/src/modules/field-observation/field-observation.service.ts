import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import {
    ObservationType,
    ObservationIntent,
    IntegrityStatus,
    Prisma
} from "@rai/prisma-client";

@Injectable()
export class FieldObservationService {
    private readonly logger = new Logger(FieldObservationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly integrityGate: IntegrityGateService,
    ) { }

    /**
     * Создает наблюдение из поля. 
     * Только транспорт для данных, бизнес-логика выполняется в IntegrityGate.
     */
    async createObservation(data: {
        type: ObservationType;
        intent?: ObservationIntent;
        integrityStatus?: IntegrityStatus;
        companyId: string;
        authorId: string;
        fieldId: string;
        seasonId: string;
        taskId?: string;
        content?: string;
        photoUrl?: string;
        voiceUrl?: string;
        coordinates?: any;
        telemetryJson?: any;
    }) {
        this.logger.log(`[FO] Creating observation: ${data.type} (Intent: ${data.intent}) for field ${data.fieldId}`);

        const observation = await this.prisma.fieldObservation.create({
            data: {
                type: data.type,
                intent: data.intent || ObservationIntent.MONITORING,
                integrityStatus: data.integrityStatus || IntegrityStatus.NO_EVIDENCE,
                companyId: data.companyId,
                authorId: data.authorId,
                fieldId: data.fieldId,
                seasonId: data.seasonId,
                taskId: data.taskId,
                content: data.content,
                photoUrl: data.photoUrl,
                voiceUrl: data.voiceUrl,
                coordinates: data.coordinates,
                telemetryJson: data.telemetryJson,
            },
        });

        // Аудит согласно Admission Rules
        await this.audit.log({
            action: "FIELD_OBSERVATION_CREATED",
            // entityType: "FieldObservation", // Removed as per TS error
            // entityId: observation.id, // Removed as per TS error
            userId: data.authorId,
            metadata: {
                type: data.type,
                intent: observation.intent,
                integrityStatus: observation.integrityStatus
            },
        });

        // Передача в Integrity Gate (Policy Enforcement) - АСИНХРОННО
        this.integrityGate.processObservation(observation).catch(err => {
            this.logger.error(`[FO] Integrity Gate processing FAILED for observation ${observation.id}: ${err.message}`);
        });

        return observation;
    }

    async getByTask(taskId: string) {
        return this.prisma.fieldObservation.findMany({
            where: { taskId },
            orderBy: { createdAt: "desc" },
        });
    }
}
