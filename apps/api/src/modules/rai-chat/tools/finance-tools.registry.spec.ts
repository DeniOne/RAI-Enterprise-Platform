import { BadRequestException } from "@nestjs/common";
import { FinanceToolsRegistry } from "./finance-tools.registry";
import { RaiToolName } from "./rai-tools.types";

describe("FinanceToolsRegistry", () => {
  const actorContext = { companyId: "company-1", traceId: "trace-1" };
  const kpiMock = { calculatePlanKPI: jest.fn() };
  const prismaMock = {
    harvestPlan: { findFirst: jest.fn() },
  };

  const createRegistry = () => {
    const r = new FinanceToolsRegistry(kpiMock as any, prismaMock as any);
    r.onModuleInit();
    return r;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has compute_plan_fact, simulate_scenario, compute_risk_assessment", () => {
    const r = createRegistry();
    expect(r.has(RaiToolName.ComputePlanFact)).toBe(true);
    expect(r.has(RaiToolName.SimulateScenario)).toBe(true);
    expect(r.has(RaiToolName.ComputeRiskAssessment)).toBe(true);
    expect(r.has(RaiToolName.EchoMessage)).toBe(false);
  });

  it("compute_plan_fact returns plan KPI when plan exists", async () => {
    prismaMock.harvestPlan.findFirst
      .mockResolvedValueOnce({ id: "plan-1", status: "ACTIVE", seasonId: "s1", companyId: "company-1" })
      .mockResolvedValueOnce({ id: "plan-1", status: "ACTIVE", seasonId: "s1", companyId: "company-1" });
    kpiMock.calculatePlanKPI.mockResolvedValue({
      hasData: true,
      roi: 10,
      ebitda: 100,
      revenue: 200,
      totalActualCost: 80,
      totalPlannedCost: 90,
    });
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.ComputePlanFact,
      { scope: { planId: "plan-1" } },
      actorContext,
    );
    expect(result).toMatchObject({ planId: "plan-1", status: "ACTIVE", roi: 10 });
  });

  it("simulate_scenario stub returns stub result", async () => {
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.SimulateScenario,
      {},
      actorContext,
    );
    expect(result).toEqual({
      scenarioId: "stub-scenario",
      roi: 0,
      ebitda: 0,
      source: "stub",
    });
  });

  it("compute_risk_assessment stub returns stub result", async () => {
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.ComputeRiskAssessment,
      {},
      actorContext,
    );
    expect(result).toMatchObject({
      planId: "stub-plan",
      riskLevel: "LOW",
      source: "stub",
    });
  });

  it("compute_plan_fact throws when no plan in tenant", async () => {
    prismaMock.harvestPlan.findFirst.mockReset();
    prismaMock.harvestPlan.findFirst.mockResolvedValueOnce(null);
    const r = createRegistry();
    await expect(
      r.execute(RaiToolName.ComputePlanFact, { scope: { planId: "missing" } }, actorContext),
    ).rejects.toThrow(BadRequestException);
  });
});
