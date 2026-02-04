import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RiskType, RiskLevel, Controllability, LiabilityMode } from '@prisma/client';

@Injectable()
export class RiskService {
    constructor(private readonly prisma: PrismaService) { }

    async assessRisk(context: any) {
        // Auto-classification logic placeholder
        // In reality, this checks historical data or external API
        return {
            type: RiskType.AGRONOMIC,
            probability: RiskLevel.MEDIUM,
            impact: RiskLevel.HIGH,
        };
    }

    async proposeInsurance(riskId: string) {
        const risk = await this.prisma.cmrRisk.findUnique({ where: { id: riskId } });
        if (risk && risk.controllability === Controllability.FORCE_MAJEURE && risk.impact === RiskLevel.HIGH) {
            // Check if policies exist
            const policies = await this.prisma.insuranceCoverage.findMany({
                where: { companyId: risk.companyId, status: 'ACTIVE' }
            });
            return policies;
        }
        return [];
    }

    /**
     * Strategic integration: Directly consume human capital tactical signals.
     * Decoupled architecture: CMR reads snapshots from the shared repository, 
     * but does NOT depend on HR services.
     */
    async calculateHumanCapitalRisk(employeeId: string) {
        // NOTE: This is a baseline rule.
        // Final risk calculation will consider:
        // - trend deltas (is burnout increasing?)
        // - confidence level (how accurate is this signal?)
        // - multiple snapshots over time (averaging/weighting)
        const snapshot = await this.prisma.humanAssessmentSnapshot.findFirst({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });

        if (!snapshot) return RiskLevel.LOW;

        /**
         * Strategic risk evaluation: 
         * Currently binary for Phase 1, but acknowledges probabilistic nature.
         */
        const isHighBurnout = snapshot.burnoutRisk === RiskLevel.HIGH;
        const isEthicallyMisaligned = snapshot.ethicalAlignment < 0.4;
        const hasLowConfidence = snapshot.confidenceLevel < 0.3;

        // If confidence is extremely low, we treat it as a Medium risk signal for further investigation
        if (hasLowConfidence) return RiskLevel.MEDIUM;

        if (isHighBurnout || isEthicallyMisaligned) {
            return RiskLevel.HIGH;
        }

        return snapshot.burnoutRisk;
    }
}
