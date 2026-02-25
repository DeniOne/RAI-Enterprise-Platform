import { AdvisoryService } from "./advisory.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AdvisoryTraceStatus } from "./dto/advisory-signal.dto";
import { CanonicalJsonBuilder } from "../../shared/crypto/canonical-json.builder";

describe("AdvisoryService", () => {
  const prismaMock = {
    harvestPlan: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    deviationReview: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    budgetPlan: {
      count: jest.fn(),
    },
    budgetItem: {
      aggregate: jest.fn(),
    },
    cmrDecision: {
      count: jest.fn(),
    },
  } as unknown as PrismaService;

  let service: AdvisoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdvisoryService(prismaMock);
  });

  it("enforces explainability and trace binding for company health signals", async () => {
    (prismaMock.harvestPlan.count as jest.Mock).mockResolvedValue(2);
    (prismaMock.deviationReview.count as jest.Mock).mockResolvedValue(1);
    (prismaMock.deviationReview.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.budgetPlan.count as jest.Mock).mockResolvedValue(1);
    (prismaMock.budgetItem.aggregate as jest.Mock).mockResolvedValue({
      _sum: { plannedAmount: 1000, actualAmount: 900 },
    });

    const result = await service.getCompanyHealth("c1");

    expect(result.explainability).toBeDefined();
    expect(result.explainability.factors.length).toBeGreaterThan(0);
    expect(result.explainability.forensic?.inputCanonicalHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(result.explainability.forensic?.explainabilityCanonicalHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(result.traceStatus).toBe(AdvisoryTraceStatus.AVAILABLE);
    expect(result.ledgerTraceId).toContain("advisory:company-health:c1");
  });

  it("enforces explainability and trace binding for plan volatility signals", async () => {
    (prismaMock.harvestPlan.findFirst as jest.Mock).mockResolvedValue({
      companyId: "c1",
      _count: {
        deviationReviews: 2,
        budgetPlans: 1,
      },
    });
    (prismaMock.cmrDecision.count as jest.Mock).mockResolvedValue(3);

    const result = await service.getPlanVolatility("p1", "c1");

    expect(result.explainability).toBeDefined();
    expect(result.explainability.factors.length).toBeGreaterThan(0);
    expect(result.traceStatus).toBe(AdvisoryTraceStatus.AVAILABLE);
    expect(result.ledgerTraceId).toContain("advisory:plan-volatility:p1");
  });

  it("canonical hashing stays deterministic under key reordering", () => {
    const inputA = { b: 2, a: 1, nested: { y: 2, x: 1 } };
    const inputB = { nested: { x: 1, y: 2 }, a: 1, b: 2 };

    expect(CanonicalJsonBuilder.hash(inputA)).toBe(
      CanonicalJsonBuilder.hash(inputB),
    );
  });
});
