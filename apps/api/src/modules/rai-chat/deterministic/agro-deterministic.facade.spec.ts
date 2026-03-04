import { AgroDeterministicEngineFacade } from "./agro-deterministic.facade";

describe("AgroDeterministicEngineFacade", () => {
  let facade: AgroDeterministicEngineFacade;

  beforeEach(() => {
    facade = new AgroDeterministicEngineFacade();
  });

  describe("computeSeedingRate", () => {
    it("возвращает ExplainableResult с value, formula, variables, unit, explanation", () => {
      const result = facade.computeSeedingRate({
        targetDensityMlnHa: 1.2,
        thousandSeedWeightG: 4.5,
        labGerminationPct: 95,
        fieldGerminationPct: 85,
      });
      expect(result.value).toBeGreaterThan(6);
      expect(result.value).toBeLessThan(8);
      expect(result.formula).toContain("кг/га");
      expect(result.unit).toBe("кг/га");
      expect(result.variables).toEqual({
        targetDensityMlnHa: 1.2,
        thousandSeedWeightG: 4.5,
        labGerminationPct: 95,
        fieldGerminationPct: 85,
      });
      expect(result.explanation).toContain("Норма высева");
    });
  });

  describe("computeFertilizerDose", () => {
    it("возвращает ExplainableResult с дозой N", () => {
      const result = facade.computeFertilizerDose({
        targetYieldTHa: 3,
        nUptakeKgPerT: 60,
        soilNMineralMgKg: 25,
        soilUtilizationCoeff: 0.3,
        fertUtilizationCoeff: 0.7,
        bulkDensityGCm3: 1.2,
        samplingDepthCm: 30,
      });
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.unit).toBe("кг/га д.в.");
      expect(result.variables.targetYieldTHa).toBe(3);
      expect(result.explanation).toContain("Доза N");
    });
  });

  describe("predictGDDWindow", () => {
    it("возвращает ExplainableResult с start и end Date", () => {
      const result = facade.predictGDDWindow({
        gddTarget: 200,
        regionProfile: { gddBaseTempC: 5, avgGddSeason: 1200 },
        seasonStartDate: "2026-03-01",
        historicalGDDRate: 10,
      });
      expect(result.value.start).toBeInstanceOf(Date);
      expect(result.value.end).toBeInstanceOf(Date);
      expect(result.value.start.getTime()).toBeLessThan(
        result.value.end.getTime(),
      );
      expect(result.unit).toBe("даты");
      expect(result.variables.gddTarget).toBe(200);
    });
  });
});
