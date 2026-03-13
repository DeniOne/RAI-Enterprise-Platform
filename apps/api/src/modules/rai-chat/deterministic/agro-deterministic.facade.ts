import { Injectable } from "@nestjs/common";
import type { ExplainableResult } from "../../../shared/rai-chat/explainable-result.types";
import { calculateSeedingRate } from "../../tech-map/calculators/seeding-rate.calculator";
import { calculateNitrogenDose } from "../../tech-map/calculators/fertilizer-dose.calculator";
import {
  estimateOperationDate,
  type EstimateOperationDateParams,
} from "../../tech-map/calculators/gdd-window.calculator";

export interface SeedingRateParams {
  targetDensityMlnHa: number;
  thousandSeedWeightG: number;
  labGerminationPct: number;
  fieldGerminationPct: number;
}

export interface FertilizerDoseParams {
  targetYieldTHa: number;
  nUptakeKgPerT: number;
  soilNMineralMgKg: number;
  soilUtilizationCoeff: number;
  fertUtilizationCoeff: number;
  bulkDensityGCm3: number;
  samplingDepthCm: number;
}

export interface GDDWindowParams extends EstimateOperationDateParams {}

@Injectable()
export class AgroDeterministicEngineFacade {
  computeSeedingRate(params: SeedingRateParams): ExplainableResult<number> {
    const result = calculateSeedingRate(params);
    const variables = {
      targetDensityMlnHa: params.targetDensityMlnHa,
      thousandSeedWeightG: params.thousandSeedWeightG,
      labGerminationPct: params.labGerminationPct,
      fieldGerminationPct: params.fieldGerminationPct,
    };
    const germinationFactor =
      (params.labGerminationPct * params.fieldGerminationPct) / 10000;
    return {
      value: result.weightedRateKgHa,
      formula:
        "(targetDensityMlnHa × 1e6 × thousandSeedWeightG / 1000) / (labGerm × fieldGerm / 10000) / 1000 → кг/га",
      variables,
      unit: "кг/га",
      explanation: `Норма высева рассчитана по целевой густоте ${params.targetDensityMlnHa} млн/га, МТС ${params.thousandSeedWeightG} г, всхожесть лаб/полевая ${params.labGerminationPct}%/${params.fieldGerminationPct}%. Коэффициент всхожести ${germinationFactor.toFixed(4)}.`,
    };
  }

  computeFertilizerDose(
    params: FertilizerDoseParams,
  ): ExplainableResult<number> {
    const result = calculateNitrogenDose(params);
    const variables = {
      targetYieldTHa: params.targetYieldTHa,
      nUptakeKgPerT: params.nUptakeKgPerT,
      soilNMineralMgKg: params.soilNMineralMgKg,
      soilUtilizationCoeff: params.soilUtilizationCoeff,
      fertUtilizationCoeff: params.fertUtilizationCoeff,
      bulkDensityGCm3: params.bulkDensityGCm3,
      samplingDepthCm: params.samplingDepthCm,
      mineralNReserveKgHa: result.mineralNReserveKgHa,
    };
    return {
      value: result.doseKgHa,
      formula:
        "(nUptake × targetYield − mineralNReserve × soilUtil) / fertUtil → кг/га д.в.",
      variables,
      unit: "кг/га д.в.",
      explanation: `Доза N по выносу ${params.nUptakeKgPerT} кг/т при урожайности ${params.targetYieldTHa} т/га, запас почвенного N ${result.mineralNReserveKgHa.toFixed(1)} кг/га, коэффициенты использования почвы/удобрения ${params.soilUtilizationCoeff}/${params.fertUtilizationCoeff}.`,
    };
  }

  predictGDDWindow(
    params: GDDWindowParams,
  ): ExplainableResult<{ start: Date; end: Date }> {
    const result = estimateOperationDate(params);
    const center = new Date(result.estimatedDate);
    const start = new Date(
      center.getTime() -
        result.confidenceRangeDays * 24 * 60 * 60 * 1000,
    );
    const end = new Date(
      center.getTime() +
        result.confidenceRangeDays * 24 * 60 * 60 * 1000,
    );
    return {
      value: { start, end },
      formula:
        "seasonStart + (gddTarget / historicalGDDRate) дней ± confidenceRangeDays",
      variables: {
        gddTarget: params.gddTarget,
        historicalGDDRate: params.historicalGDDRate,
        confidenceRangeDays: result.confidenceRangeDays,
      },
      unit: "даты",
      explanation: `Окно операции по целевому GDD ${params.gddTarget}, темп накопления ${params.historicalGDDRate} GDD/день от ${params.seasonStartDate}. Расчётная дата ${result.estimatedDate}, диапазон ±${result.confidenceRangeDays} дн.`,
    };
  }
}
