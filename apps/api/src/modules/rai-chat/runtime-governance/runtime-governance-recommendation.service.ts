import { Injectable } from "@nestjs/common";
import { RuntimeGovernanceEventType } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { AgentReliabilityService } from "./agent-reliability.service";
import { RuntimeGovernanceEventService } from "./runtime-governance-event.service";
import {
  GovernanceRecommendationRecord,
  GovernanceRecommendationType,
} from "./runtime-governance-policy.types";
import { RuntimeGovernancePolicyService } from "./runtime-governance-policy.service";

@Injectable()
export class RuntimeGovernanceRecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueMetrics: QueueMetricsService,
    private readonly agentReliability: AgentReliabilityService,
    private readonly governanceEvents: RuntimeGovernanceEventService,
    private readonly runtimePolicy: RuntimeGovernancePolicyService,
  ) {}

  async handleQualityAlertCreated(params: {
    companyId: string;
    traceId?: string | null;
    recentAvgBsPct: number;
    baselineAvgBsPct: number;
  }): Promise<GovernanceRecommendationRecord | null> {
    const auditEntry = params.traceId
      ? await this.prisma.aiAuditEntry.findFirst({
          where: { companyId: params.companyId, traceId: params.traceId },
          orderBy: { createdAt: "desc" },
          select: { metadata: true },
        })
      : null;
    const agentRole =
      auditEntry?.metadata &&
      typeof auditEntry.metadata === "object" &&
      typeof (auditEntry.metadata as Record<string, unknown>).agentRole === "string"
        ? String((auditEntry.metadata as Record<string, unknown>).agentRole)
        : null;

    const rolePolicy = this.runtimePolicy.getRolePolicy(agentRole);
    const recentAlerts = await this.prisma.qualityAlert.count({
      where: {
        companyId: params.companyId,
        alertType: "BS_DRIFT",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const recommendationType: GovernanceRecommendationType =
      recentAlerts >= 2 ||
      params.recentAvgBsPct >= rolePolicy.thresholds.bsQuarantineThresholdPct
        ? "QUARANTINE_RECOMMENDED"
        : "REVIEW_REQUIRED";

    const recommendation: GovernanceRecommendationRecord = {
      type: recommendationType,
      reason:
        recommendationType === "QUARANTINE_RECOMMENDED"
          ? "repeated_bs_drift"
          : "bs_drift_threshold_exceeded",
      agentRole,
      score: params.recentAvgBsPct,
      traceId: params.traceId ?? null,
      metadata: {
        recentAvgBsPct: params.recentAvgBsPct,
        baselineAvgBsPct: params.baselineAvgBsPct,
        recentAlerts,
      },
    };

    await this.governanceEvents.record({
      companyId: params.companyId,
      traceId: params.traceId ?? null,
      agentRole,
      eventType: RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED,
      recommendationType,
      value: params.recentAvgBsPct,
      metadata: {
        source: "quality_alerting",
        reason: recommendation.reason,
        baselineAvgBsPct: params.baselineAvgBsPct,
        recentAlerts,
      },
    });

    return recommendation;
  }

  async getActiveRecommendations(
    companyId: string,
    timeWindowMs: number,
  ): Promise<GovernanceRecommendationRecord[]> {
    const from = new Date(Date.now() - timeWindowMs);
    const [events, reliability, queuePressure] = await Promise.all([
      this.prisma.runtimeGovernanceEvent.findMany({
        where: {
          companyId,
          eventType: RuntimeGovernanceEventType.GOVERNANCE_RECOMMENDATION_EMITTED,
          createdAt: { gte: from },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.agentReliability.getAgentReliabilitySummary(companyId, timeWindowMs),
      this.queueMetrics.getQueuePressure(companyId, timeWindowMs),
    ]);

    const results: GovernanceRecommendationRecord[] = events.map((event) => ({
      type: (event.recommendationType as GovernanceRecommendationType | null) ?? "NONE",
      reason:
        event.metadata &&
        typeof event.metadata === "object" &&
        typeof (event.metadata as Record<string, unknown>).reason === "string"
          ? String((event.metadata as Record<string, unknown>).reason)
          : "persisted_recommendation",
      agentRole: event.agentRole ?? null,
      score: event.value ?? null,
      traceId: event.traceId ?? null,
      metadata:
        event.metadata && typeof event.metadata === "object"
          ? (event.metadata as Record<string, unknown>)
          : {},
    }));

    for (const agent of reliability) {
      const rolePolicy = this.runtimePolicy.getRolePolicy(agent.agentRole);
      if (
        typeof agent.budgetDeniedRatePct === "number" &&
        agent.budgetDeniedRatePct >= rolePolicy.thresholds.budgetDeniedRateThresholdPct
      ) {
        results.push({
          type: "BUDGET_TUNING_RECOMMENDED",
          reason: "budget_denied_rate_threshold_exceeded",
          agentRole: agent.agentRole,
          score: agent.budgetDeniedRatePct,
          metadata: {
            thresholdPct: rolePolicy.thresholds.budgetDeniedRateThresholdPct,
          },
        });
      }
    }

    if (queuePressure.pressureState === "SATURATED") {
      results.push({
        type: "CONCURRENCY_TUNING_RECOMMENDED",
        reason: "queue_saturation_detected",
        metadata: {
          pressureState: queuePressure.pressureState,
          hottestQueue: queuePressure.hottestQueue,
          totalBacklog: queuePressure.totalBacklog,
        },
      });
    }

    return results.filter((item) => item.type !== "NONE");
  }
}
