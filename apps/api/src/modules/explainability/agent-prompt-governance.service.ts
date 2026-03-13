import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import {
  AgentCanaryStatus,
  AgentConfigChangeScope,
  AgentConfigChangeStatus,
  AgentProductionDecision,
  AgentRollbackStatus,
  type AgentConfigChangeRequest,
  type Prisma,
} from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { CanaryService } from "../adaptive-learning/services/canary.service";
import { AgentManagementService } from "./agent-management.service";
import type {
  AgentConfigChangeRequestDto,
  CanaryReviewDto,
  UpsertAgentConfigDto,
} from "../../shared/explainability/agent-config.dto";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import { IncidentOpsService } from "../rai-chat/incident-ops.service";
import { SystemIncidentType } from "@rai/prisma-client";

const stringify = require("fast-json-stable-stringify") as (value: unknown) => string;

function toChangeDto(
  row: AgentConfigChangeRequest,
): AgentConfigChangeRequestDto {
  return {
    id: row.id,
    role: row.role as AgentConfigChangeRequestDto["role"],
    scope: row.scope,
    targetVersion: row.targetVersion,
    status: row.status,
    evalVerdict: row.evalVerdict,
    canaryStatus: row.canaryStatus,
    rollbackStatus: row.rollbackStatus,
    productionDecision: row.productionDecision,
    requestedConfig: row.requestedConfig as unknown as UpsertAgentConfigDto,
    promotedAt: row.promotedAt,
    rolledBackAt: row.rolledBackAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class AgentPromptGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configGuard: AgentConfigGuardService,
    private readonly canaryService: CanaryService,
    private readonly agentManagement: AgentManagementService,
    private readonly incidentOps: IncidentOpsService,
  ) {}

  async createChangeRequest(
    companyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
  ): Promise<AgentConfigChangeRequestDto> {
    const configScope =
      scope === "global"
        ? AgentConfigChangeScope.GLOBAL
        : AgentConfigChangeScope.TENANT;
    const targetVersion = this.buildTargetVersion(dto, configScope);
    const evalResult = await this.configGuard.evaluateChange(companyId, dto);
    const previousConfig = await this.agentManagement.getStoredConfigSnapshot(
      companyId,
      dto.role,
      scope,
    );
    const status =
      !evalResult || evalResult.verdict === "APPROVED"
        ? AgentConfigChangeStatus.READY_FOR_CANARY
        : AgentConfigChangeStatus.EVAL_FAILED;
    const productionDecision =
      !evalResult || evalResult.verdict === "APPROVED"
        ? AgentProductionDecision.PENDING
        : AgentProductionDecision.REJECTED;

    const row = await this.prisma.agentConfigChangeRequest.upsert({
      where: {
        agent_config_change_company_role_version_unique: {
          companyId,
          role: dto.role,
          targetVersion,
        },
      },
      create: {
        companyId,
        role: dto.role,
        scope: configScope,
        targetVersion,
        requestedConfig: dto as unknown as Prisma.InputJsonValue,
        previousConfig: previousConfig as Prisma.InputJsonValue | undefined,
        status,
        evalVerdict: evalResult?.verdict ?? null,
        evalSummary: (evalResult ?? null) as unknown as Prisma.InputJsonValue | undefined,
        evalRunId: evalResult?.id ?? null,
        productionDecision,
      },
      update: {
        requestedConfig: dto as unknown as Prisma.InputJsonValue,
        previousConfig: previousConfig as Prisma.InputJsonValue | undefined,
        status,
        evalVerdict: evalResult?.verdict ?? null,
        evalSummary: (evalResult ?? null) as unknown as Prisma.InputJsonValue | undefined,
        evalRunId: evalResult?.id ?? null,
        canaryStatus: AgentCanaryStatus.NOT_STARTED,
        canarySummary: undefined,
        rollbackStatus: AgentRollbackStatus.NOT_REQUIRED,
        rollbackSummary: undefined,
        productionDecision,
        promotedAt: null,
        rolledBackAt: null,
      },
    });

    if (evalResult?.id) {
      await this.prisma.evalRun.updateMany({
        where: { id: evalResult.id, companyId, changeRequestId: null },
        data: { changeRequestId: row.id },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_CHANGE_REQUESTED",
        companyId,
        metadata: {
          changeRequestId: row.id,
          role: dto.role,
          scope: configScope,
          targetVersion,
          evalVerdict: row.evalVerdict,
          status: row.status,
        },
      },
    });

    return toChangeDto(row);
  }

  async startCanary(
    companyId: string,
    changeId: string,
  ): Promise<AgentConfigChangeRequestDto> {
    const row = await this.getOwnedChange(companyId, changeId);
    if (row.status !== AgentConfigChangeStatus.READY_FOR_CANARY) {
      throw new BadRequestException("Change request is not ready for canary.");
    }

    const updated = await this.prisma.agentConfigChangeRequest.update({
      where: { id: row.id },
      data: {
        status: AgentConfigChangeStatus.CANARY_ACTIVE,
        canaryStatus: AgentCanaryStatus.ACTIVE,
        canarySummary: {
          startedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_CANARY_STARTED",
        companyId,
        metadata: {
          changeRequestId: row.id,
          role: row.role,
        },
      },
    });

    return toChangeDto(updated);
  }

  async reviewCanary(
    companyId: string,
    changeId: string,
    review: CanaryReviewDto,
  ): Promise<AgentConfigChangeRequestDto> {
    const row = await this.getOwnedChange(companyId, changeId);
    if (row.status !== AgentConfigChangeStatus.CANARY_ACTIVE) {
      throw new BadRequestException("Canary review requires CANARY_ACTIVE status.");
    }

    const verdict = this.canaryService.evaluateRejectionRateCanary(
      review.baselineRejectionRate,
      review.canaryRejectionRate,
      review.sampleSize,
    );

    const nextStatus = verdict.rollback
      ? AgentConfigChangeStatus.ROLLED_BACK
      : AgentConfigChangeStatus.APPROVED_FOR_PRODUCTION;
    const nextCanaryStatus = verdict.rollback
      ? AgentCanaryStatus.DEGRADED
      : AgentCanaryStatus.PASSED;
    const nextRollbackStatus = verdict.rollback
      ? AgentRollbackStatus.EXECUTED
      : AgentRollbackStatus.NOT_REQUIRED;
    const productionDecision = verdict.rollback
      ? AgentProductionDecision.ROLLED_BACK
      : AgentProductionDecision.APPROVED;

    const updated = await this.prisma.agentConfigChangeRequest.update({
      where: { id: row.id },
      data: {
        status: nextStatus,
        canaryStatus: nextCanaryStatus,
        canarySummary: {
          ...review,
          ...verdict,
          reviewedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
        rollbackStatus: nextRollbackStatus,
        rollbackSummary: verdict.rollback
          ? ({
              reason: verdict.reason,
              triggeredAt: new Date().toISOString(),
            } as Prisma.InputJsonValue)
          : undefined,
        productionDecision,
        rolledBackAt: verdict.rollback ? new Date() : null,
      },
    });

    if (verdict.rollback) {
      const requestedConfig = row.requestedConfig as unknown as UpsertAgentConfigDto;
      await this.quarantineModelIfPresent(companyId, requestedConfig.llmModel);
      this.incidentOps.logIncident({
        companyId,
        traceId: null,
        incidentType: SystemIncidentType.PROMPT_CHANGE_ROLLBACK,
        severity: "HIGH",
        details: {
          changeRequestId: row.id,
          role: row.role,
          targetVersion: row.targetVersion,
          reason: verdict.reason,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: verdict.rollback
          ? "AGENT_CONFIG_CANARY_ROLLED_BACK"
          : "AGENT_CONFIG_CANARY_APPROVED",
        companyId,
        metadata: {
          changeRequestId: row.id,
          role: row.role,
          verdict,
        },
      },
    });

    return toChangeDto(updated);
  }

  async promoteApprovedChange(
    companyId: string,
    changeId: string,
  ): Promise<AgentConfigChangeRequestDto> {
    const row = await this.getOwnedChange(companyId, changeId);
    if (row.status !== AgentConfigChangeStatus.APPROVED_FOR_PRODUCTION) {
      throw new BadRequestException("Only approved canary changes can be promoted.");
    }

    const requestedConfig = row.requestedConfig as unknown as UpsertAgentConfigDto;
    const applied = await this.agentManagement.applyPromotedAgentConfig(
      companyId,
      requestedConfig,
      row.scope === AgentConfigChangeScope.GLOBAL ? "global" : "tenant",
      {
        changeRequestId: row.id,
        targetVersion: row.targetVersion,
        workflow: "prompt_change_governance",
      },
    );

    const updated = await this.prisma.agentConfigChangeRequest.update({
      where: { id: row.id },
      data: {
        status: AgentConfigChangeStatus.PROMOTED,
        productionDecision: AgentProductionDecision.APPROVED,
        productionConfigId: applied.id,
        promotedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_PROMOTED",
        companyId,
        metadata: {
          changeRequestId: row.id,
          role: row.role,
          productionConfigId: applied.id,
        },
      },
    });

    return toChangeDto(updated);
  }

  async rollbackPromotedChange(
    companyId: string,
    changeId: string,
    reason: string,
  ): Promise<AgentConfigChangeRequestDto> {
    const row = await this.getOwnedChange(companyId, changeId);
    if (
      row.status !== AgentConfigChangeStatus.PROMOTED &&
      row.status !== AgentConfigChangeStatus.APPROVED_FOR_PRODUCTION
    ) {
      throw new BadRequestException("Rollback is available only after approval/promote.");
    }

    await this.agentManagement.restoreStoredConfigSnapshot(
      companyId,
      row.role as UpsertAgentConfigDto["role"],
      row.scope === AgentConfigChangeScope.GLOBAL ? "global" : "tenant",
      (row.previousConfig as UpsertAgentConfigDto | null) ?? null,
    );

    const updated = await this.prisma.agentConfigChangeRequest.update({
      where: { id: row.id },
      data: {
        status: AgentConfigChangeStatus.ROLLED_BACK,
        rollbackStatus: AgentRollbackStatus.EXECUTED,
        rollbackSummary: {
          reason,
          triggeredAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
        productionDecision: AgentProductionDecision.ROLLED_BACK,
        rolledBackAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_ROLLBACK_EXECUTED",
        companyId,
        metadata: {
          changeRequestId: row.id,
          role: row.role,
          reason,
        },
      },
    });

    return toChangeDto(updated);
  }

  private buildTargetVersion(
    dto: UpsertAgentConfigDto,
    scope: AgentConfigChangeScope,
  ): string {
    const canonical = stringify({
      role: dto.role,
      name: dto.name,
      systemPrompt: dto.systemPrompt,
      llmModel: dto.llmModel,
      maxTokens: dto.maxTokens,
      isActive: dto.isActive,
      capabilities: [...dto.capabilities].sort(),
      tools: [...(dto.tools ?? [])].sort(),
      scope,
    });
    return createHash("sha256").update(canonical).digest("hex");
  }

  private async getOwnedChange(
    companyId: string,
    changeId: string,
  ): Promise<AgentConfigChangeRequest> {
    const row = await this.prisma.agentConfigChangeRequest.findFirst({
      where: { id: changeId, companyId },
    });
    if (!row) {
      throw new NotFoundException("Agent config change request not found.");
    }
    return row;
  }

  private async quarantineModelIfPresent(companyId: string, modelName: string) {
    const model = await this.prisma.modelVersion.findFirst({
      where: {
        companyId,
        name: modelName,
      },
      orderBy: { version: "desc" },
      select: { id: true },
    });

    if (!model) {
      return;
    }

    await this.prisma.modelVersion.update({
      where: { id: model.id },
      data: { status: "QUARANTINED" },
    });
  }
}
