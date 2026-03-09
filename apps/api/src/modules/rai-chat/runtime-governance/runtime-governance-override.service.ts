import { BadRequestException, Injectable } from "@nestjs/common";
import { RuntimeGovernanceEventType, SystemIncidentType } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { AutonomyPolicyService } from "../autonomy-policy.service";
import { IncidentOpsService } from "../incident-ops.service";
import { RuntimeGovernanceEventService } from "./runtime-governance-event.service";

@Injectable()
export class RuntimeGovernanceOverrideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autonomyPolicy: AutonomyPolicyService,
    private readonly incidentOps: IncidentOpsService,
    private readonly governanceEvents: RuntimeGovernanceEventService,
  ) {}

  async setManualAutonomyOverride(params: {
    companyId: string;
    level: "TOOL_FIRST" | "QUARANTINE";
    reason: string;
    userId?: string | null;
  }) {
    await this.prisma.autonomyOverride.updateMany({
      where: {
        companyId: params.companyId,
        isActive: true,
      },
      data: {
        isActive: false,
        clearedAt: new Date(),
        clearedByUserId: params.userId ?? null,
      },
    });

    await this.prisma.autonomyOverride.create({
      data: {
        companyId: params.companyId,
        level: params.level,
        reason: params.reason,
        createdByUserId: params.userId ?? null,
      },
    });

    await this.governanceEvents.record({
      companyId: params.companyId,
      agentRole: "runtime_governance",
      eventType: RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED,
      recommendationType:
        params.level === "QUARANTINE"
          ? "QUARANTINE_RECOMMENDED"
          : "REVIEW_REQUIRED",
      metadata: {
        source: "manual_override",
        overrideLevel: params.level,
        reason: params.reason,
        createdByUserId: params.userId ?? null,
      },
    });

    this.incidentOps.logIncident({
      companyId: params.companyId,
      incidentType:
        params.level === "QUARANTINE"
          ? SystemIncidentType.AUTONOMY_QUARANTINE
          : SystemIncidentType.AUTONOMY_TOOL_FIRST,
      severity: params.level === "QUARANTINE" ? "HIGH" : "MEDIUM",
      details: {
        source: "manual_override",
        reason: params.reason,
        createdByUserId: params.userId ?? null,
      },
    });

    return this.autonomyPolicy.getCompanyAutonomyStatus(params.companyId);
  }

  async clearManualAutonomyOverride(params: {
    companyId: string;
    userId?: string | null;
  }) {
    const updated = await this.prisma.autonomyOverride.updateMany({
      where: {
        companyId: params.companyId,
        isActive: true,
      },
      data: {
        isActive: false,
        clearedAt: new Date(),
        clearedByUserId: params.userId ?? null,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException({
        code: "NO_ACTIVE_MANUAL_OVERRIDE",
        message: "Активный manual autonomy override не найден.",
      });
    }

    await this.governanceEvents.record({
      companyId: params.companyId,
      agentRole: "runtime_governance",
      eventType: RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED,
      recommendationType: "NONE",
      metadata: {
        source: "manual_override_clear",
        clearedByUserId: params.userId ?? null,
      },
    });

    return this.autonomyPolicy.getCompanyAutonomyStatus(params.companyId);
  }
}
