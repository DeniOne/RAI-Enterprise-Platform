import { TechMapKPIService } from "./tech-map-kpi.service";

describe("TechMapKPIService", () => {
  let service: TechMapKPIService;

  beforeEach(() => {
    service = new TechMapKPIService({} as any);
  });

  it("computeKPIs: числовые значения совпадают с ручным расчётом", () => {
    const result = service.computeKPIs({
      totalPlannedCost: 120000,
      totalActualCost: 126000,
      areaHa: 10,
      targetYieldTHa: 4,
      marketPriceRubT: 6000,
      lossRiskFactor: 0.1,
    });

    expect(result).toMatchObject({
      costPerHa: 12000,
      costPerTon: 3000,
      grossRevenuePerHa: 24000,
      marginPerHa: 12000,
      marginPct: 50,
      riskAdjustedMarginPerHa: 10800,
    });
    expect(result.variancePct).toBeCloseTo(5);
  });

  it("computeKPIs: lossRiskFactor=0 -> riskAdjustedMarginPerHa = marginPerHa", () => {
    const result = service.computeKPIs({
      totalPlannedCost: 50000,
      areaHa: 10,
      targetYieldTHa: 5,
      marketPriceRubT: 2000,
      lossRiskFactor: 0,
    });

    expect(result.riskAdjustedMarginPerHa).toBe(result.marginPerHa);
  });

  it("computeKPIs: totalActualCost = null -> variancePct = null", () => {
    const result = service.computeKPIs({
      totalPlannedCost: 40000,
      totalActualCost: null,
      areaHa: 8,
      targetYieldTHa: 4,
      marketPriceRubT: 5000,
      lossRiskFactor: 0.2,
    });

    expect(result.variancePct).toBeNull();
  });

  it("computeKPIs: targetYieldTHa=0 -> не бросает ошибку", () => {
    expect(() =>
      service.computeKPIs({
        totalPlannedCost: 40000,
        areaHa: 10,
        targetYieldTHa: 0,
        marketPriceRubT: 5000,
        lossRiskFactor: 0,
      }),
    ).not.toThrow();

    const result = service.computeKPIs({
      totalPlannedCost: 40000,
      areaHa: 10,
      targetYieldTHa: 0,
      marketPriceRubT: 5000,
      lossRiskFactor: 0,
    });

    expect(result.costPerTon).toBe(Infinity);
  });
});
