import {
    calculateSeedingRate,
} from "./seeding-rate.calculator";

describe("calculateSeedingRate", () => {
    it("стандартный озимый рапс: density=1.2, tgw=4.5г, labGerm=95%, fieldGerm=85%", () => {
        const result = calculateSeedingRate({
            targetDensityMlnHa: 1.2,
            thousandSeedWeightG: 4.5,
            labGerminationPct: 95,
            fieldGerminationPct: 85,
        });

        // Ожидаемая весовая норма ~6.69 кг/га
        // (1.2 × 1_000_000 × 4.5 / 1_000 / (95 × 85 / 10000)) / 1000
        // = (5400) / (0.8075) / 1000 ≈ 6.69
        expect(result.weightedRateKgHa).toBeGreaterThan(6);
        expect(result.weightedRateKgHa).toBeLessThan(8);
        expect(result.seedsPerM2).toBe(120); // 1.2 млн / 10000 м²/га
    });

    it("яровой рапс (Сибирь): density=3.5, tgw=3.8г, labGerm=90%, fieldGerm=70% — норма выше", () => {
        const standard = calculateSeedingRate({
            targetDensityMlnHa: 1.2,
            thousandSeedWeightG: 4.5,
            labGerminationPct: 95,
            fieldGerminationPct: 85,
        });
        const siberia = calculateSeedingRate({
            targetDensityMlnHa: 3.5,
            thousandSeedWeightG: 3.8,
            labGerminationPct: 90,
            fieldGerminationPct: 70,
        });

        expect(siberia.weightedRateKgHa).toBeGreaterThan(standard.weightedRateKgHa);
        expect(siberia.seedsPerM2).toBe(350); // 3.5 млн / 10000
    });

    it("невалидный ввод (density=0) → бросает ошибку", () => {
        expect(() =>
            calculateSeedingRate({
                targetDensityMlnHa: 0,
                thousandSeedWeightG: 4.5,
                labGerminationPct: 95,
                fieldGerminationPct: 85,
            }),
        ).toThrow("targetDensityMlnHa должна быть > 0");
    });
});
