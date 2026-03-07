import { Injectable, Logger } from "@nestjs/common";
import {
  IncidentRunbookAction,
  IncidentRunbookExecutionStatus,
  SystemIncidentStatus,
  SystemIncidentType,
} from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";

export interface LogIncidentParams {
  companyId?: string | null;
  traceId?: string | null;
  incidentType: SystemIncidentType;
  severity: string;
  details?: Record<string, unknown>;
}

export interface ExecuteRunbookParams {
  incidentId: string;
  companyId: string;
  action: IncidentRunbookAction;
  comment?: string;
}

export interface IncidentFeedItem {
  id: string;
  companyId: string | null;
  traceId: string | null;
  incidentType: string;
  status: "OPEN" | "RESOLVED" | "RUNBOOK_EXECUTED";
  severity: string;
  details: unknown;
  createdAt: string;
  resolvedAt: string | null;
  resolveComment: string | null;
}

export interface GovernanceCountersDto {
  crossTenantBreach: number;
  piiLeak: number;
  qualityBsDrift: number;
  autonomyPolicyIncidents: number;
  promptChangeRollback: number;
  openIncidents: number;
  resolvedIncidents: number;
  runbookExecutedIncidents: number;
  byType: Record<string, number>;
}

@Injectable()
export class IncidentOpsService {
  private readonly logger = new Logger(IncidentOpsService.name);

  constructor(private readonly prisma: PrismaService) {}

  logIncident(params: LogIncidentParams): void {
    const { companyId, traceId, incidentType, severity, details = {} } = params;
    void this.prisma.systemIncident
      .create({
        data: {
          companyId: companyId ?? undefined,
          traceId: traceId ?? undefined,
          incidentType,
          status: SystemIncidentStatus.OPEN,
          severity,
          details: details as object,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `logIncident failed type=${incidentType} err=${String((err as Error)?.message ?? err)}`,
        );
      });
  }

  async getIncidentsFeed(
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<IncidentFeedItem[]> {
    const rows = await this.prisma.systemIncident.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: Math.min(100, Math.max(1, limit)),
      skip: Math.max(0, offset),
    });
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      traceId: r.traceId,
      incidentType: this.normalizeIncidentType(r.incidentType, r.details),
      status: r.status,
      severity: r.severity,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      resolveComment: r.resolveComment ?? null,
    }));
  }

  async resolveIncident(
    incidentId: string,
    companyId: string,
    comment: string,
  ): Promise<void> {
    await this.prisma.systemIncident.updateMany({
      where: { id: incidentId, companyId },
      data: {
        status: SystemIncidentStatus.RESOLVED,
        resolvedAt: new Date(),
        resolveComment: comment ?? "",
      },
    });
  }

  async executeRunbook(
    params: ExecuteRunbookParams,
  ): Promise<{ ok: true; result: Record<string, unknown> }> {
    const incident = await this.prisma.systemIncident.findFirst({
      where: { id: params.incidentId, companyId: params.companyId },
    });
    if (!incident) {
      throw new Error("Incident not found");
    }
    if (incident.status !== SystemIncidentStatus.OPEN) {
      throw new Error("Runbook can only be executed for OPEN incidents");
    }

    let result: Record<string, unknown>;
    if (params.action === IncidentRunbookAction.REQUIRE_HUMAN_REVIEW) {
      result = {
        fallback: "require_human_review",
        incidentType: incident.incidentType,
      };
    } else {
      if (incident.incidentType !== SystemIncidentType.PROMPT_CHANGE_ROLLBACK) {
        throw new Error(
          "ROLLBACK_CHANGE_REQUEST runbook is allowed only for PROMPT_CHANGE_ROLLBACK incidents",
        );
      }
      result = await this.rollbackGovernedChange(incident, params.companyId);
    }

    await this.prisma.incidentRunbookExecution.create({
      data: {
        incidentId: incident.id,
        companyId: params.companyId,
        action: params.action,
        status: IncidentRunbookExecutionStatus.EXECUTED,
        comment: params.comment ?? "",
        result: result as object,
      },
    });

    await this.prisma.systemIncident.update({
      where: { id: incident.id },
      data: {
        status: SystemIncidentStatus.RUNBOOK_EXECUTED,
        resolvedAt: new Date(),
        resolveComment: params.comment ?? "",
        details: {
          ...(incident.details as Record<string, unknown>),
          runbookAction: params.action,
          runbookResult: result,
        } as object,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "INCIDENT_RUNBOOK_EXECUTED",
        companyId: params.companyId,
        metadata: {
          incidentId: incident.id,
          traceId: incident.traceId,
          incidentType: incident.incidentType,
          runbookAction: params.action,
          result,
        } as unknown as object,
      },
    });

    return { ok: true, result };
  }

  async getGovernanceCounters(companyId: string): Promise<GovernanceCountersDto> {
    const rows = await this.prisma.systemIncident.findMany({
      where: { companyId },
      select: { incidentType: true, details: true, status: true },
    });
    const byType: Record<string, number> = {};
    let openIncidents = 0;
    let resolvedIncidents = 0;
    let runbookExecutedIncidents = 0;
    for (const r of rows) {
      const type = this.normalizeIncidentType(r.incidentType, r.details);
      byType[type] = (byType[type] ?? 0) + 1;
      if (r.status === SystemIncidentStatus.OPEN) {
        openIncidents += 1;
      } else if (r.status === SystemIncidentStatus.RESOLVED) {
        resolvedIncidents += 1;
      } else if (r.status === SystemIncidentStatus.RUNBOOK_EXECUTED) {
        runbookExecutedIncidents += 1;
      }
    }
    return {
      crossTenantBreach: byType["CROSS_TENANT_BREACH"] ?? 0,
      piiLeak: byType["PII_LEAK"] ?? 0,
      qualityBsDrift: byType["QUALITY_BS_DRIFT"] ?? 0,
      autonomyPolicyIncidents:
        (byType["AUTONOMY_QUARANTINE"] ?? 0) +
        (byType["AUTONOMY_TOOL_FIRST"] ?? 0) +
        (byType["POLICY_BLOCKED_CRITICAL_ACTION"] ?? 0),
      promptChangeRollback: byType["PROMPT_CHANGE_ROLLBACK"] ?? 0,
      openIncidents,
      resolvedIncidents,
      runbookExecutedIncidents,
      byType,
    };
  }

  private normalizeIncidentType(incidentType: string, details: unknown): string {
    if (incidentType !== SystemIncidentType.UNKNOWN) {
      return incidentType;
    }
    let subtype: string | null = null;
    if (details && typeof details === "object") {
      const record = details as Record<string, unknown>;
      if (typeof record.subtype === "string") {
        subtype = record.subtype;
      }
    }
    return subtype ?? incidentType;
  }

  private async rollbackGovernedChange(
    incident: { id: string; details: unknown },
    companyId: string,
  ): Promise<Record<string, unknown>> {
    const details =
      incident.details && typeof incident.details === "object"
        ? (incident.details as Record<string, unknown>)
        : {};
    const changeRequestId =
      typeof details.changeRequestId === "string" ? details.changeRequestId : null;
    if (!changeRequestId) {
      throw new Error("rollback_change_request requires details.changeRequestId");
    }

    const change = await this.prisma.agentConfigChangeRequest.findFirst({
      where: { id: changeRequestId, companyId },
    });
    if (!change) {
      throw new Error("change request not found for runbook rollback");
    }

    const previousConfig =
      change.previousConfig && typeof change.previousConfig === "object"
        ? (change.previousConfig as Record<string, unknown>)
        : null;
    const targetCompanyId = change.scope === "GLOBAL" ? null : companyId;
    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: {
          role: change.role,
          companyId: targetCompanyId,
        },
      },
    });

    if (previousConfig) {
      if (existing) {
        await this.prisma.agentConfiguration.update({
          where: { id: existing.id },
          data: {
            name: previousConfig.name as string,
            systemPrompt: previousConfig.systemPrompt as string,
            llmModel: previousConfig.llmModel as string,
            maxTokens: previousConfig.maxTokens as number,
            isActive: previousConfig.isActive as boolean,
            capabilities: (previousConfig.capabilities as string[]) ?? [],
          },
        });
      } else {
        await this.prisma.agentConfiguration.create({
          data: {
            name: previousConfig.name as string,
            role: change.role,
            systemPrompt: previousConfig.systemPrompt as string,
            llmModel: previousConfig.llmModel as string,
            maxTokens: previousConfig.maxTokens as number,
            isActive: previousConfig.isActive as boolean,
            capabilities: (previousConfig.capabilities as string[]) ?? [],
            companyId: targetCompanyId,
          },
        });
      }
    } else if (existing) {
      await this.prisma.agentConfiguration.delete({
        where: { id: existing.id },
      });
    }

    await this.prisma.agentConfigChangeRequest.update({
      where: { id: change.id },
      data: {
        status: "ROLLED_BACK",
        rollbackStatus: "EXECUTED",
        productionDecision: "ROLLED_BACK",
        rolledBackAt: new Date(),
        rollbackSummary: {
          reason: "runbook_incident_rollback",
          incidentId: incident.id,
          triggeredAt: new Date().toISOString(),
        } as object,
      },
    });

    return {
      fallback: "rollback_change_request",
      changeRequestId: change.id,
      restored: previousConfig ? "previous_config" : "deleted_current_config",
    };
  }
}
