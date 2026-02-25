import { Injectable } from "@nestjs/common";

@Injectable()
export class ExpectationCalculator {
  /**
   * Рассчитывает математическое ожидание (E[X]).
   * E[X] = sum(x_i * p_i)
   */
  calculateExpectation(values: number[], probabilities: number[]): number {
    if (values.length !== probabilities.length) {
      throw new Error("Values and probabilities length mismatch");
    }

    return values.reduce((sum, val, idx) => sum + val * probabilities[idx], 0);
  }
}
