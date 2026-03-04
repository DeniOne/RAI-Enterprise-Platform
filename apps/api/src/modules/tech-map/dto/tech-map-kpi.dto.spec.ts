import { TechMapKPIResponseDtoSchema } from "./tech-map-kpi.dto";

describe("TechMap KPI DTO", () => {
  it("принимает валидный вычисленный payload", () => {
    const result = TechMapKPIResponseDtoSchema.parse({
      costPerHa: 12000,
      costPerTon: 3000,
      grossRevenuePerHa: 24000,
      marginPerHa: 12000,
      marginPct: 50,
      riskAdjustedMarginPerHa: 10800,
      variancePct: null,
    });

    expect(result.marginPct).toBe(50);
  });

  it("отклоняет строковое значение вместо числа", () => {
    expect(() =>
      TechMapKPIResponseDtoSchema.parse({
        costPerHa: "12000",
        costPerTon: 3000,
        grossRevenuePerHa: 24000,
        marginPerHa: 12000,
        marginPct: 50,
        riskAdjustedMarginPerHa: 10800,
        variancePct: null,
      }),
    ).toThrow();
  });
});
