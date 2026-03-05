import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { CostAnalyticsService } from "./cost-analytics.service";

describe("CostAnalyticsService", () => {
  let service: CostAnalyticsService;
  const traceSummaries: Array<{
    traceId: string;
    companyId: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    modelId: string;
    createdAt: Date;
  }> = [];

  const prisma = {
    traceSummary: {
      findMany: jest.fn().mockImplementation((args: { where: { companyId: string; createdAt?: { gte: Date } } }) => {
        const list = traceSummaries.filter((r) => r.companyId === args.where.companyId);
        return Promise.resolve(list);
      }),
    },
  };

  beforeEach(async () => {
    traceSummaries.length = 0;
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [CostAnalyticsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(CostAnalyticsService);
  });

  it("getTenantCost суммирует токены и перемножает на рейты", async () => {
    traceSummaries.push(
      {
        traceId: "t1",
        companyId: "c1",
        promptTokens: 1_000_000,
        completionTokens: 100_000,
        durationMs: 500,
        modelId: "gpt-4o",
        createdAt: new Date(),
      },
      {
        traceId: "t2",
        companyId: "c1",
        promptTokens: 500_000,
        completionTokens: 50_000,
        durationMs: 200,
        modelId: "gpt-4o",
        createdAt: new Date(),
      },
    );
    const out = await service.getTenantCost("c1", 86400000);
    expect(out.totalPromptTokens).toBe(1_500_000);
    expect(out.totalCompletionTokens).toBe(150_000);
    expect(out.totalCostUsd).toBeCloseTo(1_500_000 * 2.5 / 1e6 + 150_000 * 10 / 1e6);
    expect(out.byModel).toHaveLength(1);
    expect(out.byModel[0].modelId).toBe("gpt-4o");
    expect(out.byModel[0].costUsd).toBeCloseTo(out.totalCostUsd);
  });

  it("getHotspots не возвращает чужие трейсы (изоляция по companyId)", async () => {
    traceSummaries.push(
      { traceId: "t-a", companyId: "c1", promptTokens: 100, completionTokens: 50, durationMs: 100, modelId: "m", createdAt: new Date() },
      { traceId: "t-b", companyId: "c2", promptTokens: 999999, completionTokens: 999999, durationMs: 99999, modelId: "m", createdAt: new Date() },
    );
    const { topByCost, topByDuration } = await service.getHotspots("c1", 86400000, 10);
    expect(topByCost.every((x) => ["t-a"].includes(x.traceId))).toBe(true);
    expect(topByDuration.every((x) => x.traceId === "t-a")).toBe(true);
    expect(topByCost).toHaveLength(1);
    expect(topByDuration).toHaveLength(1);
  });

  it("getHotspots возвращает топ по стоимости и по длительности", async () => {
    traceSummaries.push(
      { traceId: "cheap", companyId: "c1", promptTokens: 1, completionTokens: 1, durationMs: 5000, modelId: "m", createdAt: new Date() },
      { traceId: "expensive", companyId: "c1", promptTokens: 10000, completionTokens: 5000, durationMs: 100, modelId: "m", createdAt: new Date() },
      { traceId: "mid", companyId: "c1", promptTokens: 100, completionTokens: 100, durationMs: 2000, modelId: "m", createdAt: new Date() },
    );
    const { topByCost, topByDuration } = await service.getHotspots("c1", 86400000, 10);
    expect(topByCost[0].traceId).toBe("expensive");
    expect(topByCost[1].traceId).toBe("mid");
    expect(topByCost[2].traceId).toBe("cheap");
    expect(topByDuration[0].traceId).toBe("cheap");
    expect(topByDuration[0].durationMs).toBe(5000);
    expect(topByDuration[1].traceId).toBe("mid");
    expect(topByDuration[2].traceId).toBe("expensive");
  });
});
