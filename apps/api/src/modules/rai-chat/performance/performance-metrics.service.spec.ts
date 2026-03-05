import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PerformanceMetricsService } from "./performance-metrics.service";
import { PerformanceMetricType } from "@rai/prisma-client";

describe("PerformanceMetricsService", () => {
  let service: PerformanceMetricsService;
  const created: { companyId: string; metricType: string; value: number; agentRole?: string | null; toolName?: string | null }[] = [];
  const prisma = {
    performanceMetric: {
      create: jest.fn((args: { data: unknown }) => {
        const d = args.data as { companyId: string; metricType: string; value: number; agentRole?: string | null; toolName?: string | null };
        created.push({ ...d });
        return Promise.resolve({ id: "m1" });
      }),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    created.length = 0;
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceMetricsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(PerformanceMetricsService);
  });

  it("recordLatency пишет LATENCY с value=latencyMs", async () => {
    prisma.performanceMetric.create.mockResolvedValue({ id: "m1" });
    await service.recordLatency("c1", 150, "AgronomAgent", "get_field_context");
    expect(prisma.performanceMetric.create).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        metricType: PerformanceMetricType.LATENCY,
        value: 150,
        agentRole: "AgronomAgent",
        toolName: "get_field_context",
      },
    });
  });

  it("recordError пишет ERROR_RATE с value=1", async () => {
    await service.recordError("c1", "EconomistAgent");
    expect(prisma.performanceMetric.create).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        metricType: PerformanceMetricType.ERROR_RATE,
        value: 1,
        agentRole: "EconomistAgent",
        toolName: null,
      },
    });
  });

  it("getAggregatedMetrics считает среднее по latency и изолирует по companyId", async () => {
    const from = new Date(Date.now() - 3600_000);
    prisma.performanceMetric.findMany
      .mockImplementationOnce((args: { where: unknown }) => {
        const w = args.where as { companyId: string; metricType: string };
        if (w.companyId !== "c1" || w.metricType !== PerformanceMetricType.LATENCY) return Promise.resolve([]);
        return Promise.resolve([
          { value: 100, agentRole: "A" },
          { value: 200, agentRole: "A" },
          { value: 300, agentRole: "B" },
        ]);
      })
      .mockImplementationOnce((args: { where: unknown }) => {
        const w = args.where as { companyId: string };
        if (w.companyId !== "c1") return Promise.resolve([]);
        return Promise.resolve([{ value: 1, agentRole: "A" }]);
      });
    const out = await service.getAggregatedMetrics("c1", 3600_000);
    expect(out.successRatePct).toBeCloseTo((2 / 3) * 100);
    expect(out.avgLatencyMs).toBe(200); // (100+200+300)/3
    expect(out.p95LatencyMs).toBe(300); // index floor(3*0.95)=2
    expect(out.byAgent).toHaveLength(2);
    expect(out.byAgent.find((a) => a.agentRole === "A")).toEqual({
      agentRole: "A",
      avgLatencyMs: 150,
      p95LatencyMs: 200,
      errorCount: 1,
    });
  });

  it("getAggregatedMetrics для чужого companyId не видит данные другого тенанта", async () => {
    prisma.performanceMetric.findMany.mockImplementation((args: { where: unknown }) => {
      const w = args.where as { companyId: string };
      expect(w.companyId).toBe("c2");
      return Promise.resolve([]);
    });
    const out = await service.getAggregatedMetrics("c2", 3600_000);
    expect(out.successRatePct).toBe(100);
    expect(out.avgLatencyMs).toBe(0);
    expect(out.p95LatencyMs).toBe(0);
    expect(out.byAgent).toEqual([]);
  });
});
