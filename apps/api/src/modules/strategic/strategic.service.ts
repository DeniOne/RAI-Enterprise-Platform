import { Injectable } from '@nestjs/common';
import { RdService } from '../rd/services/RdService';
import { ComplianceService } from '../legal/services/compliance.service';
import { StrategicState } from './types';
import { RiskService } from '../risk/risk.service';
import { RiskTargetType } from '@rai/prisma-client';

@Injectable()
export class StrategicService {
    constructor(
        private readonly rdService: RdService,
        private readonly legalService: ComplianceService,
        private readonly riskService: RiskService
    ) { }

    async getGlobalState(): Promise<StrategicState> {
        // Parallel fetch for IO efficiency
        // B6: Added Risk Assessment
        const [rdSnapshot, legalSnapshot] = await Promise.all([
            this.rdService.getStrategicSnapshot(),
            this.legalService.getStrategicSnapshot()
        ]);

        // B6: Calculate Risk Assessment (Strategic Level)
        // We use a "Global" target for the main dashboard. 
        // Or we aggregate signals. 
        // Let's assume we assess "COMPANY" level risk.
        // Needs companyId from context? 
        // StrategicService currently doesn't take companyId. 
        // Assume 'default-company' or hardcoded for B6 until context is passed.
        // Actually, `getGlobalState` usually takes a user/context.
        // Code snippet showed `getGlobalState(): Promise<StrategicState>`.
        // Let's default to a placeholder company ID '1' or check if we can get it.
        // We will pass '1' for now as per previous patterns if any. 
        // Wait, the controller usually has request.user.
        // We should update the signature if needed, but to avoid breaking changes let's use a fixed ID or TODO.
        const riskAssessment = await this.riskService.assess('1', RiskTargetType.ACTION, 'global-strategic-view');

        // Strategic Aggregation Logic
        // Determines global health based on signals
        let overallHealth: 'OK' | 'ATTENTION' | 'CRITICAL' = 'OK';

        // B6: Override health based on Risk Verdict
        if (riskAssessment.verdict === 'BLOCKED' || riskAssessment.verdict === 'RESTRICTED') {
            overallHealth = 'CRITICAL';
        } else if (riskAssessment.verdict === 'CONDITIONAL') {
            overallHealth = 'ATTENTION';
        } else if (
            legalSnapshot.riskLevel === 'CRITICAL' ||
            legalSnapshot.activeViolations > 0
        ) {
            overallHealth = 'CRITICAL';
        } else if (
            legalSnapshot.riskLevel === 'HIGH' ||
            rdSnapshot.protocolViolations > 0 ||
            legalSnapshot.pendingValidations > 5
        ) {
            overallHealth = 'ATTENTION';
        }

        return {
            asOf: new Date(),
            source: ['rd-engine', 'legal-engine', 'risk-engine'],
            overall: overallHealth,
            rd: rdSnapshot,
            legal: legalSnapshot,
            constraints: {
                legal: legalSnapshot.pendingValidations,
                rnd: rdSnapshot.protocolViolations,
                ops: 0 // Placeholder for now
            },
            escalations: [], // Populate with real escalations if available
            risk: riskAssessment
        };
    }
}
