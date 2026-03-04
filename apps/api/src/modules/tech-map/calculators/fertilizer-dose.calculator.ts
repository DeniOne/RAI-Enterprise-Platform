/**
 * Калькулятор доз удобрений — азот (§3.2.3 GRAND_SYNTHESIS)
 *
 * Формула:
 *   ДозаN (кг/га д.в.) =
 *     (ВыносN × ЦелеваяУрожайность - ЗапасNпочвы × Кусвоения_почвы)
 *     / Кусвоения_удобрения
 *
 * Pure function — без side-effects, без IO.
 */

export interface NitrogenDoseParams {
    /** Целевая урожайность, т/га */
    targetYieldTHa: number;
    /** Вынос N на 1 т урожая, кг/т (для рапса ~60) */
    nUptakeKgPerT: number;
    /** Минеральный N в почве, мг/кг */
    soilNMineralMgKg: number;
    /** Коэффициент использования почвенного N (0–1, обычно 0.3) */
    soilUtilizationCoeff: number;
    /** Коэффициент использования удобрения (0–1, обычно 0.7) */
    fertUtilizationCoeff: number;
    /** Объёмная масса почвы, г/см³ (для расчёта запаса N в почве) */
    bulkDensityGCm3: number;
    /** Глубина взятия образца, см */
    samplingDepthCm: number;
}

export interface NitrogenDoseResult {
    /** Доза N, кг/га д.в. */
    doseKgHa: number;
    /** Запас минерального N в почве, кг/га */
    mineralNReserveKgHa: number;
}

export function calculateNitrogenDose(
    params: NitrogenDoseParams,
): NitrogenDoseResult {
    const {
        targetYieldTHa,
        nUptakeKgPerT,
        soilNMineralMgKg,
        soilUtilizationCoeff,
        fertUtilizationCoeff,
        bulkDensityGCm3,
        samplingDepthCm,
    } = params;

    if (fertUtilizationCoeff === 0) {
        throw new Error(
            "fertUtilizationCoeff не может быть равен 0 (деление на ноль)",
        );
    }
    if (fertUtilizationCoeff < 0 || fertUtilizationCoeff > 1) {
        throw new Error("fertUtilizationCoeff должен быть в диапазоне (0, 1]");
    }
    if (soilUtilizationCoeff < 0 || soilUtilizationCoeff > 1) {
        throw new Error("soilUtilizationCoeff должен быть в диапазоне [0, 1]");
    }
    if (targetYieldTHa <= 0) {
        throw new Error("targetYieldTHa должна быть > 0");
    }

    /**
     * Запас минерального N в пласте почвы:
     *   мг/кг × г/см³ × см × 100 = кг/га
     *   (100 — коэффициент перевода единиц)
     */
    const mineralNReserveKgHa =
        soilNMineralMgKg * bulkDensityGCm3 * samplingDepthCm * 0.1;

    /**
     * Потребность культуры в N:
     *   вынос × урожайность = кг N/га
     */
    const totalNDemandKgHa = nUptakeKgPerT * targetYieldTHa;

    /**
     * Доза удобрения:
     *   (потребность - почва × Куп) / Куу
     */
    const doseKgHa =
        (totalNDemandKgHa - mineralNReserveKgHa * soilUtilizationCoeff) /
        fertUtilizationCoeff;

    return {
        doseKgHa: Math.round(Math.max(0, doseKgHa) * 10) / 10,
        mineralNReserveKgHa: Math.round(mineralNReserveKgHa * 10) / 10,
    };
}
