import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  GovernanceLockReason,
  RiskType,
  RiskLevel,
  Controllability,
  LiabilityMode,
  QuorumStatus,
} from "@rai/prisma-client";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";
import { AuditService } from "./audit.service";
import { ContractType } from "@rai/regenerative-engine";
import { QuorumService } from "./quorum.service";
import * as crypto from "crypto";

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramNotificationService,
    private readonly audit: AuditService,
    private readonly quorum: QuorumService,
  ) {}

  /**
   * Triggers an Emergency Governance Lock (I41 / I34 Violation).
   * PHASE 2.5: Now initiates a Quorum Process for R4.
   */
  async triggerEmergencyLock(
    fieldId: string,
    companyId: string,
    reason: GovernanceLockReason,
    details: string,
    contractType: ContractType,
    actorId: string = "SYSTEM",
  ) {
    this.logger.error(
      `[GOVERNANCE] EMERGENCY LOCK TRIGGERED for Field ${fieldId}. Reason: ${reason}`,
    );

    const activeTechMap = await this.prisma.techMap.findFirst({
      where: { fieldId, companyId, status: "ACTIVE" },
      select: { seasonId: true },
    });

    const seasonId = activeTechMap?.seasonId || "SYSTEM_FALLBACK_SEASON";
    const liabilityMode =
      contractType === ContractType.MANAGED_REGENERATIVE
        ? LiabilityMode.CONSULTANT_ONLY
        : LiabilityMode.CLIENT_ONLY;

    // 1. Create Governance Lock
    await this.prisma.governanceLock.upsert({
      where: { fieldId },
      update: {
        isActive: true,
        lockedAt: new Date(),
        reason,
        recoverySeasons: 2,
      },
      create: {
        fieldId,
        companyId,
        isActive: true,
        reason,
        recoverySeasons: 2,
      },
    });

    // 2. Create Critical Risk
    const risk = await this.prisma.cmrRisk.create({
      data: {
        companyId,
        seasonId,
        type: RiskType.REGULATORY,
        description: `[GOVERNANCE-ESCALATION] Emergency lock on field ${fieldId}. ${details}`,
        probability: RiskLevel.CRITICAL,
        impact: RiskLevel.CRITICAL,
        status: "OPEN",
        liabilityMode,
        controllability: Controllability.CONSULTANT,
      },
    });

    // 3. PHASE 2.5: Initiate Quorum Process (Mandatory for R4)
    const traceId = `r4-${fieldId}-${crypto.randomBytes(4).toString("hex")}`;
    const committee = await this.prisma.governanceCommittee.findFirst({
      where: { name: "Risk Committee", companyId },
      orderBy: { version: "desc" },
    });

    if (committee) {
      await this.quorum.createQuorumProcess(
        {
          traceId,
          committeeId: committee.id,
          committeeVersion: committee.version,
          cmrRiskId: risk.id,
        },
        companyId,
      );
    }

    // 4. Record Audit & Notify
    await this.audit.recordGovernanceEvent({
      fieldId,
      companyId,
      eventType: "EMERGENCY_LOCK",
      actorId,
      details: { reason, details, contractType, liabilityMode, traceId },
    });

    await this.telegram.sendToGroup(
      `🚨 *EMERGENCY GOVERNANCE LOCK* 🚨\n\nField: ${fieldId}\nReason: ${reason}\nTraceId: ${traceId}\nLiability: ${liabilityMode}\n\n*Action required by Risk Committee.*`,
      "COMMITTEE_GROUP_ID",
    );
  }

  /**
   * Processes Regenerative Risks (Level E v2.0 Severity Matrix)
   */
  async processRegenerativeRisk(
    companyId: string,
    fieldId: string,
    rLevel: "R1" | "R2" | "R3" | "R4",
    details: string,
    contractType: ContractType,
  ) {
    const isManagedMode = contractType === ContractType.MANAGED_REGENERATIVE;
    const liabilityMode = isManagedMode
      ? LiabilityMode.CONSULTANT_ONLY
      : LiabilityMode.CLIENT_ONLY;

    switch (rLevel) {
      case "R4":
        if (isManagedMode) {
          await this.triggerEmergencyLock(
            fieldId,
            companyId,
            GovernanceLockReason.DEGRADATION_I34,
            `R4 Severe Degradation: ${details}`,
            contractType,
          );
        } else {
          await this.audit.recordGovernanceEvent({
            fieldId,
            companyId,
            eventType: "ADVISORY_R4",
            actorId: "SYSTEM",
            details: { details, contractType, liabilityMode },
          });
          await this.telegram.sendToGroup(
            `⚠️ *R4 ADVISORY* ⚠️\nSevere degradation on ${fieldId}. Managed mode lock bypassed.`,
            "ADVISORY_GROUP_ID",
          );
        }
        break;
      case "R3":
        const activeTechMapR3 = await this.prisma.techMap.findFirst({
          where: { fieldId, companyId, status: "ACTIVE" },
          select: { seasonId: true },
        });
        const seasonIdR3 =
          activeTechMapR3?.seasonId || "SYSTEM_FALLBACK_SEASON";

        const riskR3 = await this.prisma.cmrRisk.create({
          data: {
            companyId,
            seasonId: seasonIdR3,
            type: RiskType.REGULATORY,
            description: `[R3-ESCALATION] Probability of structural collapse: ${details}.`,
            probability: RiskLevel.HIGH,
            impact: RiskLevel.CRITICAL,
            status: "OPEN",
            liabilityMode,
            controllability: Controllability.SHARED,
          },
        });

        // PHASE 2.5: Initiate Quorum Process for R3 Escalation
        const traceIdR3 = `r3-${fieldId}-${crypto.randomBytes(4).toString("hex")}`;
        const committeeR3 = await this.prisma.governanceCommittee.findFirst({
          where: { name: "Risk Committee", companyId },
          orderBy: { version: "desc" },
        });

        if (committeeR3) {
          await this.quorum.createQuorumProcess(
            {
              traceId: traceIdR3,
              committeeId: committeeR3.id,
              committeeVersion: committeeR3.version,
              cmrRiskId: riskR3.id,
            },
            companyId,
          );
        }

        await this.audit.recordGovernanceEvent({
          fieldId,
          companyId,
          eventType: "R3_ESCALATION",
          actorId: "SYSTEM",
          details: { details, contractType, liabilityMode, traceId: traceIdR3 },
        });
        await this.telegram.sendToGroup(
          `📈 *R3 ESCALATION* 📈\nQuorum required for field ${fieldId}. TraceId: ${traceIdR3}`,
          "COMMITTEE_GROUP_ID",
        );
        break;
      case "R2":
        this.logger.warn(
          `[R2] Persistent degradation on ${fieldId}: ${details}`,
        );
        await this.audit.recordGovernanceEvent({
          fieldId,
          companyId,
          eventType: "R2_WARNING",
          actorId: "SYSTEM",
          details: { details, contractType, liabilityMode },
        });
        break;
      case "R1":
        this.logger.log(`[R1] Minor regression on ${fieldId}: ${details}`);
        break;
    }
  }

  /**
   * Checks if an operation is allowed under current governance.
   */
  async isOperationAllowed(fieldId: string): Promise<boolean> {
    const lock = await this.prisma.governanceLock.findFirst({
      where: { fieldId, isActive: true },
    });
    return !lock;
  }
}
