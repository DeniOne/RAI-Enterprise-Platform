import { Test, TestingModule } from "@nestjs/testing";
import { ProbabilityDistributionBuilder } from "./probability-distribution-builder";
import { NormalizationEnforcer } from "./normalization-enforcer";

describe("ProbabilityDistributionBuilder", () => {
  let builder: ProbabilityDistributionBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProbabilityDistributionBuilder,
        {
          provide: NormalizationEnforcer,
          useValue: { normalize: jest.fn().mockImplementation((p) => p) }, // Mock pass-through
        },
      ],
    }).compile();

    builder = module.get<ProbabilityDistributionBuilder>(
      ProbabilityDistributionBuilder,
    );
  });

  it("должен строить гауссово распределение", () => {
    const dist = builder.buildGaussian(10, 2, 5);
    expect(dist.type).toBe("GAUSSIAN");
    expect(dist.values).toHaveLength(5);
    expect(dist.probabilities).toHaveLength(5);

    // Check standard deviation coverage roughly
    // 10 +/- 6 (3sigma) -> 4 to 16
    expect(dist.values[0]).toBe(4);
    expect(dist.values[4]).toBe(16);
  });
});
