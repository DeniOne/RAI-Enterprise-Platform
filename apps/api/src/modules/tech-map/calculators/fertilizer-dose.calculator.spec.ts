import {
    calculateNitrogenDose,
} from "./fertilizer-dose.calculator";

describe("calculateNitrogenDose", () => {
    const baseParams = {
        nUptakeKgPerT: 60,       // рапс: 60 кг N на 1 т урожая
        soilUtilizationCoeff: 0.3,
        fertUtilizationCoeff: 0.7,
        bulkDensityGCm3: 1.2,
        samplingDepthCm: 30,
    };

    it("рапс 4 т/га, бедная почва (nMineral=5 мг/кг) → высокая доза N", () => {
        const result = calculateNitrogenDose({
            ...baseParams,
            targetYieldTHa: 4,
            soilNMineralMgKg: 5,
        });
        // mineralNReserve = 5 × 1.2 × 30 × 0.1 = 18 кг/га
        // demand = 60 × 4 = 240 кг/га
        // dose = (240 - 18 × 0.3) / 0.7 = (240 - 5.4) / 0.7 ≈ 335 кг/га
        expect(result.mineralNReserveKgHa).toBe(18);
        expect(result.doseKgHa).toBeGreaterThan(300);
    });

    it("рапс 3 т/га, богатая почва (nMineral=40 мг/кг) → сниженная доза N", () => {
        const richSoil = calculateNitrogenDose({
            ...baseParams,
            targetYieldTHa: 3,
            soilNMineralMgKg: 40,
        });
        const poorSoil = calculateNitrogenDose({
            ...baseParams,
            targetYieldTHa: 3,
            soilNMineralMgKg: 5,
        });

        expect(richSoil.doseKgHa).toBeLessThan(poorSoil.doseKgHa);
        // Богатая почва: mineralNReserve = 40 × 1.2 × 30 × 0.1 = 144 кг/га
        expect(richSoil.mineralNReserveKgHa).toBe(144);
    });

    it("fertUtilizationCoeff=0 → бросает ошибку", () => {
        expect(() =>
            calculateNitrogenDose({
                ...baseParams,
                fertUtilizationCoeff: 0,
                targetYieldTHa: 3,
                soilNMineralMgKg: 10,
            }),
        ).toThrow("fertUtilizationCoeff не может быть равен 0");
    });
});
