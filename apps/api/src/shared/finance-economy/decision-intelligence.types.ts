export type StrategyForecastScopeLevel = "company" | "farm" | "field";
export type StrategyForecastDomain = "agro" | "economics" | "finance" | "risk";
export type StrategyScenarioLever =
  | "yield_pct"
  | "sales_price_pct"
  | "input_cost_pct"
  | "opex_pct"
  | "working_capital_days"
  | "disease_risk_pct";

export interface StrategyForecastRunRequest {
  scopeLevel: StrategyForecastScopeLevel;
  seasonId: string;
  horizonDays: 30 | 90 | 180 | 365;
  farmId?: string;
  fieldId?: string;
  crop?: string;
  domains: StrategyForecastDomain[];
  scenario?: {
    name: string;
    adjustments: Array<{
      lever: StrategyScenarioLever;
      operator: "delta";
      value: number;
    }>;
  };
}

export interface StrategyForecastScenarioSaveRequest {
  name: string;
  scopeLevel: StrategyForecastScopeLevel;
  seasonId: string;
  horizonDays: 30 | 90 | 180 | 365;
  farmId?: string;
  fieldId?: string;
  crop?: string;
  domains: StrategyForecastDomain[];
  leverValues: Partial<Record<StrategyScenarioLever, string>>;
}

export interface StrategyForecastScenarioDto {
  id: string;
  name: string;
  scopeLevel: StrategyForecastScopeLevel;
  seasonId: string;
  horizonDays: 30 | 90 | 180 | 365;
  farmId: string;
  fieldId: string;
  crop: string;
  domains: StrategyForecastDomain[];
  leverValues: Record<StrategyScenarioLever, string>;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyForecastRunResponse {
  traceId: string;
  degraded: boolean;
  degradationReasons: string[];
  lineage: Array<{
    source: string;
    status: "ok" | "degraded" | "not_requested" | "missing";
    detail: string;
  }>;
  baseline: {
    revenue: number;
    margin: number;
    cashFlow: number;
    yield?: number;
    riskScore: number;
  };
  range: {
    revenue: { p10: number; p50: number; p90: number };
    margin: { p10: number; p50: number; p90: number };
    cashFlow: { p10: number; p50: number; p90: number };
    yield?: { p10: number; p50: number; p90: number };
  };
  scenarioDelta?: {
    revenue: number;
    margin: number;
    cashFlow: number;
    yield?: number;
    riskScore: number;
  };
  drivers: Array<{ name: string; direction: "up" | "down"; strength: number }>;
  recommendedAction: string;
  tradeoff: string;
  limitations: string[];
  evidence: string[];
  riskTier: "low" | "medium" | "high";
  optimizationPreview: {
    objective: string;
    planningHorizon: string;
    constraints: string[];
    recommendations: Array<{
      action: string;
      expectedImpact: string;
      confidence: "high" | "medium" | "low";
    }>;
  };
}

export interface StrategyForecastRunHistoryItemDto {
  id: string;
  traceId: string;
  scopeLevel: StrategyForecastScopeLevel;
  seasonId: string;
  horizonDays: 30 | 90 | 180 | 365;
  domains: StrategyForecastDomain[];
  degraded: boolean;
  riskTier: "low" | "medium" | "high";
  recommendedAction: string;
  scenarioName?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  evaluation: {
    status: "pending" | "feedback_recorded";
    revenueErrorPct?: number | null;
    marginErrorPct?: number | null;
    cashFlowErrorPct?: number | null;
    yieldErrorPct?: number | null;
    note?: string | null;
    feedbackAt?: string | null;
  };
}

export interface StrategyForecastRunHistoryQueryDto {
  limit?: number;
  offset?: number;
  seasonId?: string;
  riskTier?: "low" | "medium" | "high";
  degraded?: boolean;
}

export interface StrategyForecastRunHistoryResponseDto {
  items: StrategyForecastRunHistoryItemDto[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface StrategyForecastRunFeedbackRequest {
  actualRevenue?: number;
  actualMargin?: number;
  actualCashFlow?: number;
  actualYield?: number;
  note?: string;
}
