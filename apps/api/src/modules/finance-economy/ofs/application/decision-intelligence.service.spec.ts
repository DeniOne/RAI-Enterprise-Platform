import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DecisionIntelligenceService } from "./decision-intelligence.service";
import { PrismaService } from "../../../../shared/prisma/prisma.service";
import { FinanceService } from "../../finance/application/finance.service";
import { BudgetService } from "../../finance/application/budget.service";
import { LiquidityForecastService } from "../../finance/application/liquidity-forecast.service";
import { DataScientistService } from "../../../rai-chat/expert/data-scientist.service";
import { ForecastAssemblerService } from "./forecast-assembler.service";
import { ScenarioEngineService } from "./scenario-engine.service";
import { RiskComposerService } from "./risk-composer.service";
import { DecisionRecommendationComposerService } from "./decision-recommendation-composer.service";
import { StrategyForecastOptimizationService } from "./strategy-forecast-optimization.service";
import { DecisionEvaluationService } from "./decision-evaluation.service";

describe("DecisionIntelligenceService", () => {
  let service: DecisionIntelligenceService;

  const mockSeasonFindFirst = jest.fn();
  const mockScenarioFindMany = jest.fn();
  const mockScenarioCreate = jest.fn();
  const mockScenarioDeleteMany = jest.fn();
  const mockGetCashAccounts = jest.fn();
  const mockGetStats = jest.fn();
  const mockGetForecast = jest.fn();
  const mockAnalyzeCosts = jest.fn();
  const mockPredictYield = jest.fn();
  const mockAssessDiseaseRisk = jest.fn();
  const mockRecordRun = jest.fn();
  const mockListRecentRuns = jest.fn();
  const mockRecordOutcomeFeedback = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionIntelligenceService,
        ForecastAssemblerService,
        ScenarioEngineService,
        RiskComposerService,
        DecisionRecommendationComposerService,
        StrategyForecastOptimizationService,
        {
          provide: PrismaService,
          useValue: {
            season: {
              findFirst: mockSeasonFindFirst,
            },
            strategyForecastScenario: {
              findMany: mockScenarioFindMany,
              create: mockScenarioCreate,
              deleteMany: mockScenarioDeleteMany,
            },
          },
        },
        {
          provide: FinanceService,
          useValue: {
            getCashAccounts: mockGetCashAccounts,
          },
        },
        {
          provide: BudgetService,
          useValue: {
            getStats: mockGetStats,
          },
        },
        {
          provide: LiquidityForecastService,
          useValue: {
            getForecast: mockGetForecast,
          },
        },
        {
          provide: DataScientistService,
          useValue: {
            analyzeCosts: mockAnalyzeCosts,
            predictYield: mockPredictYield,
            assessDiseaseRisk: mockAssessDiseaseRisk,
          },
        },
        {
          provide: DecisionEvaluationService,
          useValue: {
            recordRun: mockRecordRun,
            listRecentRuns: mockListRecentRuns,
            recordOutcomeFeedback: mockRecordOutcomeFeedback,
          },
        },
      ],
    }).compile();

    service = module.get(DecisionIntelligenceService);
  });

  it("requires fieldId for field scope", async () => {
    await expect(
      service.runStrategyForecast("company-1", {
        scopeLevel: "field",
        seasonId: "season-1",
        horizonDays: 90,
        domains: ["finance"],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("returns degraded response when one of the deterministic inputs is unavailable", async () => {
    mockGetForecast.mockRejectedValue(new Error("liquidity down"));
    mockGetStats.mockResolvedValue({
      totalLimit: 1000000,
      totalConsumed: 300000,
      totalRemaining: 700000,
      burnRate: 0.35,
    });
    mockGetCashAccounts.mockResolvedValue([{ balance: 250000 }]);
    mockSeasonFindFirst.mockResolvedValue({
      id: "season-1",
      year: 2026,
      fieldId: "field-1",
      expectedYield: 4.2,
      actualYield: null,
    });
    mockAnalyzeCosts.mockResolvedValue({
      totalCostPerHa: 21000,
      optimizations: [{ savingPotential: 40000 }],
    });
    mockPredictYield.mockResolvedValue({ predictedYield: 4.8 });
    mockAssessDiseaseRisk.mockResolvedValue({ overallRisk: 0.22 });

    const result = await service.runStrategyForecast("company-1", {
      scopeLevel: "company",
      seasonId: "season-1",
      horizonDays: 90,
      fieldId: "field-1",
      crop: "rapeseed",
      domains: ["agro", "economics", "finance", "risk"],
    });

    expect(result.degraded).toBe(true);
    expect(result.degradationReasons).toEqual(
      expect.arrayContaining([expect.stringContaining("liquidity_forecast_unavailable")]),
    );
    expect(result.lineage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "finance.liquidity_forecast",
          status: "degraded",
        }),
      ]),
    );
    expect(result.baseline.revenue).toBeGreaterThan(0);
    expect(result.range.revenue.p50).toBe(result.baseline.revenue);
    expect(result.optimizationPreview.objective).toContain("cash flow");
    expect(result.optimizationPreview.recommendations.length).toBeGreaterThan(0);
    expect(mockRecordRun).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        result: expect.objectContaining({
          traceId: expect.stringMatching(/^di_/),
        }),
      }),
    );
  });

  it("saves and lists persisted forecast scenarios", async () => {
    mockScenarioCreate.mockResolvedValue({
      id: "scn-1",
      name: "Рост цены",
      scopeLevel: "company",
      seasonId: "season-1",
      horizonDays: 90,
      farmId: null,
      fieldId: "",
      crop: "rapeseed",
      domainsJson: ["finance", "economics"],
      leverValuesJson: {
        sales_price_pct: "12",
        opex_pct: "-4",
      },
      createdByUserId: "user-1",
      createdAt: new Date("2026-03-12T10:00:00.000Z"),
      updatedAt: new Date("2026-03-12T10:00:00.000Z"),
    });
    mockScenarioFindMany.mockResolvedValue([
      {
        id: "scn-1",
        name: "Рост цены",
        scopeLevel: "company",
        seasonId: "season-1",
        horizonDays: 90,
        farmId: null,
        fieldId: "",
        crop: "rapeseed",
        domainsJson: ["finance", "economics"],
        leverValuesJson: {
          sales_price_pct: "12",
          opex_pct: "-4",
        },
        createdByUserId: "user-1",
        createdAt: new Date("2026-03-12T10:00:00.000Z"),
        updatedAt: new Date("2026-03-12T10:00:00.000Z"),
      },
    ]);

    const saved = await service.saveScenario("company-1", "user-1", {
      name: "Рост цены",
      scopeLevel: "company",
      seasonId: "season-1",
      horizonDays: 90,
      crop: "rapeseed",
      domains: ["finance", "economics"],
      leverValues: {
        sales_price_pct: "12",
        opex_pct: "-4",
      },
    });

    expect(saved.name).toBe("Рост цены");
    expect(saved.domains).toEqual(["finance", "economics"]);
    expect(saved.leverValues.sales_price_pct).toBe("12");

    const list = await service.listSavedScenarios("company-1");
    expect(list).toHaveLength(1);
    expect(mockScenarioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: "company-1" },
      }),
    );
  });

  it("returns recent forecast run history", async () => {
    mockListRecentRuns.mockResolvedValue([
      {
        id: "run-1",
        traceId: "di_1",
        scopeLevel: "company",
        seasonId: "season-1",
        horizonDays: 90,
        domains: ["finance"],
        degraded: false,
        riskTier: "medium",
        recommendedAction: "Сохранять базовый план",
        scenarioName: null,
        createdAt: "2026-03-12T10:00:00.000Z",
        evaluation: {
          status: "pending",
        },
      },
    ]);

    const history = await service.listRecentRuns("company-1", 5);
    expect(history).toHaveLength(1);
    expect(mockListRecentRuns).toHaveBeenCalledWith("company-1", 5);
  });

  it("records realized outcome feedback", async () => {
    mockRecordOutcomeFeedback.mockResolvedValue({
      id: "run-1",
      traceId: "di_1",
      scopeLevel: "company",
      seasonId: "season-1",
      horizonDays: 90,
      domains: ["finance"],
      degraded: false,
      riskTier: "medium",
      recommendedAction: "Сохранять базовый план",
      scenarioName: null,
      createdAt: "2026-03-12T10:00:00.000Z",
      evaluation: {
        status: "feedback_recorded",
        revenueErrorPct: 3.4,
      },
    });

    const item = await service.recordOutcomeFeedback(
      "company-1",
      "run-1",
      { actualRevenue: 103400 },
      "user-1",
    );

    expect(item.evaluation.status).toBe("feedback_recorded");
    expect(mockRecordOutcomeFeedback).toHaveBeenCalledWith({
      companyId: "company-1",
      runId: "run-1",
      feedback: { actualRevenue: 103400 },
      feedbackByUserId: "user-1",
    });
  });
});
