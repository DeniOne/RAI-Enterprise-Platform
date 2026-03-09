import { AgentReliabilityService } from "./agent-reliability.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("AgentReliabilityService", () => {
  let service: AgentReliabilityService;

  const prisma = {
    aiAuditEntry: {
      findMany: jest.fn(),
    },
    performanceMetric: {
      findMany: jest.fn(),
    },
    runtimeGovernanceEvent: {
      findMany: jest.fn(),
    },
    traceSummary: {
      findMany: jest.fn(),
    },
    systemIncident: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgentReliabilityService(prisma);
  });

  it("aggregates fallback, budget and quality metrics per agent", async () => {
    (prisma.aiAuditEntry.findMany as jest.Mock).mockResolvedValue([
      {
        traceId: "tr-1",
        metadata: {
          agentRole: "crm_agent",
          fallbackUsed: true,
          validation: { passed: false, reasons: ["blocked"] },
        },
      },
      {
        traceId: "tr-2",
        metadata: {
          agentRole: "crm_agent",
          fallbackUsed: false,
          validation: { passed: true, reasons: [] },
        },
      },
    ]);
    (prisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([
      { metricType: "LATENCY", value: 100, agentRole: "crm_agent" },
      { metricType: "LATENCY", value: 200, agentRole: "crm_agent" },
    ]);
    (prisma.runtimeGovernanceEvent.findMany as jest.Mock).mockResolvedValue([
      {
        eventType: "BUDGET_DENIED",
        recommendationType: null,
        agentRole: "crm_agent",
        traceId: "tr-1",
      },
      {
        eventType: "GOVERNANCE_RECOMMENDATION_EMITTED",
        recommendationType: "REVIEW_REQUIRED",
        agentRole: "crm_agent",
        traceId: "tr-1",
      },
    ]);
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { traceId: "tr-1", bsScorePct: 40, evidenceCoveragePct: 70 },
      { traceId: "tr-2", bsScorePct: 10, evidenceCoveragePct: 90 },
    ]);
    (prisma.systemIncident.findMany as jest.Mock).mockResolvedValue([
      { traceId: "tr-1" },
    ]);

    const result = await service.getAgentReliabilitySummary("c1", 3_600_000);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      agentRole: "crm_agent",
      executionCount: 2,
      fallbackRatePct: 50,
      budgetDeniedRatePct: 50,
      avgBsScorePct: 25,
      avgEvidenceCoveragePct: 80,
      incidentCount: 1,
      lastRecommendation: "REVIEW_REQUIRED",
    });
  });
});
