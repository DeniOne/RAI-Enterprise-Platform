import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { FieldObservation, ObservationType } from "@rai/prisma-client";

@Injectable()
export class IntegrityService {
    private readonly logger = new Logger(IntegrityService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly deviationService: DeviationService,
    ) { }

    /**
     * Main entry point for system integrity check.
     * Called whenever a new observation is registered.
     */
    async processObservation(observation: FieldObservation) {
        this.logger.log(`[INTEGRITY] Analyzing observation ${observation.id} (type: ${observation.type})`);

        // 1. Check if this is an Incident or SOS
        if (observation.type === ObservationType.SOS_SIGNAL || this.isDeviation(observation)) {
            await this.handleDeviation(observation);
        }

        // 2. Fact Logging for Finance
        await this.logEconomicFact(observation);

        // 3. Update Risk Profile
        await this.updateFieldRiskProfile(observation);
    }

    private isDeviation(observation: FieldObservation): boolean {
        // Basic logic: SOS is always a deviation. 
        // Further logic would compare vs technology card expectations.
        return observation.type === ObservationType.SOS_SIGNAL;
    }

    private async handleDeviation(observation: FieldObservation) {
        this.logger.warn(`[INTEGRITY] Deviation DETECTED in observation ${observation.id}. Triggering CMR...`);

        // Create DeviationReview automatically (Back-office reaction)
        const review = await this.deviationService.createReview({
            companyId: observation.companyId,
            fieldId: observation.fieldId,
            seasonId: observation.seasonId,
            deviationSummary: `Автоматический инцидент из поля (Тип: ${observation.type}). Требуется решение техсовета.`,
            aiImpactAssessment: "Требуется оценка влияния на урожай",
        });

        // Link observation to the review
        await this.prisma.fieldObservation.update({
            where: { id: observation.id },
            data: { deviationReviewId: review.id },
        });

        this.logger.log(`[INTEGRITY] DeviationReview created: ${review.id}`);
    }

    private async logEconomicFact(observation: FieldObservation) {
        // Placeholder for finance integration
    }

    private async updateFieldRiskProfile(observation: FieldObservation) {
        // Placeholder for risk engine interaction
    }
}
