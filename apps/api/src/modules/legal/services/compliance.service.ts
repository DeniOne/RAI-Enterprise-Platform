import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ComplianceEngine, ImpactMapper } from '@rai/legal-engine';
import { ComplianceStatus, ImpactTargetType } from '@rai/prisma-client';

import { LegalStrategicState } from '../../strategic/types';

@Injectable()
export class ComplianceService {
    private engine: ComplianceEngine;
    private mapper: ImpactMapper;

    constructor(private prisma: PrismaService) {
        this.engine = new ComplianceEngine(this.prisma as any);
        this.mapper = new ImpactMapper(this.prisma as any);
    }

    async runCheck(requirementId: string) {
        return this.engine.checkRequirement(requirementId);
    }

    async getRequirementsForDomain(targetType: ImpactTargetType, companyId: string) {
        return this.mapper.getRequirementsForTarget(targetType, companyId);
    }

    async runCompanyAudit(companyId: string) {
        return this.engine.checkAllForCompany(companyId);
    }

    /**
     * Strategic Read Model Snapshot
     */
    async getStrategicSnapshot(): Promise<LegalStrategicState> {
        // In real impl, we query ComplianceReport table.
        // For BETA, we assume 0 violations until integration tests.
        return {
            activeViolations: 0,
            pendingValidations: 3, // Mock pending validation count
            riskLevel: 'LOW'
        };
    }
}
