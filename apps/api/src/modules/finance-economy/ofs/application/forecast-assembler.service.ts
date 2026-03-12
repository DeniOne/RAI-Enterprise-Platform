import { Injectable } from "@nestjs/common";
import type {
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
} from "./decision-intelligence.service";

@Injectable()
export class ForecastAssemblerService {
  assemble(params: {
    request: StrategyForecastRunRequest;
    currentBalance: number;
    totalAccounts: number;
    budgetLimit: number;
    budgetConsumed: number;
    budgetRemaining: number;
    burnRate: number;
    expectedYield?: number;
    diseaseRiskScore: number;
    savingPotential: number;
    totalCostPerHa: number;
    liquidityAvailable: boolean;
    budgetStatsAvailable: boolean;
    costAnalysisAvailable: boolean;
    yieldPredictionAvailable: boolean;
    diseaseRiskAvailable: boolean;
  }): {
    baselineRevenue: number;
    baselineMargin: number;
    baselineCashFlow: number;
    range: StrategyForecastRunResponse["range"];
    lineage: StrategyForecastRunResponse["lineage"];
    evidence: string[];
  } {
    const scaleFactor =
      params.request.scopeLevel === "company" ? 1 :
      params.request.scopeLevel === "farm" ? 0.45 :
      0.08;
    const yieldRevenueComponent = params.expectedYield ? params.expectedYield * 18000 * scaleFactor : 0;
    const budgetRevenueComponent =
      params.budgetLimit > 0
        ? params.budgetLimit * (1.05 + (1 - Math.min(params.burnRate, 1)) * 0.2)
        : 0;
    const liquiditySupportComponent = Math.max(params.currentBalance, params.totalAccounts) * 0.18;
    const efficiencyComponent = params.savingPotential * 2.4;

    const baselineRevenue = this.roundMoney(
      yieldRevenueComponent + budgetRevenueComponent + liquiditySupportComponent + efficiencyComponent,
    );
    const areaMultiplier =
      params.request.scopeLevel === "field" ? 35 : params.request.scopeLevel === "farm" ? 180 : 520;
    const baselineCost = this.roundMoney(
      params.budgetConsumed +
      Math.max(0, params.budgetLimit - params.budgetRemaining) * 0.2 +
      params.totalCostPerHa * areaMultiplier,
    );
    const baselineMargin = this.roundMoney(baselineRevenue - baselineCost);
    const baselineCashFlow = this.roundMoney(
      params.currentBalance + params.budgetRemaining - baselineCost * 0.12 + efficiencyComponent * 0.25,
    );

    const rangeVolatility = 0.12 + Math.min(0.18, params.diseaseRiskScore * 0.2 + params.burnRate * 0.12);
    const range: StrategyForecastRunResponse["range"] = {
      revenue: this.toRange(baselineRevenue, rangeVolatility + 0.06),
      margin: this.toRange(baselineMargin, rangeVolatility + 0.04),
      cashFlow: this.toRange(baselineCashFlow, rangeVolatility + 0.03),
      ...(params.expectedYield !== undefined
        ? { yield: this.toRange(this.roundMetric(params.expectedYield), Math.max(0.06, rangeVolatility - 0.03)) }
        : {}),
    };

    const lineage: StrategyForecastRunResponse["lineage"] = [
      {
        source: "finance.liquidity_forecast",
        status: params.liquidityAvailable ? "ok" : "degraded",
        detail: params.liquidityAvailable
          ? `currentBalance=${params.currentBalance}`
          : "source unavailable during forecast run",
      },
      {
        source: "finance.budget_stats",
        status: params.budgetStatsAvailable ? "ok" : "degraded",
        detail: params.budgetStatsAvailable
          ? `remaining=${params.budgetRemaining}; burnRate=${params.burnRate}`
          : "budget stats unavailable during forecast run",
      },
      {
        source: "economics.cost_analysis",
        status: params.request.domains.includes("economics") || params.request.domains.includes("finance")
          ? (params.costAnalysisAvailable ? "ok" : "degraded")
          : "not_requested",
        detail: params.costAnalysisAvailable
          ? `savingPotential=${params.savingPotential}`
          : "not requested or unavailable",
      },
      {
        source: "agro.yield_prediction",
        status: params.request.domains.includes("agro")
          ? (params.yieldPredictionAvailable ? "ok" : "missing")
          : "not_requested",
        detail: params.expectedYield !== undefined
          ? `expectedYield=${params.expectedYield}`
          : "field/crop context missing or source unavailable",
      },
      {
        source: "risk.disease_signal",
        status: params.request.domains.includes("risk")
          ? (params.diseaseRiskAvailable ? "ok" : "missing")
          : "not_requested",
        detail: `overallRisk=${params.diseaseRiskScore}`,
      },
    ];

    return {
      baselineRevenue,
      baselineMargin,
      baselineCashFlow,
      range,
      lineage,
      evidence: [
        "finance.cash_accounts",
        "finance.budgets",
        "finance.liquidity_forecast",
        "rai.expert.data_scientist",
      ],
    };
  }

  private toRange(value: number, volatility: number) {
    const abs = Math.abs(value);
    const span = abs * Math.max(0.04, volatility);
    return {
      p10: this.roundMoney(value - span),
      p50: this.roundMoney(value),
      p90: this.roundMoney(value + span),
    };
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private roundMetric(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
