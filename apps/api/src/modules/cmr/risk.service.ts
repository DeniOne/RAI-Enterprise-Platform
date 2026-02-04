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
}
