import { Test, TestingModule } from "@nestjs/testing";
import { ShadowAdvisoryService } from "./shadow-advisory.service";

describe("ShadowAdvisoryService", () => {
  let service: ShadowAdvisoryService;

  const retrievalMock = { retrieve: jest.fn() };
  const auditMock = { log: jest.fn(), findAll: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShadowAdvisoryService,
        { provide: "EPISODIC_RETRIEVAL", useValue: retrievalMock },
        { provide: "AUDIT_SERVICE", useValue: auditMock },
      ],
    }).compile();

    service = module.get(ShadowAdvisoryService);
    jest.clearAllMocks();
    auditMock.findAll.mockResolvedValue({ data: [] });
  });

  it("должен вернуть BLOCK при негативном историческом паттерне", async () => {
    retrievalMock.retrieve.mockResolvedValue({
      total: 3,
      positive: 0,
      negative: 3,
      unknown: 0,
      items: [
        { outcome: "NEGATIVE", confidence: 0.9 },
        { outcome: "NEGATIVE", confidence: 0.85 },
        { outcome: "NEGATIVE", confidence: 0.8 },
      ],
    });

    const result = await service.evaluate({
      companyId: "c1",
      embedding: Array(1536).fill(0.1),
      traceId: "t1",
      signalType: "SATELLITE",
    });

    expect(result.recommendation).toBe("BLOCK");
    expect(result.traceId).toBe("t1");
    expect(result.explainability.traceId).toBe("t1");
    expect(result.explainability.factors.length).toBeGreaterThan(0);
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "SHADOW_ADVISORY_EVALUATED" }),
    );
  });

  it("должен вернуть REVIEW при низкой уверенности", async () => {
    retrievalMock.retrieve.mockResolvedValue({
      total: 2,
      positive: 2,
      negative: 0,
      unknown: 0,
      items: [
        { outcome: "POSITIVE", confidence: 0.3 },
        { outcome: "POSITIVE", confidence: 0.35 },
      ],
    });

    const result = await service.evaluate({
      companyId: "c1",
      embedding: Array(1536).fill(0.1),
      traceId: "t2",
      signalType: "VISION",
    });

    expect(result.recommendation).toBe("REVIEW");
    expect(result.explainability.why).toContain("recommendation=REVIEW");
  });

  it("использует tuning thresholds из аудита", async () => {
    auditMock.findAll.mockResolvedValue({
      data: [
        {
          metadata: {
            companyId: "c1",
            thresholds: {
              confidenceReview: 0.2,
              blockScore: -0.5,
              allowScore: 0.2,
            },
          },
        },
      ],
    });

    retrievalMock.retrieve.mockResolvedValue({
      total: 3,
      positive: 3,
      negative: 0,
      unknown: 0,
      items: [
        { outcome: "POSITIVE", confidence: 0.3 },
        { outcome: "POSITIVE", confidence: 0.35 },
        { outcome: "POSITIVE", confidence: 0.4 },
      ],
    });

    const result = await service.evaluate({
      companyId: "c1",
      embedding: Array(1536).fill(0.1),
      traceId: "t3",
      signalType: "VISION",
    });

    expect(result.recommendation).toBe("ALLOW");
  });
});
