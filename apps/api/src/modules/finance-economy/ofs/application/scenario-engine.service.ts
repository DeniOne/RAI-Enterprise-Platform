import { Injectable } from "@nestjs/common";
import type {
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
} from "./decision-intelligence.service";

@Injectable()
export class ScenarioEngineService {
  applyScenarioDelta(
    baseline: StrategyForecastRunResponse["baseline"],
    adjustments: NonNullable<StrategyForecastRunRequest["scenario"]>["adjustments"],
  ): StrategyForecastRunResponse["scenarioDelta"] {
    let revenueDelta = 0;
    let marginDelta = 0;
    let cashFlowDelta = 0;
    let yieldDelta = 0;
    let riskDelta = 0;

    for (const adjustment of adjustments) {
      const factor = adjustment.value / 100;
      if (adjustment.lever === "yield_pct") {
        revenueDelta += baseline.revenue * factor * 0.55;
        marginDelta += baseline.margin * factor * 0.65;
        if (typeof baseline.yield === "number") {
          yieldDelta += baseline.yield * factor;
        }
      }
      if (adjustment.lever === "sales_price_pct") {
        revenueDelta += baseline.revenue * factor * 0.8;
        marginDelta += baseline.margin * factor * 0.72;
      }
      if (adjustment.lever === "input_cost_pct") {
        marginDelta -= Math.abs(baseline.revenue * factor * 0.28);
        cashFlowDelta -= Math.abs(baseline.cashFlow * factor * 0.24);
      }
      if (adjustment.lever === "opex_pct") {
        marginDelta -= Math.abs(baseline.margin * factor * 0.6);
        cashFlowDelta -= Math.abs(baseline.cashFlow * factor * 0.32);
      }
      if (adjustment.lever === "working_capital_days") {
        cashFlowDelta -= adjustment.value * 15000;
        riskDelta += Math.max(0, adjustment.value * 0.45);
      }
      if (adjustment.lever === "disease_risk_pct") {
        riskDelta += adjustment.value * 0.7;
        revenueDelta -= baseline.revenue * factor * 0.22;
      }
    }

    return {
      revenue: this.roundMoney(revenueDelta),
      margin: this.roundMoney(marginDelta),
      cashFlow: this.roundMoney(cashFlowDelta),
      ...(typeof baseline.yield === "number" ? { yield: this.roundMetric(yieldDelta) } : {}),
      riskScore: this.roundMetric(riskDelta),
    };
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private roundMetric(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
