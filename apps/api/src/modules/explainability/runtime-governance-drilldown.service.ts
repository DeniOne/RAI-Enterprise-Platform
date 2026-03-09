import { Injectable } from "@nestjs/common";
import {
  PerformanceMetricType,
  RuntimeGovernanceEventType,
} from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RuntimeGovernanceDrilldownsDto } from "./dto/runtime-governance-drilldowns.dto";
import { RuntimeGovernanceFeatureFlagsService } from "../rai-chat/runtime-governance/runtime-governance-feature-flags.service";

const RUNTIME_ACTIVE_TOOL_CALLS_QUEUE = "runtime_active_tool_calls";

@Injectable()
export class RuntimeGovernanceDrilldownService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlags: RuntimeGovernanceFeatureFlagsService,
  ) {}

  async getDrilldowns(
    companyId: string,
    timeWindowMs: number,
    agentRole?: string,
  ): Promise<RuntimeGovernanceDrilldownsDto> {
    const from = new Date(Date.now() - timeWindowMs);
    const [events, incidents, auditEntries, queueSamples] = await Promise.all([
      this.prisma.runtimeGovernanceEvent.findMany({
        where: {
          companyId,
          createdAt: { gte: from },
          ...(agentRole ? { agentRole } : {}),
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.systemIncident.findMany({
        where: {
          companyId,
          createdAt: { gte: from },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          traceId: true,
          incidentType: true,
          severity: true,
          createdAt: true,
        },
      }),
      this.prisma.aiAuditEntry.findMany({
        where: {
          companyId,
          createdAt: { gte: from },
        },
        select: {
          traceId: true,
          metadata: true,
        },
      }),
      this.prisma.performanceMetric.findMany({
        where: {
          companyId,
          metricType: PerformanceMetricType.QUEUE_SIZE,
          toolName: RUNTIME_ACTIVE_TOOL_CALLS_QUEUE,
          timestamp: { gte: from },
        },
        orderBy: { timestamp: "desc" },
        take: 50,
      }),
    ]);

    const traceToAgent = new Map<string, string>();
    for (const entry of auditEntries) {
      const metadata =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as Record<string, unknown>)
          : null;
      if (typeof metadata?.agentRole === "string") {
        traceToAgent.set(entry.traceId, metadata.agentRole);
      }
    }

    const fallbackMap = new Map<
      string,
      { agentRole: string; fallbackReason: string; count: number; lastSeenAt: string }
    >();
    const budgetMap = new Map<
      string,
      {
        toolName: string;
        agentRole: string | null;
        deniedCount: number;
        degradedCount: number;
        lastSeenAt: string;
      }
    >();
    const qualityDriftHistory: RuntimeGovernanceDrilldownsDto["qualityDriftHistory"] = [];
    const correlation: RuntimeGovernanceDrilldownsDto["correlation"] = [];

    const incidentByTrace = new Map<
      string,
      { incidentType: string; severity: string; createdAt: string }
    >();
    for (const incident of incidents) {
      if (incident.traceId && !incidentByTrace.has(incident.traceId)) {
        incidentByTrace.set(incident.traceId, {
          incidentType: incident.incidentType,
          severity: incident.severity,
          createdAt: incident.createdAt.toISOString(),
        });
      }
    }

    for (const event of events) {
      const resolvedAgentRole =
        event.agentRole ?? (event.traceId ? traceToAgent.get(event.traceId) : null) ?? "unknown";

      if (event.fallbackReason) {
        const key = `${resolvedAgentRole}:${event.fallbackReason}`;
        const current = fallbackMap.get(key) ?? {
          agentRole: resolvedAgentRole,
          fallbackReason: event.fallbackReason,
          count: 0,
          lastSeenAt: event.createdAt.toISOString(),
        };
        current.count += 1;
        current.lastSeenAt = current.lastSeenAt > event.createdAt.toISOString()
          ? current.lastSeenAt
          : event.createdAt.toISOString();
        fallbackMap.set(key, current);
      }

      if (
        event.eventType === RuntimeGovernanceEventType.BUDGET_DENIED ||
        event.eventType === RuntimeGovernanceEventType.BUDGET_DEGRADED
      ) {
        const toolName = event.toolName ?? "runtime";
        const key = `${resolvedAgentRole}:${toolName}`;
        const current = budgetMap.get(key) ?? {
          toolName,
          agentRole: resolvedAgentRole,
          deniedCount: 0,
          degradedCount: 0,
          lastSeenAt: event.createdAt.toISOString(),
        };
        if (event.eventType === RuntimeGovernanceEventType.BUDGET_DENIED) {
          current.deniedCount += 1;
        }
        if (event.eventType === RuntimeGovernanceEventType.BUDGET_DEGRADED) {
          current.degradedCount += 1;
        }
        current.lastSeenAt = current.lastSeenAt > event.createdAt.toISOString()
          ? current.lastSeenAt
          : event.createdAt.toISOString();
        budgetMap.set(key, current);
      }

      if (event.eventType === RuntimeGovernanceEventType.QUALITY_DRIFT_DETECTED) {
        const metadata =
          event.metadata && typeof event.metadata === "object"
            ? (event.metadata as Record<string, unknown>)
            : {};
        qualityDriftHistory.push({
          agentRole: resolvedAgentRole === "unknown" ? null : resolvedAgentRole,
          traceId: event.traceId ?? null,
          recentAvgBsPct: typeof event.value === "number" ? event.value : null,
          baselineAvgBsPct:
            typeof metadata.baselineAvgBsPct === "number"
              ? metadata.baselineAvgBsPct
              : null,
          recommendationType: null,
          createdAt: event.createdAt.toISOString(),
        });
      }

      if (
        event.eventType === RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED ||
        event.eventType === RuntimeGovernanceEventType.FALLBACK_USED ||
        event.eventType === RuntimeGovernanceEventType.POLICY_BLOCKED ||
        event.eventType === RuntimeGovernanceEventType.BUDGET_DENIED ||
        event.eventType === RuntimeGovernanceEventType.BUDGET_DEGRADED
      ) {
        const incident = event.traceId ? incidentByTrace.get(event.traceId) : null;
        correlation.push({
          createdAt: event.createdAt.toISOString(),
          traceId: event.traceId ?? null,
          agentRole: resolvedAgentRole === "unknown" ? null : resolvedAgentRole,
          fallbackReason: event.fallbackReason ?? null,
          recommendationType: event.recommendationType ?? null,
          incidentType: incident?.incidentType ?? null,
          severity: incident?.severity ?? null,
        });
      }
    }

    for (const event of events) {
      if (
        event.eventType !== RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED ||
        !event.traceId
      ) {
        continue;
      }
      const drift = qualityDriftHistory.find((item) => item.traceId === event.traceId);
      if (drift && !drift.recommendationType) {
        drift.recommendationType = event.recommendationType ?? null;
      }
    }

    const queueSaturationTimeline = queueSamples
      .map((sample) => ({
        observedAt: sample.timestamp.toISOString(),
        pressureState: this.resolvePressureState(sample.value),
        totalBacklog: sample.value,
        hottestQueue: sample.toolName ?? null,
      }))
      .sort(
        (left, right) =>
          new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime(),
      );

    return {
      flags: this.featureFlags.getFlags(),
      fallbackHistory: [...fallbackMap.values()]
        .sort((left, right) => right.count - left.count)
        .slice(0, 25),
      qualityDriftHistory: qualityDriftHistory.slice(0, 25),
      budgetHotspots: [...budgetMap.values()]
        .sort(
          (left, right) =>
            right.deniedCount +
            right.degradedCount -
            (left.deniedCount + left.degradedCount),
        )
        .slice(0, 25),
      queueSaturationTimeline,
      correlation: correlation.slice(0, 50),
    };
  }

  private resolvePressureState(
    totalBacklog: number,
  ): "IDLE" | "STABLE" | "PRESSURED" | "SATURATED" {
    if (totalBacklog <= 0) {
      return "IDLE";
    }
    if (totalBacklog >= 8) {
      return "SATURATED";
    }
    if (totalBacklog >= 4) {
      return "PRESSURED";
    }
    return "STABLE";
  }
}
