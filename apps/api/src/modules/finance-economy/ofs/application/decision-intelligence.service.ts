import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Prisma } from "@rai/prisma-client";
import { FinanceService } from "../../finance/application/finance.service";
import { BudgetService } from "../../finance/application/budget.service";
import { LiquidityForecastService } from "../../finance/application/liquidity-forecast.service";
import { PrismaService } from "../../../../shared/prisma/prisma.service";
import { DataScientistService } from "../../../rai-chat/expert/data-scientist.service";
import { ForecastAssemblerService } from "./forecast-assembler.service";
import { ScenarioEngineService } from "./scenario-engine.service";
import { RiskComposerService } from "./risk-composer.service";
import { DecisionRecommendationComposerService } from "./decision-recommendation-composer.service";
import { StrategyForecastOptimizationService } from "./strategy-forecast-optimization.service";
import { DecisionEvaluationService } from "./decision-evaluation.service";

export type StrategyForecastScopeLevel = "company" | "farm" | "field";
export type StrategyForecastDomain = "agro" | "economics" | "finance" | "risk";
export type StrategyScenarioLever =
  | "yield_pct"
  | "sales_price_pct"
  | "input_cost_pct"
  | "opex_pct"
  | "working_capital_days"
  | "disease_risk_pct";

const STRATEGY_SCENARIO_LEVERS: StrategyScenarioLever[] = [
  "yield_pct",
  "sales_price_pct",
  "input_cost_pct",
  "opex_pct",
  "working_capital_days",
  "disease_risk_pct",
];

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

export interface StrategyForecastRunFeedbackRequest {
  actualRevenue?: number;
  actualMargin?: number;
  actualCashFlow?: number;
  actualYield?: number;
  note?: string;
}

@Injectable()
export class DecisionIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly budgetService: BudgetService,
    private readonly liquidityForecastService: LiquidityForecastService,
    private readonly dataScientistService: DataScientistService,
    private readonly forecastAssembler: ForecastAssemblerService,
    private readonly scenarioEngine: ScenarioEngineService,
    private readonly riskComposer: RiskComposerService,
    private readonly recommendationComposer: DecisionRecommendationComposerService,
    private readonly optimizationService: StrategyForecastOptimizationService,
    private readonly decisionEvaluationService: DecisionEvaluationService,
  ) {}

  async runStrategyForecast(
    companyId: string,
    request: StrategyForecastRunRequest,
    createdByUserId?: string | null,
  ): Promise<StrategyForecastRunResponse> {
    this.validateRequest(request);

    const degradationReasons: string[] = [];
    const traceId = `di_${randomUUID()}`;

    const [liquidity, budgetStats, cashAccounts, season, costAnalysis, yieldPrediction, diseaseRisk] =
      await Promise.all([
        this.liquidityForecastService
          .getForecast(companyId, request.horizonDays)
          .catch((error) => {
            degradationReasons.push(`liquidity_forecast_unavailable:${this.toReason(error)}`);
            return null;
          }),
        this.budgetService.getStats(companyId).catch((error) => {
          degradationReasons.push(`budget_stats_unavailable:${this.toReason(error)}`);
          return null;
        }),
        this.financeService.getCashAccounts(companyId).catch((error) => {
          degradationReasons.push(`cash_accounts_unavailable:${this.toReason(error)}`);
          return [];
        }),
        this.prisma.season.findFirst({
          where: { id: request.seasonId, companyId },
          select: {
            id: true,
            year: true,
            fieldId: true,
            expectedYield: true,
            actualYield: true,
          },
        }).catch((error) => {
          degradationReasons.push(`season_lookup_unavailable:${this.toReason(error)}`);
          return null;
        }),
        request.domains.includes("economics") || request.domains.includes("finance")
          ? this.dataScientistService.analyzeCosts(companyId, request.seasonId).catch((error) => {
            degradationReasons.push(`cost_analysis_unavailable:${this.toReason(error)}`);
            return null;
          })
          : Promise.resolve(null),
        request.fieldId && request.crop && request.domains.includes("agro")
          ? this.dataScientistService.predictYield(companyId, request.fieldId, request.crop, request.seasonId).catch((error) => {
            degradationReasons.push(`yield_prediction_unavailable:${this.toReason(error)}`);
            return null;
          })
          : Promise.resolve(null),
        request.fieldId && request.crop && request.domains.includes("risk")
          ? this.dataScientistService.assessDiseaseRisk(companyId, request.fieldId, request.crop).catch((error) => {
            degradationReasons.push(`disease_risk_unavailable:${this.toReason(error)}`);
            return null;
          })
          : Promise.resolve(null),
      ]);

    if (!season) {
      degradationReasons.push("season_context_not_found");
    }

    const currentBalance = Number(liquidity?.currentBalance ?? 0);
    const budgetLimit = Number(budgetStats?.totalLimit ?? 0);
    const budgetConsumed = Number(budgetStats?.totalConsumed ?? 0);
    const budgetRemaining = Number(budgetStats?.totalRemaining ?? 0);
    const burnRate = Number(budgetStats?.burnRate ?? 0);
    let totalAccounts = 0;
    for (const account of cashAccounts) {
      totalAccounts += Number(account.balance ?? 0);
    }
    const expectedYield =
      yieldPrediction?.predictedYield ??
      (Number(season?.expectedYield ?? season?.actualYield ?? 0) ||
      undefined);
    const diseaseRiskScore = Number(diseaseRisk?.overallRisk ?? 0);
    const savingPotential = Number(
      costAnalysis?.optimizations.reduce(
        (sum, optimization) => sum + Number(optimization.savingPotential ?? 0),
        0,
      ) ?? 0,
    );

    const assembled = this.forecastAssembler.assemble({
      request,
      currentBalance,
      totalAccounts,
      budgetLimit,
      budgetConsumed,
      budgetRemaining,
      burnRate,
      expectedYield,
      diseaseRiskScore,
      savingPotential,
      totalCostPerHa: Number(costAnalysis?.totalCostPerHa ?? 0),
      liquidityAvailable: Boolean(liquidity),
      budgetStatsAvailable: Boolean(budgetStats),
      costAnalysisAvailable: Boolean(costAnalysis),
      yieldPredictionAvailable: Boolean(yieldPrediction),
      diseaseRiskAvailable: Boolean(diseaseRisk),
    });
    const baselineRiskScore = this.riskComposer.composeBaselineRisk({
      diseaseRiskScore,
      burnRate,
      baselineCashFlow: assembled.baselineCashFlow,
    });
    const baseline = {
      revenue: assembled.baselineRevenue,
      margin: assembled.baselineMargin,
      cashFlow: assembled.baselineCashFlow,
      ...(expectedYield !== undefined ? { yield: this.roundMetric(expectedYield) } : {}),
      riskScore: this.roundMetric(baselineRiskScore),
    };
    const range = assembled.range;
    const scenarioDelta = request.scenario
      ? this.scenarioEngine.applyScenarioDelta(baseline, request.scenario.adjustments)
      : undefined;

    const drivers = this.buildDrivers({
      budgetRemaining,
      burnRate,
      currentBalance,
      diseaseRiskScore,
      expectedYield,
      savingPotential,
    });
    const riskTier = this.riskComposer.determineRiskTier(baselineRiskScore);
    const recommendedAction = this.recommendationComposer.buildRecommendation({
      riskTier,
      budgetRemaining,
      burnRate,
      scenarioDelta,
    });
    const tradeoff = this.recommendationComposer.buildTradeoff({
      riskTier,
      savingPotential,
      scenarioDelta,
    });
    const optimizationPreview = this.optimizationService.buildPreview({
      request,
      riskTier,
      budgetLimit,
      budgetRemaining,
      burnRate,
      currentBalance,
      savingPotential,
      scenarioDelta,
    });

    const limitations = [
      "MVP-сборка: прогноз агрегирует доступные доменные сигналы и не является полным цифровым двойником бизнеса.",
      "Вероятностный диапазон строится эвристически поверх текущих финансовых и агрономических сигналов.",
      "Рыночные цены, логистические узкие места и внешние макро-сценарии пока не моделируются отдельно.",
    ];
    if (!request.fieldId || !request.crop) {
      limitations.push("Агрономический слой с урожайностью и фитопатологией ослаблен: не переданы fieldId и crop.");
    }

    const response: StrategyForecastRunResponse = {
      traceId,
      degraded: degradationReasons.length > 0,
      degradationReasons,
      lineage: assembled.lineage,
      baseline,
      range,
      ...(scenarioDelta ? { scenarioDelta } : {}),
      drivers,
      recommendedAction,
      tradeoff,
      limitations,
      evidence: assembled.evidence,
      riskTier,
      optimizationPreview,
    };

    await this.decisionEvaluationService.recordRun({
      companyId,
      createdByUserId,
      request: {
        ...request,
        scenario: request.scenario
          ? {
              name: request.scenario.name,
              adjustments: request.scenario.adjustments,
            }
          : undefined,
      },
      result: response,
    });

    return response;
  }

  async listSavedScenarios(companyId: string): Promise<StrategyForecastScenarioDto[]> {
    const rows = await this.prisma.strategyForecastScenario.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return rows.map((row) => this.mapScenarioRow(row));
  }

  async saveScenario(
    companyId: string,
    createdByUserId: string | null | undefined,
    request: StrategyForecastScenarioSaveRequest,
  ): Promise<StrategyForecastScenarioDto> {
    this.validateScenarioRequest(request);

    const saved = await this.prisma.strategyForecastScenario.create({
      data: {
        companyId,
        name: request.name.trim(),
        scopeLevel: request.scopeLevel,
        seasonId: request.seasonId.trim(),
        horizonDays: request.horizonDays,
        farmId: request.farmId?.trim() || null,
        fieldId: request.fieldId?.trim() || null,
        crop: request.crop?.trim() || null,
        domainsJson: request.domains as unknown as Prisma.InputJsonValue,
        leverValuesJson: this.normalizeLeverValues(
          request.leverValues,
        ) as unknown as Prisma.InputJsonValue,
        createdByUserId: createdByUserId ?? null,
      },
    });

    return this.mapScenarioRow(saved);
  }

  async deleteScenario(companyId: string, scenarioId: string): Promise<void> {
    const deleted = await this.prisma.strategyForecastScenario.deleteMany({
      where: { id: scenarioId, companyId },
    });

    if (deleted.count === 0) {
      throw new BadRequestException("strategy forecast scenario not found");
    }
  }

  async listRecentRuns(
    companyId: string,
    limit = 12,
  ): Promise<StrategyForecastRunHistoryItemDto[]> {
    return this.decisionEvaluationService.listRecentRuns(companyId, limit);
  }

  async recordOutcomeFeedback(
    companyId: string,
    runId: string,
    feedback: StrategyForecastRunFeedbackRequest,
    feedbackByUserId?: string | null,
  ): Promise<StrategyForecastRunHistoryItemDto> {
    return this.decisionEvaluationService.recordOutcomeFeedback({
      companyId,
      runId,
      feedback,
      feedbackByUserId,
    });
  }

  private validateRequest(request: StrategyForecastRunRequest): void {
    if (!request.seasonId?.trim()) {
      throw new BadRequestException("seasonId is required");
    }
    if (!["company", "farm", "field"].includes(request.scopeLevel)) {
      throw new BadRequestException("scopeLevel is invalid");
    }
    if (![30, 90, 180, 365].includes(request.horizonDays)) {
      throw new BadRequestException("horizonDays is invalid");
    }
    if (request.scopeLevel === "field" && !request.fieldId?.trim()) {
      throw new BadRequestException("fieldId is required for field scope");
    }
    if (!Array.isArray(request.domains) || request.domains.length === 0) {
      throw new BadRequestException("domains must contain at least one domain");
    }
  }

  private validateScenarioRequest(request: StrategyForecastScenarioSaveRequest): void {
    if (!request.name?.trim()) {
      throw new BadRequestException("scenario name is required");
    }
    this.validateRequest({
      scopeLevel: request.scopeLevel,
      seasonId: request.seasonId,
      horizonDays: request.horizonDays,
      farmId: request.farmId,
      fieldId: request.fieldId,
      crop: request.crop,
      domains: request.domains,
    });
  }

  private buildDrivers(input: {
    budgetRemaining: number;
    burnRate: number;
    currentBalance: number;
    diseaseRiskScore: number;
    expectedYield?: number;
    savingPotential: number;
  }): Array<{ name: string; direction: "up" | "down"; strength: number }> {
    const drivers = [
      {
        name: "Остаток бюджета",
        direction: input.budgetRemaining > 0 ? "up" as const : "down" as const,
        strength: this.normalizeDriverStrength(input.budgetRemaining / 500000),
      },
      {
        name: "Burn rate бюджета",
        direction: input.burnRate > 0.7 ? "down" as const : "up" as const,
        strength: this.normalizeDriverStrength(input.burnRate),
      },
      {
        name: "Ликвидность",
        direction: input.currentBalance >= 0 ? "up" as const : "down" as const,
        strength: this.normalizeDriverStrength(Math.abs(input.currentBalance) / 1000000),
      },
      {
        name: "Риск болезней",
        direction: input.diseaseRiskScore > 0.45 ? "down" as const : "up" as const,
        strength: this.normalizeDriverStrength(input.diseaseRiskScore),
      },
    ];
    if (typeof input.expectedYield === "number") {
      drivers.push({
        name: "Прогноз урожайности",
        direction: input.expectedYield >= 35 ? "up" : "down",
        strength: this.normalizeDriverStrength(input.expectedYield / 60),
      });
    }
    if (input.savingPotential > 0) {
      drivers.push({
        name: "Потенциал экономии",
        direction: "up",
        strength: this.normalizeDriverStrength(input.savingPotential / 250000),
      });
    }
    return drivers
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);
  }


  private normalizeDriverStrength(value: number): number {
    return Math.max(0.05, Math.min(1, Math.abs(value)));
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private roundMetric(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private toReason(error: unknown): string {
    const message = String((error as Error)?.message ?? error ?? "unknown");
    return message.slice(0, 96);
  }

  private normalizeLeverValues(
    value: StrategyForecastScenarioSaveRequest["leverValues"],
  ): Record<StrategyScenarioLever, string> {
    return STRATEGY_SCENARIO_LEVERS.reduce(
      (acc, lever) => {
        const nextValue = value?.[lever];
        acc[lever] = typeof nextValue === "string" ? nextValue : "";
        return acc;
      },
      {} as Record<StrategyScenarioLever, string>,
    );
  }

  private mapScenarioRow(row: {
    id: string;
    name: string;
    scopeLevel: string;
    seasonId: string;
    horizonDays: number;
    farmId: string | null;
    fieldId: string | null;
    crop: string | null;
    domainsJson: unknown;
    leverValuesJson: unknown;
    createdByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): StrategyForecastScenarioDto {
    const domains = Array.isArray(row.domainsJson)
      ? row.domainsJson.filter((item): item is StrategyForecastDomain =>
        item === "agro" ||
        item === "economics" ||
        item === "finance" ||
        item === "risk")
      : [];
    const leverValues = this.normalizeLeverValues(
      (row.leverValuesJson ?? {}) as StrategyForecastScenarioSaveRequest["leverValues"],
    );

    return {
      id: row.id,
      name: row.name,
      scopeLevel: row.scopeLevel as StrategyForecastScopeLevel,
      seasonId: row.seasonId,
      horizonDays: row.horizonDays as 30 | 90 | 180 | 365,
      farmId: row.farmId ?? "",
      fieldId: row.fieldId ?? "",
      crop: row.crop ?? "",
      domains,
      leverValues,
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
