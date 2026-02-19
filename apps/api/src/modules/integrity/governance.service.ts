import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { GovernanceLockReason, RiskType, RiskLevel, Controllability, LiabilityMode, PrismaClient } from '@rai/prisma-client';
import { TelegramNotificationService } from '../telegram/telegram-notification.service';
import { AuditService } from './audit.service';
import { ContractType } from '@rai/regenerative-engine';

@Injectable()
export class GovernanceService {
    private readonly logger = new Logger(GovernanceService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly telegram: TelegramNotificationService,
        private readonly audit: AuditService
    ) { }

    /**
     * Triggers an Emergency Governance Lock (I41 / I34 Violation).
     */
    async triggerEmergencyLock(
        fieldId: string,
        companyId: string,
        reason: GovernanceLockReason,
        details: string,
        contractType: ContractType,
        actorId: string = 'SYSTEM'
    ) {
        this.logger.error(`[GOVERNANCE] EMERGENCY LOCK TRIGGERED for Field ${fieldId}. Reason: ${reason}`);

        // Get current active season for the field via TechMap
        const activeTechMap = await this.prisma.techMap.findFirst({
            where: { fieldId, companyId, status: 'ACTIVE' },
            select: { seasonId: true }
        });

        if (!activeTechMap) {
            this.logger.warn(`[GOVERNANCE] No active TechMap found for field ${fieldId}. Using fallback logic.`);
        }

        const seasonId = activeTechMap?.seasonId || 'SYSTEM_FALLBACK_SEASON';

        // Liability Tagging based on Contract Type (Level E Canon)
        const liabilityMode = contractType === ContractType.MANAGED_REGENERATIVE
            ? LiabilityMode.CONSULTANT_ONLY
            : LiabilityMode.CLIENT_ONLY;

        // 1. Create Governance Lock
        await this.prisma.governanceLock.upsert({
            where: { fieldId },
            update: {
                isActive: true,
                lockedAt: new Date(),
                reason,
                recoverySeasons: 2
            },
            create: {
                fieldId,
                companyId,
                isActive: true,
                reason,
                recoverySeasons: 2
            }
        });

        // 2. Record Immutable Audit Event (I31 Compliance)
        await this.audit.recordGovernanceEvent({
            fieldId,
            companyId,
            eventType: 'EMERGENCY_LOCK',
            actorId,
            details: { reason, details, contractType, liabilityMode }
        });

        // 3. Create Critical Risk with Liability Tag
        await this.prisma.cmrRisk.create({
            data: {
                companyId,
                seasonId,
                type: RiskType.REGULATORY,
                description: `[GOVERNANCE-ESCALATION] Emergency lock on field ${fieldId}. ${details}`,
                probability: RiskLevel.CRITICAL,
                impact: RiskLevel.CRITICAL,
                controllability: Controllability.CONSULTANT,
                liabilityMode,
                status: "OPEN"
            }
        });

        await this.telegram.sendToGroup(`🚨 *EMERGENCY GOVERNANCE LOCK* 🚨\n\nField: ${fieldId}\nReason: ${reason}\nDetails: ${details}\nLiability: ${liabilityMode}\n\n*Action required by Risk Committee.*`, 'COMMITTEE_GROUP_ID');
    }

    /**
     * Processes Regenerative Risks (Level E v2.0 Severity Matrix)
     */
    async processRegenerativeRisk(
        companyId: string,
        fieldId: string,
        rLevel: 'R1' | 'R2' | 'R3' | 'R4',
        details: string,
        contractType: ContractType
    ) {
        const isManagedMode = contractType === ContractType.MANAGED_REGENERATIVE;
        const liabilityMode = isManagedMode ? LiabilityMode.CONSULTANT_ONLY : LiabilityMode.CLIENT_ONLY;

        switch (rLevel) {
            case 'R4':
                // Hard Lock in Managed Mode, Advisory in others
                if (isManagedMode) {
                    await this.triggerEmergencyLock(fieldId, companyId, GovernanceLockReason.DEGRADATION_I34, `R4 Severe Degradation: ${details}`, contractType);
                } else {
                    await this.audit.recordGovernanceEvent({ fieldId, companyId, eventType: 'ADVISORY_R4', actorId: 'SYSTEM', details: { details, contractType, liabilityMode } });
                    await this.telegram.sendToGroup(`⚠️ *R4 ADVISORY* ⚠️\nSevere degradation on ${fieldId}. Managed mode lock bypassed. Liability: ${liabilityMode}`, 'ADVISORY_GROUP_ID');
                }
                break;
            case 'R3':
                // Formal Escalation to Board with Liability Tag
                const activeTechMapR3 = await this.prisma.techMap.findFirst({
                    where: { fieldId, companyId, status: 'ACTIVE' },
                    select: { seasonId: true }
                });
                const seasonIdR3 = activeTechMapR3?.seasonId || 'SYSTEM_FALLBACK_SEASON';

                await this.prisma.cmrRisk.create({
                    data: {
                        companyId,
                        seasonId: seasonIdR3,
                        type: RiskType.REGULATORY,
                        description: `[R3-ESCALATION] Probability of structural collapse: ${details}. Contract: ${contractType}`,
                        probability: RiskLevel.HIGH,
                        impact: RiskLevel.CRITICAL,
                        controllability: Controllability.SHARED,
                        liabilityMode,
                        status: "OPEN"
                    }
                });
                await this.audit.recordGovernanceEvent({ fieldId, companyId, eventType: 'R3_ESCALATION', actorId: 'SYSTEM', details: { details, contractType, liabilityMode } });
                await this.telegram.sendToGroup(`📈 *R3 ESCALATION* 📈\nRisk Committee review required for field ${fieldId}. Contract: ${contractType}`, 'COMMITTEE_GROUP_ID');
                break;
            case 'R2':
                this.logger.warn(`[R2] Persistent degradation on ${fieldId}: ${details}`);
                await this.audit.recordGovernanceEvent({ fieldId, companyId, eventType: 'R2_WARNING', actorId: 'SYSTEM', details: { details, contractType, liabilityMode } });
                break;
            case 'R1':
                this.logger.log(`[R1] Minor regression on ${fieldId}: ${details}`);
                break;
        }
    }

    /**
     * Checks if an operation is allowed under current governance.
     */
    async isOperationAllowed(fieldId: string): Promise<boolean> {
        const lock = await this.prisma.governanceLock.findFirst({
            where: { fieldId, isActive: true }
        });
        return !lock;
    }
}
