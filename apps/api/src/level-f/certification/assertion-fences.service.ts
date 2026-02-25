import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { SnapshotPayload } from "../snapshot/snapshot.service";

/**
 * Обобщенный результат проверки оград (Fences)
 */
export interface FenceResult {
  passed: boolean;
  violations: string[];
}

@Injectable()
export class AssertionFencesService {
  private readonly logger = new Logger(AssertionFencesService.name);

  // Константы инвариантов Level F
  private readonly MAX_FR_RISK = 0.85; // Финансовый риск (FR) не может превышать 85%
  private readonly MIN_RCS = 60; // Risk Calibration Score не ниже 60

  /**
   * Чистая, stateless функция проверки инвариантов (Assertion Fences)
   */
  public evaluateFences(payload: SnapshotPayload): FenceResult {
    const violations: string[] = [];
    this.logger.debug(
      `Evaluating Assertion Fences for Snapshot: ${payload.previousHash}`,
    );

    // Имуляция логики поверх сырых данных (В реальности тут будет парсинг Level E кортежей)
    if (!payload.rawSource || payload.rawSource.length === 0) {
      violations.push(
        "I40: Payload lacks rawSource (Data Availability Requirement)",
      );
      return { passed: false, violations };
    }

    // Имуляция извлечения агрегатных метрик
    const aggregateMetrics = this.extractMetrics(payload.rawSource);

    // Fence 1: Максимальный финансовый риск (FR) - Hard Level F Constraint
    if (aggregateMetrics.financialRisk > this.MAX_FR_RISK) {
      violations.push(
        `FR_OVERFLOW: Financial Risk (${aggregateMetrics.financialRisk}) exceeds threshold (${this.MAX_FR_RISK})`,
      );
    }

    // Fence 2: Калибровка Риска (Level C Regret bounds)
    if (aggregateMetrics.riskCalibrationScore < this.MIN_RCS) {
      violations.push(
        `RCS_UNDERFLOW: Risk Calibration Score (${aggregateMetrics.riskCalibrationScore}) is below minimum (${this.MIN_RCS})`,
      );
    }

    const passed = violations.length === 0;
    if (!passed) {
      this.logger.warn(`Assertion Fences Failed: ${violations.join(", ")}`);
    }

    return {
      passed,
      violations,
    };
  }

  /**
   * Stub для извлечения метрик из массива rawSource
   */
  private extractMetrics(rawSource: any[]) {
    // Представим, что мы агрегируем данные O(N) O(1) space
    return {
      financialRisk: 0.5, // Safe mock value
      riskCalibrationScore: 80, // Safe mock value
    };
  }
}
