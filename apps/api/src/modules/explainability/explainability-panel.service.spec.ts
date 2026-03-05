import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SensitiveDataFilterService } from "../rai-chat/security/sensitive-data-filter.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";

describe("ExplainabilityPanelService", () => {
  let service: ExplainabilityPanelService;
  let prisma: PrismaService;

  const mockAiAuditFindMany = jest.fn();
  const mockPendingFindMany = jest.fn();
  const mockDecisionFindMany = jest.fn();
  const mockQuorumFindMany = jest.fn();
  const mockTraceSummaryFindMany = jest.fn();
  const mockTraceSummaryFindFirst = jest.fn();
  const mockQualityAlertFindMany = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExplainabilityPanelService,
        SensitiveDataFilterService,
        {
          provide: PrismaService,
          useValue: {
            aiAuditEntry: {
              findMany: mockAiAuditFindMany,
            },
            pendingAction: {
              findMany: mockPendingFindMany,
            },
            decisionRecord: {
              findMany: mockDecisionFindMany,
            },
            quorumProcess: {
              findMany: mockQuorumFindMany,
            },
            traceSummary: {
              findMany: mockTraceSummaryFindMany,
              findFirst: mockTraceSummaryFindFirst,
            },
            qualityAlert: {
              findMany: mockQualityAlertFindMany,
            },
          },
        },
      ],
    }).compile();

    service = module.get(ExplainabilityPanelService);
    prisma = module.get(PrismaService);
  });

  it("aggregates timeline for own trace", async () => {
    const traceId = "tr_1";
    const companyId = "c1";

    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a1",
        traceId,
        companyId,
        toolNames: ["generate_tech_map_draft"],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        createdAt: new Date("2026-03-05T10:00:00.000Z"),
      },
    ]);
    mockPendingFindMany.mockResolvedValue([]);
    mockDecisionFindMany.mockResolvedValue([]);
    mockQuorumFindMany.mockResolvedValue([]);

    const result = await service.getTraceTimeline(traceId, companyId);

    expect(result.traceId).toBe(traceId);
    expect(result.companyId).toBe(companyId);
    expect(result.nodes.length).toBeGreaterThanOrEqual(3);
    expect(result.nodes[0].kind).toBe("router");
    expect(result.nodes[1].kind).toBe("tools");
  });

  it("throws NotFoundException when trace is missing", async () => {
    mockAiAuditFindMany.mockResolvedValue([]);

    await expect(service.getTraceTimeline("missing", "c1")).rejects.toThrow(NotFoundException);
  });

  it("throws ForbiddenException on tenant mismatch", async () => {
    const traceId = "tr_2";
    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a2",
        traceId,
        companyId: "other-company",
        toolNames: [],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        createdAt: new Date(),
      },
    ]);

    await expect(service.getTraceTimeline(traceId, "c1")).rejects.toThrow(ForbiddenException);
  });

  it("masks PII in metadata", async () => {
    const traceId = "tr_3";
    const companyId = "c1";

    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a3",
        traceId,
        companyId,
        toolNames: [],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        createdAt: new Date("2026-03-05T10:00:00.000Z"),
      },
    ]);
    mockPendingFindMany.mockResolvedValue([]);
    mockDecisionFindMany.mockResolvedValue([
      {
        id: "d1",
        actionType: "TEST",
        targetId: "target-1",
        riskVerdict: "ALLOWED",
        riskState: "CLEAR",
        explanation: "email test@mail.ru",
        traceId,
        companyId,
        decidedAt: new Date("2026-03-05T10:01:00.000Z"),
      },
    ]);
    mockQuorumFindMany.mockResolvedValue([]);

    const result = await service.getTraceTimeline(traceId, companyId);

    const decisionNode = result.nodes.find((n) => n.kind === "decision");
    expect(decisionNode).toBeDefined();
    const metadata = decisionNode!.metadata as Record<string, unknown>;
    expect(String(metadata.explanation)).toContain("[HIDDEN_EMAIL]");
    expect(String(metadata.explanation)).not.toContain("test@mail.ru");

    expect(prisma.decisionRecord.findMany).toHaveBeenCalledWith({
      where: { traceId, companyId },
    });
  });

  it("calculates dashboard metrics for multiple trace summaries", async () => {
    const companyId = "c1";
    const now = new Date();

    mockTraceSummaryFindMany.mockResolvedValue([
      {
        traceId: "tr_1",
        companyId,
        bsScorePct: 10,
        evidenceCoveragePct: 80,
        invalidClaimsPct: 5,
        createdAt: new Date(now.getTime() - 1_000),
      },
      {
        traceId: "tr_2",
        companyId,
        bsScorePct: 30,
        evidenceCoveragePct: 60,
        invalidClaimsPct: 10,
        createdAt: new Date(now.getTime() - 2_000),
      },
      {
        traceId: "tr_3",
        companyId,
        bsScorePct: 50,
        evidenceCoveragePct: 40,
        invalidClaimsPct: 20,
        createdAt: new Date(now.getTime() - 3_000),
      },
    ]);

    const result = await service.getTruthfulnessDashboard(companyId, 24);

    expect(mockTraceSummaryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId,
        }),
      }),
    );

    expect(result.companyId).toBe(companyId);
    expect(result.worstTraces).toHaveLength(3);
    expect(result.worstTraces[0].traceId).toBe("tr_3");
    expect(result.worstTraces[1].traceId).toBe("tr_2");
    expect(result.worstTraces[2].traceId).toBe("tr_1");

    expect(result.avgBsScore).toBeCloseTo((10 + 30 + 50) / 3);
    expect(result.avgEvidenceCoverage).toBeCloseTo((80 + 60 + 40) / 3);
    expect(result.p95BsScore).toBeGreaterThanOrEqual(30);
    expect(result.p95BsScore).toBeLessThanOrEqual(50);
  });

  it("returns zero metrics and empty list when no trace summaries", async () => {
    const companyId = "c1";
    mockTraceSummaryFindMany.mockResolvedValue([]);

    const result = await service.getTruthfulnessDashboard(companyId, 24);

    expect(result.companyId).toBe(companyId);
    expect(result.avgBsScore).toBe(0);
    expect(result.p95BsScore).toBe(0);
    expect(result.avgEvidenceCoverage).toBe(0);
    expect(result.worstTraces).toHaveLength(0);
  });

  describe("getTraceForensics", () => {
    it("returns summary, timeline with evidenceRefs, and qualityAlerts for own trace", async () => {
      const traceId = "tr_forensics";
      const companyId = "c1";

      mockAiAuditFindMany.mockResolvedValue([
        {
          id: "ae1",
          traceId,
          companyId,
          toolNames: ["compute_deviations"],
          model: "gpt-4",
          intentMethod: "regex",
          tokensUsed: 100,
          metadata: {
            evidence: [
              {
                claim: "Данные по отклонениям из детерминированного расчёта.",
                sourceType: "TOOL_RESULT",
                sourceId: "compute_deviations",
                confidenceScore: 0.9,
              },
            ],
          },
          createdAt: new Date("2026-03-05T10:00:00.000Z"),
        },
      ]);
      mockTraceSummaryFindFirst.mockResolvedValue({
        traceId,
        companyId,
        totalTokens: 150,
        promptTokens: 80,
        completionTokens: 70,
        durationMs: 1200,
        modelId: "gpt-4",
        promptVersion: "v1",
        toolsVersion: "v1",
        policyId: "default",
        bsScorePct: 10,
        evidenceCoveragePct: 85,
        invalidClaimsPct: 5,
        createdAt: new Date("2026-03-05T10:00:00.000Z"),
      });
      mockQualityAlertFindMany.mockResolvedValue([
        {
          id: "qa1",
          alertType: "BS_DRIFT",
          severity: "HIGH",
          message: "BS% вырос с 5 до 25.",
          createdAt: new Date("2026-03-05T09:30:00.000Z"),
        },
      ]);

      const result = await service.getTraceForensics(traceId, companyId);

      expect(result.traceId).toBe(traceId);
      expect(result.companyId).toBe(companyId);
      expect(result.summary).not.toBeNull();
      expect(result.summary?.bsScorePct).toBe(10);
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].evidenceRefs).toHaveLength(1);
      expect(result.timeline[0].evidenceRefs[0].claim).toContain("отклонениям");
      expect(result.qualityAlerts).toHaveLength(1);
      expect(result.qualityAlerts[0].alertType).toBe("BS_DRIFT");
    });

    it("returns 403 Forbidden for trace of another tenant", async () => {
      const traceId = "tr_other";
      mockAiAuditFindMany.mockResolvedValue([
        {
          id: "ae2",
          traceId,
          companyId: "other-company",
          toolNames: [],
          model: "deterministic",
          intentMethod: "regex",
          tokensUsed: 0,
          metadata: null,
          createdAt: new Date(),
        },
      ]);

      await expect(
        service.getTraceForensics(traceId, "c1"),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

