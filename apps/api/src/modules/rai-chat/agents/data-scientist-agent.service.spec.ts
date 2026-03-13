import { DataScientistAgent } from "./data-scientist-agent.service";
import { DataScientistService } from "../expert/data-scientist.service";
import { DecisionIntelligenceService } from "../../finance-economy/ofs/application/decision-intelligence.service";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";

describe("DataScientistAgent", () => {
  const dsServiceMock = {
    predictYield: jest.fn(),
    assessDiseaseRisk: jest.fn(),
    analyzeCosts: jest.fn(),
    generateSeasonalReport: jest.fn(),
    minePatterns: jest.fn(),
    whatIf: jest.fn(),
  };
  const decisionIntelligenceMock = {
    runStrategyForecast: jest.fn(),
  };

  let agent: DataScientistAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new DataScientistAgent(
      dsServiceMock as unknown as DataScientistService,
      decisionIntelligenceMock as unknown as DecisionIntelligenceService,
      {
        generate: jest.fn().mockRejectedValue(new Error("OPENROUTER_API_KEY_MISSING")),
      } as unknown as OpenRouterGatewayService,
      { buildMessages: jest.fn().mockReturnValue([]) } as unknown as AgentPromptAssemblyService,
    );
  });

  it("strategy_forecast без seasonId возвращает NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-1",
      intent: "strategy_forecast",
    });

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.data).toEqual({ missingFields: ["seasonId"] });
    expect(decisionIntelligenceMock.runStrategyForecast).not.toHaveBeenCalled();
  });

  it("strategy_forecast использует deterministic DecisionIntelligenceService с дефолтами", async () => {
    decisionIntelligenceMock.runStrategyForecast.mockResolvedValue({
      traceId: "di_trace_1",
      degraded: false,
      degradationReasons: [],
      lineage: [{ source: "finance", status: "ok", detail: "ok" }],
      baseline: {
        revenue: 1500000,
        margin: 320000,
        cashFlow: 210000,
        riskScore: 37.4,
      },
      range: {
        revenue: { p10: 1300000, p50: 1500000, p90: 1700000 },
        margin: { p10: 250000, p50: 320000, p90: 390000 },
        cashFlow: { p10: 150000, p50: 210000, p90: 270000 },
      },
      drivers: [{ name: "Liquidity", direction: "up", strength: 0.72 }],
      recommendedAction: "Сохранять базовый план и мониторить риск.",
      tradeoff: "Стабильный cash flow при умеренном росте маржи.",
      limitations: ["MVP deterministic range only"],
      evidence: ["finance_service", "budget_service"],
      riskTier: "medium",
      optimizationPreview: {
        objective: "maximize margin",
        planningHorizon: "90d",
        constraints: [],
        recommendations: [],
      },
    });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-1",
      intent: "strategy_forecast",
      seasonId: "season-2026",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toContain("Decision Intelligence");
    expect(result.evidence[0].sourceId).toBe("decision_intelligence_strategy_forecast");
    expect(decisionIntelligenceMock.runStrategyForecast).toHaveBeenCalledWith(
      "company-1",
      {
        scopeLevel: "company",
        seasonId: "season-2026",
        horizonDays: 90,
        domains: ["agro", "economics", "finance", "risk"],
      },
      null,
    );
  });

  it("strategy_forecast field scope без fieldId возвращает NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-2",
      intent: "strategy_forecast",
      seasonId: "season-2026",
      scopeLevel: "field",
    });

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.data).toEqual({ missingFields: ["fieldId"] });
    expect(decisionIntelligenceMock.runStrategyForecast).not.toHaveBeenCalled();
  });
});
