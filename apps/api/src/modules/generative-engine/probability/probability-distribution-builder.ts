import { Injectable } from "@nestjs/common";
import { NormalizationEnforcer } from "./normalization-enforcer";

export interface Distribution {
  values: number[];
  probabilities: number[];
  type: "GAUSSIAN" | "UNIFORM";
}

@Injectable()
export class ProbabilityDistributionBuilder {
  constructor(private readonly normalizer: NormalizationEnforcer) {}

  /**
   * Строит Гауссово распределение (дискретное приближение).
   */
  buildGaussian(
    mean: number,
    stdDev: number,
    points: number = 10,
  ): Distribution {
    const values: number[] = [];
    const probs: number[] = [];

    // Simple discrete approximation within +/- 3 sigma
    const start = mean - 3 * stdDev;
    const end = mean + 3 * stdDev;
    const step = (end - start) / (points - 1);

    for (let i = 0; i < points; i++) {
      const x = start + i * step;
      values.push(x);
      // PDF: (1 / (sigma * sqrt(2pi))) * exp(-0.5 * ((x-mu)/sigma)^2)
      const p =
        (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      probs.push(p);
    }

    // Normalize because discrete sampling doesn't sum to 1 automatically
    const normalizedProbs = this.normalizer.normalize(probs);

    return {
      values,
      probabilities: normalizedProbs,
      type: "GAUSSIAN",
    };
  }
}
