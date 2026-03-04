import {
    calculateGDDToDate,
    estimateOperationDate,
    DailyTemp,
} from "./gdd-window.calculator";

describe("calculateGDDToDate", () => {
    it("массив температур за 10 дней → корректный накопленный GDD", () => {
        const dailyTemps: DailyTemp[] = Array.from({ length: 10 }, (_, i) => ({
            date: `2026-04-${String(i + 1).padStart(2, "0")}`,
            tMin: 5,
            tMax: 15, // среднее = 10°C, базовая = 5°C → GDD/день = 5
        }));

        const result = calculateGDDToDate({
            dailyTemps,
            baseTemp: 5,
            startDate: "2026-04-01",
        });

        expect(result.gddAccumulated).toBe(50); // 10 дней × 5 GDD
        expect(Object.keys(result.gddByDate)).toHaveLength(10);
    });

    it("baseTemp=5°C, tMax=4°C (среднее ниже базовой) → GDD=0 (не накапливается)", () => {
        const dailyTemps: DailyTemp[] = [
            { date: "2026-04-01", tMin: 0, tMax: 4 }, // среднее = 2°C < 5°C
            { date: "2026-04-02", tMin: 1, tMax: 3 }, // среднее = 2°C < 5°C
        ];

        const result = calculateGDDToDate({
            dailyTemps,
            baseTemp: 5,
            startDate: "2026-04-01",
        });

        expect(result.gddAccumulated).toBe(0);
    });

    it("estimateOperationDate: известный rate → правильная дата", () => {
        const result = estimateOperationDate({
            gddTarget: 100,
            regionProfile: { gddBaseTempC: 5, avgGddSeason: 1000 },
            seasonStartDate: "2026-04-01",
            historicalGDDRate: 10, // 10 GDD/день → 100 GDD через 10 дней
        });

        // 2026-04-01 + 10 дней = 2026-04-11
        expect(result.estimatedDate).toBe("2026-04-11");
        expect(result.confidenceRangeDays).toBeGreaterThanOrEqual(1);
    });
});
