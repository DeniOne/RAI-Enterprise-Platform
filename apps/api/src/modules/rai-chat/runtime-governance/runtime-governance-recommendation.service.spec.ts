import { RuntimeGovernanceRecommendationService } from "./runtime-governance-recommendation.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { AgentReliabilityService } from "./agent-reliability.service";
import { RuntimeGovernanceEventService } from "./runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "./runtime-governance-policy.service";

describe("RuntimeGovernanceRecommendationService", () => {
  let service: RuntimeGovernanceRecommendationService;

  const prisma = {
    aiAuditEntry: {
      findFirst: jest.fn(),
    },
    qualityAlert: {
      count: jest.fn(),
    },
    runtimeGovernanceEvent: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;
  const queueMetrics = {
    getQueuePressure: jest.fn(),
  } as unknown as QueueMetricsService;
  const agentReliability = {
    getAgentReliabilitySummary: jest.fn(),
  } as unknown as AgentReliabilityService;
  const governanceEvents = {
    record: jest.fn().mockResolvedValue(undefined),
  } as unknown as RuntimeGovernanceEventService;
  const runtimePolicy = new RuntimeGovernancePolicyService();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RuntimeGovernanceRecommendationService(
      prisma,
      queueMetrics,
      agentReliability,
      governanceEvents,
      runtimePolicy,
    );
  });

  it("emits quarantine recommendation for repeated BS drift", async () => {
    (prisma.aiAuditEntry.findFirst as jest.Mock).mockResolvedValue({
      metadata: { agentRole: "crm_agent" },
    });
    (prisma.qualityAlert.count as jest.Mock).mockResolvedValue(2);

    const result = await service.handleQualityAlertCreated({
      companyId: "c1",
      traceId: "tr-1",
      recentAvgBsPct: 41,
      baselineAvgBsPct: 12,
    });

    expect(result?.type).toBe("QUARANTINE_RECOMMENDED");
    expect(governanceEvents.record).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        traceId: "tr-1",
        recommendationType: "QUARANTINE_RECOMMENDED",
      }),
    );
  });

  it("adds budget and queue recommendations to active list", async () => {
    (prisma.runtimeGovernanceEvent.findMany as jest.Mock).mockResolvedValue([]);
    (agentReliability.getAgentReliabilitySummary as jest.Mock).mockResolvedValue([
      {
        agentRole: "crm_agent",
        budgetDeniedRatePct: 18,
      },
    ]);
    (queueMetrics.getQueuePressure as jest.Mock).mockResolvedValue({
      pressureState: "SATURATED",
      signalFresh: true,
      totalBacklog: 12,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [],
    });

    const result = await service.getActiveRecommendations("c1", 3_600_000);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "BUDGET_TUNING_RECOMMENDED",
          agentRole: "crm_agent",
        }),
        expect.objectContaining({
          type: "CONCURRENCY_TUNING_RECOMMENDED",
        }),
      ]),
    );
  });
});
