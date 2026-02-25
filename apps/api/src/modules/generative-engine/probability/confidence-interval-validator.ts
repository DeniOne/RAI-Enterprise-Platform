import { Injectable, Logger, BadRequestException } from "@nestjs/common";

/**
 * ConfidenceIntervalValidator — Валидация доверительных интервалов (I23).
 *
 * Инвариант:
 * 1. 0.8 <= confidence_level <= 0.99
 * 2. lower_bound < upper_bound
 */
@Injectable()
export class ConfidenceIntervalValidator {
  private readonly logger = new Logger(ConfidenceIntervalValidator.name);

  validateInterval(lower: number, upper: number, confidence: number): void {
    if (confidence < 0.8 || confidence > 0.99) {
      throw new BadRequestException(
        `[I23] Confidence Level Violation: ${confidence} not in [0.8, 0.99]`,
      );
    }

    if (lower >= upper) {
      throw new BadRequestException(
        `[I23] Interval Violation: lower (${lower}) >= upper (${upper})`,
      );
    }
  }
}
