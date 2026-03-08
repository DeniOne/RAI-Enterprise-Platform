import { EconomistAgent } from "./economist-agent.service";
import { FinanceToolsRegistry } from "../tools/finance-tools.registry";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";

describe("EconomistAgent", () => {
  const financeRegistryMock = {
    execute: jest.fn().mockResolvedValue({
      planId: "p1",
      status: "ACTIVE",
      roi: 0.12,
      ebitda: 1000,
      revenue: 5000,
      totalActualCost: 3500,
      totalPlannedCost: 4000,
      hasData: true,
    }),
  };

  let agent: EconomistAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new EconomistAgent(
      financeRegistryMock as unknown as FinanceToolsRegistry,
      { generate: jest.fn().mockRejectedValue(new Error("OPENROUTER_API_KEY_MISSING")) } as unknown as OpenRouterGatewayService,
      { buildMessages: jest.fn().mockReturnValue([]) } as unknown as AgentPromptAssemblyService,
    );
  });

  it("compute_plan_fact вызывает FinanceToolsRegistry и возвращает COMPLETED с explain по данным", async () => {
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "compute_plan_fact",
      scope: { seasonId: "s1" },
    });
    expect(result.agentName).toBe("EconomistAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toMatch(/ROI|План|EBITDA|выручка|затрат/i);
    expect(result.explain).toContain("12"); // roi 0.12 -> 12%
    expect(result.toolCallsCount).toBe(1);
    expect(result.evidence).toBeDefined();
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.missingContext).toEqual([]);
    expect(financeRegistryMock.execute).toHaveBeenCalledWith(
      expect.any(String),
      { scope: { seasonId: "s1" } },
      { companyId: "c1", traceId: "tr1" },
    );
  });

  it("simulate_scenario возвращает explain по данным сценария", async () => {
    financeRegistryMock.execute.mockResolvedValueOnce({
      scenarioId: "sc1",
      roi: 0.15,
      ebitda: 2000,
      source: "stub",
    });
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "simulate_scenario",
      scope: { planId: "p1" },
    });
    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toMatch(/Сценарий sc1|15%|2[\s\u00A0]*000/);
  });

  it("compute_risk_assessment возвращает explain с уровнем риска", async () => {
    financeRegistryMock.execute.mockResolvedValueOnce({
      planId: "p1",
      riskLevel: "MEDIUM",
      factors: ["погода", "цены"],
      source: "stub",
    });
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "compute_risk_assessment",
    });
    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toContain("MEDIUM");
    expect(result.explain).toMatch(/погода|цены/);
  });

  it("при ошибке registry возвращает FAILED", async () => {
    financeRegistryMock.execute.mockRejectedValueOnce(new Error("No plan"));
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "simulate_scenario",
    });
    expect(result.status).toBe("FAILED");
    expect(result.explain).toBe("No plan");
    expect(result.evidence).toEqual([]);
    expect(result.missingContext).toEqual([]);
  });

  it("compute_plan_fact без planId и seasonId возвращает NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "compute_plan_fact",
    });

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.missingContext).toEqual(["seasonId"]);
    expect(result.toolCallsCount).toBe(0);
    expect(financeRegistryMock.execute).not.toHaveBeenCalled();
  });
});
