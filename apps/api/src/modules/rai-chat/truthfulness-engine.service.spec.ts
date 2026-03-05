import { Test, TestingModule } from "@nestjs/testing";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("TruthfulnessEngineService", () => {
  let service: TruthfulnessEngineService;

  const prisma = {
    aiAuditEntry: {
      findMany: jest.fn(),
    },
    traceSummary: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        TruthfulnessEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(TruthfulnessEngineService);
  });

  it("100% verified evidence → BS% = 0", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      {
        metadata: {
          evidence: [
            {
              claim: "Финансовый анализ плана выполнен на основе детерминированных расчётов ComputePlanFact.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_plan_fact",
              confidenceScore: 0.9,
            },
          ],
        },
      },
    ]);

    await service.calculateTraceTruthfulness("tr1", "c1");

    expect(prisma.traceSummary.updateMany).toHaveBeenCalledWith({
      where: { traceId: "tr1", companyId: "c1" },
      data: { bsScorePct: 0 },
    });
  });

  it("1 agro invalid (3) + 1 general verified (1) → BS% = 75", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      {
        metadata: {
          evidence: [
            {
              claim: "Норма высева рапса указана неверно.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_deviations",
              confidenceScore: 0.1, // INVALID
            },
            {
              claim: "Общее пояснение без домена.",
              sourceType: "DOC",
              sourceId: "doc1",
              confidenceScore: 0.9, // VERIFIED GENERAL
            },
          ],
        },
      },
    ]);

    await service.calculateTraceTruthfulness("tr2", "c1");

    expect(prisma.traceSummary.updateMany).toHaveBeenCalledWith({
      where: { traceId: "tr2", companyId: "c1" },
      data: { bsScorePct: 75 },
    });
  });

  it("пустой трейс → BS% = 100", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([]);

    await service.calculateTraceTruthfulness("tr3", "c1");

    expect(prisma.traceSummary.updateMany).toHaveBeenCalledWith({
      where: { traceId: "tr3", companyId: "c1" },
      data: { bsScorePct: 100 },
    });
  });

  it("есть трейс, но нет evidence → BS% = 100", async () => {
    prisma.aiAuditEntry.findMany.mockResolvedValue([
      { metadata: {} },
    ]);

    await service.calculateTraceTruthfulness("tr4", "c1");

    expect(prisma.traceSummary.updateMany).toHaveBeenCalledWith({
      where: { traceId: "tr4", companyId: "c1" },
      data: { bsScorePct: 100 },
    });
  });
});

