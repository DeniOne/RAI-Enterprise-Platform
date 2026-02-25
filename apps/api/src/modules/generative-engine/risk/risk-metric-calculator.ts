import { Injectable, Logger } from "@nestjs/common";

/**
 * RiskMetricCalculator — Калькулятор метрик риска Level C.
 *
 * Рассчитывает:
 * - Yield Risk (агрономический)
 * - Financial Risk (финансовый)
 * - Compliance Risk (регуляторный)
 * - Aggregated Risk (взвешенная сумма)
 *
 * Все результаты нормализованы в [0, 1].
 */

export interface RiskInput {
  yieldExpected: number; // т/га
  yieldOverride: number; // т/га после override
  costExpected: number; // руб/га
  costOverride: number; // руб/га после override
  complianceScore: number; // [0, 1] — степень соответствия нормам
}

export interface RiskOutput {
  yieldRisk: number; // [0, 1]
  financialRisk: number; // [0, 1]
  complianceRisk: number; // [0, 1]
  aggregated: number; // [0, 1]
}

@Injectable()
export class RiskMetricCalculator {
  private readonly logger = new Logger(RiskMetricCalculator.name);

  // Веса по умолчанию для агрегации
  private static readonly DEFAULT_WEIGHTS = {
    yield: 0.4,
    financial: 0.35,
    compliance: 0.25,
  };

  /**
   * Рассчитывает все метрики риска.
   */
  calculate(input: RiskInput): RiskOutput {
    const yieldRisk = this.yieldRisk(input.yieldExpected, input.yieldOverride);
    const financialRisk = this.financialRisk(
      input.costExpected,
      input.costOverride,
    );
    const complianceRisk = this.complianceRisk(input.complianceScore);

    const aggregated = this.aggregate(yieldRisk, financialRisk, complianceRisk);

    return { yieldRisk, financialRisk, complianceRisk, aggregated };
  }

  /**
   * Yield Risk: |ΔYield / max(Expected, 1e-6)|, clamp [0, 1]
   */
  private yieldRisk(expected: number, override: number): number {
    const denom = Math.max(Math.abs(expected), 1e-6);
    const raw = Math.abs(override - expected) / denom;
    return Math.min(Math.max(raw, 0), 1);
  }

  /**
   * Financial Risk: ΔCost / max(Expected, 1e-6), clamp [0, 1]
   * Только upside risk (увеличение затрат).
   */
  private financialRisk(expected: number, override: number): number {
    const denom = Math.max(Math.abs(expected), 1e-6);
    const delta = override - expected;
    const raw = Math.max(delta, 0) / denom;
    return Math.min(raw, 1);
  }

  /**
   * Compliance Risk: 1 - complianceScore, clamp [0, 1]
   */
  private complianceRisk(complianceScore: number): number {
    return Math.min(Math.max(1 - complianceScore, 0), 1);
  }

  /**
   * Агрегированный риск — взвешенная сумма, clamp [0, 1].
   */
  private aggregate(
    yieldRisk: number,
    financialRisk: number,
    complianceRisk: number,
  ): number {
    const w = RiskMetricCalculator.DEFAULT_WEIGHTS;
    const raw =
      w.yield * yieldRisk +
      w.financial * financialRisk +
      w.compliance * complianceRisk;
    return Math.min(Math.max(raw, 0), 1);
  }
}
