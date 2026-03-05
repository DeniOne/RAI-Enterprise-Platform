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
});

