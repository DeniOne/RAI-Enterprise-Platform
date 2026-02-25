import { Injectable, Logger } from "@nestjs/common";
import { roundHalfToEven } from "../deterministic/round-half-to-even";

/**
 * ConflictMatrixService — Расчёт Divergence Impact Score (DIS).
 *
 * ИНВАРИАНТ I29:
 *   DIS = clamp(Σ w_i * f_i, 0, 1)
 *
 * Факторы f_i:
 *   f1 = |ΔYield| / max(BaseYield, ε)       — Yield Divergence
 *   f2 = |ΔCost| / max(BaseCost, ε)         — Cost Divergence
 *   f3 = |ΔRisk|                             — Risk Divergence (уже в [0,1])
 *   f4 = OperationCountDelta / TotalOps      — Structural Divergence
 *
 * Zero-Denominator Safeguard: denom < 1e-6 → factor = 0
 */

export interface ConflictVector {
  yieldDivergence: number; // f1
  costDivergence: number; // f2
  riskDivergence: number; // f3
  structuralDivergence: number; // f4
}

export interface DISWeights {
  w1: number; // Yield weight
  w2: number; // Cost weight
  w3: number; // Risk weight
  w4: number; // Structural weight
}

export interface ConflictMatrixInput {
  aiYield: number;
  humanYield: number;
  aiCost: number;
  humanCost: number;
  deltaRisk: number; // Абсолютное значение
  aiOperationCount: number;
  humanOperationCount: number;
  weights: DISWeights;
}

export interface ConflictMatrixResult {
  disScore: number; // [0, 1]
  conflictVector: ConflictVector;
  weights: DISWeights;
  zeroSafeguardTriggered: boolean;
}

@Injectable()
export class ConflictMatrixService {
  private readonly logger = new Logger(ConflictMatrixService.name);
  private static readonly EPSILON = 1e-6;

  /**
   * Рассчитывает DIS (Divergence Impact Score).
   */
  calculate(input: ConflictMatrixInput): ConflictMatrixResult {
    let zeroSafeguardTriggered = false;

    // f1: Yield Divergence
    const yieldDenom = Math.max(
      Math.abs(input.aiYield),
      ConflictMatrixService.EPSILON,
    );
    let f1: number;
    if (Math.abs(input.aiYield) < ConflictMatrixService.EPSILON) {
      f1 = 0;
      zeroSafeguardTriggered = true;
      this.logger.warn(
        `[ZERO_DENOMINATOR_SAFEGUARD_TRIGGERED] f1 (yield): aiYield=${input.aiYield}`,
      );
    } else {
      f1 = Math.abs(input.humanYield - input.aiYield) / yieldDenom;
    }

    // f2: Cost Divergence
    let f2: number;
    if (Math.abs(input.aiCost) < ConflictMatrixService.EPSILON) {
      f2 = 0;
      zeroSafeguardTriggered = true;
      this.logger.warn(
        `[ZERO_DENOMINATOR_SAFEGUARD_TRIGGERED] f2 (cost): aiCost=${input.aiCost}`,
      );
    } else {
      f2 = Math.abs(input.humanCost - input.aiCost) / Math.abs(input.aiCost);
    }

    // f3: Risk Divergence — уже в [0, 1]
    const f3 = Math.abs(input.deltaRisk);

    // f4: Structural Divergence
    const totalOps = Math.max(
      input.aiOperationCount + input.humanOperationCount,
      1, // Защита от деления на 0
    );
    let f4: number;
    if (totalOps < ConflictMatrixService.EPSILON) {
      f4 = 0;
      zeroSafeguardTriggered = true;
      this.logger.warn(
        `[ZERO_DENOMINATOR_SAFEGUARD_TRIGGERED] f4: totalOps=${totalOps}`,
      );
    } else {
      f4 =
        Math.abs(input.humanOperationCount - input.aiOperationCount) / totalOps;
    }

    // Clamp factors to [0, 1]
    f1 = Math.min(Math.max(f1, 0), 1);
    f2 = Math.min(Math.max(f2, 0), 1);
    const f3Clamped = Math.min(Math.max(f3, 0), 1);
    f4 = Math.min(Math.max(f4, 0), 1);

    // DIS = clamp(Σ w_i * f_i, 0, 1)
    const rawDIS =
      input.weights.w1 * f1 +
      input.weights.w2 * f2 +
      input.weights.w3 * f3Clamped +
      input.weights.w4 * f4;

    const disScore = roundHalfToEven(Math.min(Math.max(rawDIS, 0), 1));

    const conflictVector: ConflictVector = {
      yieldDivergence: roundHalfToEven(f1),
      costDivergence: roundHalfToEven(f2),
      riskDivergence: roundHalfToEven(f3Clamped),
      structuralDivergence: roundHalfToEven(f4),
    };

    this.logger.log(
      `[I29] DIS=${disScore}, vector=[${conflictVector.yieldDivergence}, ` +
        `${conflictVector.costDivergence}, ${conflictVector.riskDivergence}, ` +
        `${conflictVector.structuralDivergence}]`,
    );

    return {
      disScore,
      conflictVector,
      weights: input.weights,
      zeroSafeguardTriggered,
    };
  }

  /**
   * Валидирует что веса суммируются до 1.0 ± epsilon.
   */
  validateWeights(weights: DISWeights): boolean {
    const sum = weights.w1 + weights.w2 + weights.w3 + weights.w4;
    return Math.abs(sum - 1.0) < 0.01;
  }
}
