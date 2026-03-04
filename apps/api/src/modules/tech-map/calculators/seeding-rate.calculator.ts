/**
 * Калькулятор нормы высева (§3.2.1 GRAND_SYNTHESIS)
 *
 * Формула:
 *   НормаВесовая (кг/га) =
 *     (ЦелеваяГустота_млн/га × МТС_г) / (ЛабВсхожесть% × ПолеваяВсхожесть% / 10000)
 *
 * Pure function — без side-effects, без IO.
 */

export interface SeedingRateParams {
    /** Целевая густота стояния, млн всхожих семян/га (диапазон 1.2–5.0) */
    targetDensityMlnHa: number;
    /** Масса 1000 семян, г */
    thousandSeedWeightG: number;
    /** Лабораторная всхожесть, % (1–100) */
    labGerminationPct: number;
    /** Полевая всхожесть, % (1–100) */
    fieldGerminationPct: number;
}

export interface SeedingRateResult {
    /** Весовая норма высева, кг/га */
    weightedRateKgHa: number;
    /** Количество семян на 1 м² */
    seedsPerM2: number;
}

export function calculateSeedingRate(
    params: SeedingRateParams,
): SeedingRateResult {
    const { targetDensityMlnHa, thousandSeedWeightG, labGerminationPct, fieldGerminationPct } =
        params;

    if (targetDensityMlnHa <= 0) {
        throw new Error("targetDensityMlnHa должна быть > 0");
    }
    if (thousandSeedWeightG <= 0) {
        throw new Error("thousandSeedWeightG должна быть > 0");
    }
    if (labGerminationPct <= 0 || labGerminationPct > 100) {
        throw new Error("labGerminationPct должна быть в диапазоне (0, 100]");
    }
    if (fieldGerminationPct <= 0 || fieldGerminationPct > 100) {
        throw new Error("fieldGerminationPct должна быть в диапазоне (0, 100]");
    }

    // Произведение коэффициентов всхожести (безразмерное)
    const germinationFactor = (labGerminationPct * fieldGerminationPct) / 10000;

    // Весовая норма: (млн/га × г) / коэффициент = г/га → кг/га
    // targetDensityMlnHa × 1_000_000 семян/га × thousandSeedWeightG г / 1000 семян = г/га
    // Делим на 1000 для перевода г/га → кг/га
    const weightedRateKgHa =
        ((targetDensityMlnHa * 1_000_000 * thousandSeedWeightG) /
            1_000 /
            germinationFactor) / 1000;

    // Семян на м²: targetDensityMlnHa × 1 000 000 / 10 000 м²/га
    const seedsPerM2 = (targetDensityMlnHa * 1_000_000) / 10_000;

    return {
        weightedRateKgHa: Math.round(weightedRateKgHa * 100) / 100,
        seedsPerM2: Math.round(seedsPerM2 * 10) / 10,
    };
}
