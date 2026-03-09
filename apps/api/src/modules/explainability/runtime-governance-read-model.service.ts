import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AutonomyPolicyService } from "../rai-chat/autonomy-policy.service";
import { QueueMetricsService } from "../rai-chat/performance/queue-metrics.service";
import { AgentReliabilityService } from "../rai-chat/runtime-governance/agent-reliability.service";
import { RuntimeGovernanceRecommendationService } from "../rai-chat/runtime-governance/runtime-governance-recommendation.service";
import { RuntimeGovernanceAgentDto } from "./dto/runtime-governance-agent.dto";
import { RuntimeGovernanceSummaryDto } from "./dto/runtime-governance-summary.dto";

@Injectable()
export class RuntimeGovernanceReadModelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueMetrics: QueueMetricsService,
    private readonly agentReliability: AgentReliabilityService,
    private readonly recommendationService: RuntimeGovernanceRecommendationService,
    private readonly autonomyPolicy: AutonomyPolicyService,
  ) {}

  async getSummary(
    companyId: string,
    timeWindowMs: number,
  ): Promise<RuntimeGovernanceSummaryDto> {
    const from = new Date(Date.now() - timeWindowMs);
    const [queuePressure, reliability, events, incidents, traceSummaries, qualityAlertCount, autonomy] =
      await Promise.all([
        this.queueMetrics.getQueuePressure(companyId, timeWindowMs),
        this.agentReliability.getAgentReliabilitySummary(companyId, timeWindowMs),
        this.prisma.runtimeGovernanceEvent.findMany({
          where: {
            companyId,
            createdAt: { gte: from },
            fallbackReason: { not: null },
          },
          select: {
            fallbackReason: true,
          },
        }),
        this.prisma.systemIncident.findMany({
          where: {
            companyId,
            createdAt: { gte: from },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            incidentType: true,
            severity: true,
            traceId: true,
            createdAt: true,
          },
        }),
        this.prisma.traceSummary.findMany({
          where: {
            companyId,
            createdAt: { gte: from },
          },
          select: {
            bsScorePct: true,
            evidenceCoveragePct: true,
          },
        }),
        this.prisma.qualityAlert.count({
          where: {
            companyId,
            createdAt: { gte: from },
          },
        }),
        this.autonomyPolicy.getCompanyAutonomyStatus(companyId),
      ]);

    const fallbackMap = new Map<string, number>();
    for (const event of events) {
      if (!event.fallbackReason) {
        continue;
      }
      fallbackMap.set(event.fallbackReason, (fallbackMap.get(event.fallbackReason) ?? 0) + 1);
    }

    const recommendations = await this.recommendationService.getActiveRecommendations(
      companyId,
      timeWindowMs,
    );

    const bsValues = traceSummaries
      .map((item) => item.bsScorePct)
      .filter((item): item is number => typeof item === "number");
    const evidenceValues = traceSummaries
      .map((item) => item.evidenceCoveragePct)
      .filter((item): item is number => typeof item === "number");

    return {
      companyId,
      queuePressure,
      topFallbackReasons: [...fallbackMap.entries()]
        .map(([fallbackReason, count]) => ({ fallbackReason, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 10),
      recentIncidents: incidents.map((incident) => ({
        id: incident.id,
        incidentType: incident.incidentType,
        severity: incident.severity,
        traceId: incident.traceId ?? null,
        createdAt: incident.createdAt.toISOString(),
      })),
      activeRecommendations: recommendations,
      quality: {
        avgBsScorePct:
          bsValues.length > 0
            ? Number((bsValues.reduce((sum, value) => sum + value, 0) / bsValues.length).toFixed(1))
            : null,
        avgEvidenceCoveragePct:
          evidenceValues.length > 0
            ? Number(
                (
                  evidenceValues.reduce((sum, value) => sum + value, 0) /
                  evidenceValues.length
                ).toFixed(1),
              )
            : null,
        qualityAlertCount,
      },
      autonomy: {
        level: autonomy.level,
        avgBsScorePct: autonomy.avgBsScorePct,
        knownTraceCount: autonomy.knownTraceCount,
        driver: autonomy.driver,
        activeQualityAlert: autonomy.activeQualityAlert,
      },
      hottestAgents: reliability.slice(0, 5).map((agent) => ({
        agentRole: agent.agentRole,
        fallbackRatePct: agent.fallbackRatePct,
        avgBsScorePct: agent.avgBsScorePct,
        incidentCount: agent.incidentCount,
      })),
    };
  }

  async getAgents(
    companyId: string,
    timeWindowMs: number,
  ): Promise<RuntimeGovernanceAgentDto[]> {
    return this.agentReliability.getAgentReliabilitySummary(companyId, timeWindowMs);
  }
}
