import { Test, TestingModule } from "@nestjs/testing";
import { ShadowAdvisoryMetricsService } from "./shadow-advisory-metrics.service";
import { PrismaService } from "../prisma/prisma.service";

describe("ShadowAdvisoryMetricsService", () => {
  let service: ShadowAdvisoryMetricsService;

  const prismaMock = {
    auditLog: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShadowAdvisoryMetricsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(ShadowAdvisoryMetricsService);
    jest.clearAllMocks();
  });

  it("должен считать baseline-метрики shadow advisory", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([
      { metadata: { companyId: "c1", recommendation: "ALLOW", confidence: 0.8 } },
      { metadata: { companyId: "c1", recommendation: "REVIEW", confidence: 0.5 } },
      { metadata: { companyId: "c1", recommendation: "BLOCK", confidence: 0.9 } },
      { metadata: { companyId: "c1", recommendation: "ALLOW", confidence: 0.7 } },
    ]);

    const result = await service.buildBaseline({ companyId: "c1" });

    expect(result.totalSignals).toBe(4);
    expect(result.advisoriesGenerated).toBe(4);
    expect(result.coverage).toBe(1);
    expect(result.allowCount).toBe(2);
    expect(result.reviewCount).toBe(1);
    expect(result.blockCount).toBe(1);
    expect(result.allowRatio).toBe(0.5);
    expect(result.reviewRatio).toBe(0.25);
    expect(result.blockRatio).toBe(0.25);
    expect(result.avgConfidence).toBe(0.725);
  });
});
