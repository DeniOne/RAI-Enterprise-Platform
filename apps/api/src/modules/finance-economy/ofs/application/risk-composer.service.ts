import { Injectable } from "@nestjs/common";

@Injectable()
export class RiskComposerService {
  composeBaselineRisk(params: {
    diseaseRiskScore: number;
    burnRate: number;
    baselineCashFlow: number;
  }): number {
    return this.normalizeRiskScore(
      params.diseaseRiskScore * 100 +
      Math.min(40, params.burnRate * 35) +
      (params.baselineCashFlow < 0 ? 20 : 0),
    );
  }

  determineRiskTier(score: number): "low" | "medium" | "high" {
    if (score >= 70) {
      return "high";
    }
    if (score >= 45) {
      return "medium";
    }
    return "low";
  }

  private normalizeRiskScore(value: number): number {
    return Math.max(0, Math.min(100, value));
  }
}
