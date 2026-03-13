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
import {
  buildStrategyForecastDrivers,
  mapStrategyForecastScenarioRow,
  normalizeScenarioLeverValues,
  roundForecastMetric,
  toDecisionReason,
  validateStrategyForecastRunRequest,
  validateStrategyForecastScenarioSaveRequest,
} from "../../../../shared/finance-economy/decision-intelligence.helpers";
import { InvariantMetrics } from "../../../../shared/invariants/invariant-metrics";
import type {
  StrategyForecastDomain,
  StrategyForecastRunFeedbackRequest,
  StrategyForecastRunHistoryItemDto,
  StrategyForecastRunHistoryQueryDto,
  StrategyForecastRunHistoryResponseDto,
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
  StrategyForecastScenarioDto,
  StrategyForecastScenarioSaveRequest,
  StrategyForecastScopeLevel,
} from "../../../../shared/finance-economy/decision-intelligence.types";
export type {
  StrategyForecastDomain,
  StrategyForecastRunFeedbackRequest,
  StrategyForecastRunHistoryItemDto,
  StrategyForecastRunHistoryQueryDto,
  StrategyForecastRunHistoryResponseDto,
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
  StrategyForecastScenarioDto,
  StrategyForecastScenarioSaveRequest,
  StrategyForecastScopeLevel,
  StrategyScenarioLever,
} from "../../../../shared/finance-economy/decision-intelligence.types";

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
    const startedAtMs = Date.now();
    validateStrategyForecastRunRequest(request);
    InvariantMetrics.increment("strategy_forecast_run_total");
    try {

      const degradationReasons: string[] = [];
      const traceId = `di_${randomUUID()}`;

      const [liquidity, budgetStats, cashAccounts, season, costAnalysis, yieldPrediction, diseaseRisk] =
        await Promise.all([
        this.liquidityForecastService
          .getForecast(companyId, request.horizonDays)
          .catch((error) => {
            degradationReasons.push(`liquidity_forecast_unavailable:${toDecisionReason(error)}`);
            return null;
          }),
        this.budgetService.getStats(companyId).catch((error) => {
          degradationReasons.push(`budget_stats_unavailable:${toDecisionReason(error)}`);
          return null;
        }),
        this.financeService.getCashAccounts(companyId).catch((error) => {
          degradationReasons.push(`cash_accounts_unavailable:${toDecisionReason(error)}`);
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
          degradationReasons.push(`season_lookup_unavailable:${toDecisionReason(error)}`);
          return null;
        }),
        request.domains.includes("economics") || request.domains.includes("finance")
          ? this.dataScientistService.analyzeCosts(companyId, request.seasonId).catch((error) => {
            degradationReasons.push(`cost_analysis_unavailable:${toDecisionReason(error)}`);
            return null;
          })
          : Promise.resolve(null),
        request.fieldId && request.crop && request.domains.includes("agro")
          ? this.dataScientistService.predictYield(companyId, request.fieldId, request.crop, request.seasonId).catch((error) => {
            degradationReasons.push(`yield_prediction_unavailable:${toDecisionReason(error)}`);
            return null;
          })
          : Promise.resolve(null),
        request.fieldId && request.crop && request.domains.includes("risk")
          ? this.dataScientistService.assessDiseaseRisk(companyId, request.fieldId, request.crop).catch((error) => {
            degradationReasons.push(`disease_risk_unavailable:${toDecisionReason(error)}`);
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
      ...(expectedYield !== undefined
        ? { yield: roundForecastMetric(expectedYield) }
        : {}),
      riskScore: roundForecastMetric(baselineRiskScore),
    };
      const range = assembled.range;
      const scenarioDelta = request.scenario
        ? this.scenarioEngine.applyScenarioDelta(baseline, request.scenario.adjustments)
        : undefined;

      const drivers = buildStrategyForecastDrivers({
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

      if (response.degraded) {
        InvariantMetrics.increment("strategy_forecast_degraded_total");
      }
      return response;
    } finally {
      InvariantMetrics.setGauge(
        "strategy_forecast_latency_ms",
        Date.now() - startedAtMs,
      );
    }
  }

  async listSavedScenarios(companyId: string): Promise<StrategyForecastScenarioDto[]> {
    const rows = await this.prisma.strategyForecastScenario.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return rows.map((row) => mapStrategyForecastScenarioRow(row));
  }

  async saveScenario(
    companyId: string,
    createdByUserId: string | null | undefined,
    request: StrategyForecastScenarioSaveRequest,
  ): Promise<StrategyForecastScenarioDto> {
    validateStrategyForecastScenarioSaveRequest(request);

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
        leverValuesJson: normalizeScenarioLeverValues(
          request.leverValues,
        ) as unknown as Prisma.InputJsonValue,
        createdByUserId: createdByUserId ?? null,
      },
    });

    return mapStrategyForecastScenarioRow(saved);
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
    query: StrategyForecastRunHistoryQueryDto = {},
  ): Promise<StrategyForecastRunHistoryResponseDto> {
    return this.decisionEvaluationService.listRecentRuns(companyId, query);
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

}
