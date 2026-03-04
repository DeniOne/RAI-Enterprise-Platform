/**
 * Калькулятор GDD-окон операций (§3.2.2 GRAND_SYNTHESIS)
 *
 * GDD (Growing Degree Days) — сумма активных температур выше baseTemp.
 * GDD за день = max(0, (tMin + tMax) / 2 - baseTemp)
 *
 * Pure functions — без side-effects, без IO.
 */

// ──────────────────────────────────────────────
// Типы
// ──────────────────────────────────────────────

export interface DailyTemp {
    /** ISO-дата, например '2026-04-15' */
    date: string;
    tMin: number;
    tMax: number;
}

export interface GDDToDateParams {
    dailyTemps: DailyTemp[];
    /** Базовая температура, °C (для рапса 0 или 5) */
    baseTemp: number;
    /** ISO-дата начала накопления (включительно) */
    startDate: string;
}

export interface GDDToDateResult {
    /** Суммарный накопленный GDD за период */
    gddAccumulated: number;
    /** Накопленный GDD нарастающим итогом по датам */
    gddByDate: Record<string, number>;
}

export interface RegionProfile {
    gddBaseTempC: number;
    avgGddSeason: number;
}

export interface EstimateOperationDateParams {
    /** Целевой GDD для данной операции */
    gddTarget: number;
    regionProfile: RegionProfile;
    /** ISO-дата начала сезона */
    seasonStartDate: string;
    /** Средний GDD/день в регионе в активный сезон */
    historicalGDDRate: number;
}

export interface EstimateOperationDateResult {
    /** Расчётная дата операции (ISO) */
    estimatedDate: string;
    /** Доверительный диапазон ±N дней */
    confidenceRangeDays: number;
}

// ──────────────────────────────────────────────
// Функции
// ──────────────────────────────────────────────

/**
 * Рассчитывает накопление GDD по фактическим температурным данным.
 */
export function calculateGDDToDate(params: GDDToDateParams): GDDToDateResult {
    const { dailyTemps, baseTemp, startDate } = params;

    const startTs = new Date(startDate).getTime();

    const gddByDate: Record<string, number> = {};
    let accumulated = 0;

    for (const day of dailyTemps) {
        const dayTs = new Date(day.date).getTime();
        if (dayTs < startTs) continue;

        const avgTemp = (day.tMin + day.tMax) / 2;
        const dailyGDD = Math.max(0, avgTemp - baseTemp);
        accumulated += dailyGDD;
        gddByDate[day.date] = Math.round(accumulated * 10) / 10;
    }

    return {
        gddAccumulated: Math.round(accumulated * 10) / 10,
        gddByDate,
    };
}

/**
 * Оценивает дату операции по целевому GDD и историческому темпу накопления.
 * Не требует фактических температур — работает на прогнозных/средних данных.
 */
export function estimateOperationDate(
    params: EstimateOperationDateParams,
): EstimateOperationDateResult {
    const { gddTarget, historicalGDDRate, seasonStartDate } = params;

    if (historicalGDDRate <= 0) {
        throw new Error("historicalGDDRate должен быть > 0");
    }

    // Количество дней от начала сезона до достижения gddTarget
    const daysFromStart = gddTarget / historicalGDDRate;

    const startDate = new Date(seasonStartDate);
    const estimatedDate = new Date(
        startDate.getTime() + daysFromStart * 24 * 60 * 60 * 1000,
    );

    // Доверительный диапазон: ±15% от расчётного срока (агрономическая практика)
    const confidenceRangeDays = Math.ceil(daysFromStart * 0.15);

    return {
        estimatedDate: estimatedDate.toISOString().slice(0, 10),
        confidenceRangeDays: Math.max(1, confidenceRangeDays),
    };
}
