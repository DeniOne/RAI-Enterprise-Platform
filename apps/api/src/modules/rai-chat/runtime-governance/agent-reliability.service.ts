import { Injectable } from "@nestjs/common";
import { PerformanceMetricType, RuntimeGovernanceEventType } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import {
  GovernanceRecommendationType,
} from "../../../shared/rai-chat/runtime-governance-policy.types";

export interface AgentReliabilitySummary {
  agentRole: string;
  executionCount: number;
  successRatePct: number | null;
  fallbackRatePct: number | null;
  budgetDeniedRatePct: number | null;
  budgetDegradedRatePct: number | null;
  policyBlockRatePct: number | null;
  needsMoreDataRatePct: number | null;
  toolFailureRatePct: number | null;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
  avgBsScorePct: number | null;
  avgEvidenceCoveragePct: number | null;
  incidentCount: number;
  lastRecommendation: GovernanceRecommendationType | null;
}

interface AuditEntryMeta {
  agentRole?: string;
  fallbackUsed?: boolean;
  validation?: {
    passed?: boolean;
    reasons?: string[];
  };
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

@Injectable()
export class AgentReliabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentReliabilitySummary(
    companyId: string,
    timeWindowMs: number,
  ): Promise<AgentReliabilitySummary[]> {
    const from = new Date(Date.now() - timeWindowMs);
    const [auditEntries, performanceMetrics, governanceEvents, traceSummaries, incidents] =
      await Promise.all([
        this.prisma.aiAuditEntry.findMany({
          where: { companyId, createdAt: { gte: from } },
          select: {
            traceId: true,
            metadata: true,
          },
        }),
        this.prisma.performanceMetric.findMany({
          where: {
            companyId,
            timestamp: { gte: from },
            metricType: { in: [PerformanceMetricType.LATENCY, PerformanceMetricType.ERROR_RATE] },
          },
          select: {
            metricType: true,
            value: true,
            agentRole: true,
            toolName: true,
          },
        }),
        this.prisma.runtimeGovernanceEvent.findMany({
          where: { companyId, createdAt: { gte: from } },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.traceSummary.findMany({
          where: { companyId, createdAt: { gte: from } },
          select: {
            traceId: true,
            bsScorePct: true,
            evidenceCoveragePct: true,
          },
        }),
        this.prisma.systemIncident.findMany({
          where: { companyId, createdAt: { gte: from } },
          select: {
            traceId: true,
          },
        }),
      ]);

    const traceToAgent = new Map<string, string>();
    const summaries = new Map<string, AgentReliabilitySummary>();

    const ensure = (agentRole: string): AgentReliabilitySummary => {
      const existing = summaries.get(agentRole);
      if (existing) {
        return existing;
      }
      const created: AgentReliabilitySummary = {
        agentRole,
        executionCount: 0,
        successRatePct: null,
        fallbackRatePct: null,
        budgetDeniedRatePct: null,
        budgetDegradedRatePct: null,
        policyBlockRatePct: null,
        needsMoreDataRatePct: null,
        toolFailureRatePct: null,
        avgLatencyMs: null,
        p95LatencyMs: null,
        avgBsScorePct: null,
        avgEvidenceCoveragePct: null,
        incidentCount: 0,
        lastRecommendation: null,
      };
      summaries.set(agentRole, created);
      return created;
    };

    const counters = new Map<
      string,
      {
        fallback: number;
        success: number;
        budgetDenied: number;
        budgetDegraded: number;
        policyBlocked: number;
        needsMoreData: number;
        toolFailure: number;
        latencies: number[];
        bsScores: number[];
        evidenceCoverages: number[];
      }
    >();

    const ensureCounters = (agentRole: string) => {
      const existing = counters.get(agentRole);
      if (existing) {
        return existing;
      }
      const created = {
        fallback: 0,
        success: 0,
        budgetDenied: 0,
        budgetDegraded: 0,
        policyBlocked: 0,
        needsMoreData: 0,
        toolFailure: 0,
        latencies: [] as number[],
        bsScores: [] as number[],
        evidenceCoverages: [] as number[],
      };
      counters.set(agentRole, created);
      return created;
    };

    for (const entry of auditEntries) {
      const meta =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as AuditEntryMeta)
          : {};
      const agentRole = typeof meta.agentRole === "string" ? meta.agentRole : null;
      if (!agentRole) {
        continue;
      }
      traceToAgent.set(entry.traceId, agentRole);
      ensure(agentRole).executionCount += 1;
      const agentCounters = ensureCounters(agentRole);
      if (meta.fallbackUsed) {
        agentCounters.fallback += 1;
      }
      const validationPassed = meta.validation?.passed === true;
      if (validationPassed && !meta.fallbackUsed) {
        agentCounters.success += 1;
      }
    }

    for (const metric of performanceMetrics) {
      const agentRole = metric.agentRole ?? "unknown";
      ensure(agentRole);
      const agentCounters = ensureCounters(agentRole);
      if (metric.metricType === PerformanceMetricType.LATENCY) {
        agentCounters.latencies.push(metric.value);
      }
    }

    for (const summary of traceSummaries) {
      const agentRole = traceToAgent.get(summary.traceId);
      if (!agentRole) {
        continue;
      }
      ensure(agentRole);
      const agentCounters = ensureCounters(agentRole);
      if (typeof summary.bsScorePct === "number") {
        agentCounters.bsScores.push(summary.bsScorePct);
      }
      if (typeof summary.evidenceCoveragePct === "number") {
        agentCounters.evidenceCoverages.push(summary.evidenceCoveragePct);
      }
    }

    for (const incident of incidents) {
      const agentRole = incident.traceId ? traceToAgent.get(incident.traceId) : null;
      if (!agentRole) {
        continue;
      }
      ensure(agentRole).incidentCount += 1;
    }

    for (const event of governanceEvents) {
      const agentRole = event.agentRole ?? (event.traceId ? traceToAgent.get(event.traceId) : null);
      if (!agentRole) {
        continue;
      }
      ensure(agentRole);
      const agentCounters = ensureCounters(agentRole);
      switch (event.eventType) {
        case RuntimeGovernanceEventType.BUDGET_DENIED:
          agentCounters.budgetDenied += 1;
          break;
        case RuntimeGovernanceEventType.BUDGET_DEGRADED:
          agentCounters.budgetDegraded += 1;
          break;
        case RuntimeGovernanceEventType.POLICY_BLOCKED:
        case RuntimeGovernanceEventType.PENDING_ACTION_CREATED:
          agentCounters.policyBlocked += 1;
          break;
        case RuntimeGovernanceEventType.NEEDS_MORE_DATA:
          agentCounters.needsMoreData += 1;
          break;
        case RuntimeGovernanceEventType.TOOL_FAILURE:
          agentCounters.toolFailure += 1;
          break;
        case RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED:
          if (event.recommendationType) {
            ensure(agentRole).lastRecommendation =
              event.recommendationType as GovernanceRecommendationType;
          }
          break;
        default:
          break;
      }
    }

    for (const [agentRole, summary] of summaries.entries()) {
      const agentCounters = ensureCounters(agentRole);
      const denominator = summary.executionCount;
      const sortedLatencies = [...agentCounters.latencies].sort((a, b) => a - b);
      summary.successRatePct = pct(agentCounters.success, denominator);
      summary.fallbackRatePct = pct(agentCounters.fallback, denominator);
      summary.budgetDeniedRatePct = pct(agentCounters.budgetDenied, denominator);
      summary.budgetDegradedRatePct = pct(agentCounters.budgetDegraded, denominator);
      summary.policyBlockRatePct = pct(agentCounters.policyBlocked, denominator);
      summary.needsMoreDataRatePct = pct(agentCounters.needsMoreData, denominator);
      summary.toolFailureRatePct = pct(agentCounters.toolFailure, denominator);
      summary.avgLatencyMs =
        agentCounters.latencies.length > 0
          ? Number(
              (
                agentCounters.latencies.reduce((sum, value) => sum + value, 0) /
                agentCounters.latencies.length
              ).toFixed(1),
            )
          : null;
      summary.p95LatencyMs =
        sortedLatencies.length > 0
          ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ??
            sortedLatencies[sortedLatencies.length - 1]
          : null;
      summary.avgBsScorePct =
        agentCounters.bsScores.length > 0
          ? Number(
              (
                agentCounters.bsScores.reduce((sum, value) => sum + value, 0) /
                agentCounters.bsScores.length
              ).toFixed(1),
            )
          : null;
      summary.avgEvidenceCoveragePct =
        agentCounters.evidenceCoverages.length > 0
          ? Number(
              (
                agentCounters.evidenceCoverages.reduce((sum, value) => sum + value, 0) /
                agentCounters.evidenceCoverages.length
              ).toFixed(1),
            )
          : null;
    }

    return [...summaries.values()].sort((left, right) => {
      const byFallback = (right.fallbackRatePct ?? -1) - (left.fallbackRatePct ?? -1);
      if (byFallback !== 0) {
        return byFallback;
      }
      const byBs = (right.avgBsScorePct ?? -1) - (left.avgBsScorePct ?? -1);
      if (byBs !== 0) {
        return byBs;
      }
      return right.incidentCount - left.incidentCount;
    });
  }
}
