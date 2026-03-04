import { BadRequestException, Logger } from "@nestjs/common";
import * as Joi from "joi";
import { RaiToolsRegistry } from "./rai-tools.registry";
import { AgroToolsRegistry } from "./agro-tools.registry";
import { FinanceToolsRegistry } from "./finance-tools.registry";
import { RiskToolsRegistry } from "./risk-tools.registry";
import { KnowledgeToolsRegistry } from "./knowledge-tools.registry";
import { RaiToolName } from "./rai-tools.types";

describe("RaiToolsRegistry", () => {
  const actorContext = {
    companyId: "company-1",
    traceId: "trace-1",
  };
  const techMapServiceMock = {
    createDraftStub: jest.fn(),
  };
  const deviationServiceMock = {
    getActiveDeviations: jest.fn().mockResolvedValue([]),
  };
  const kpiServiceMock = {
    calculatePlanKPI: jest.fn(),
  };
  const prismaMock = {
    harvestPlan: { findFirst: jest.fn() },
    agroEscalation: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const agroToolsRegistry = new AgroToolsRegistry(
    deviationServiceMock as any,
    techMapServiceMock as any,
  );
  agroToolsRegistry.onModuleInit();
  const memoryAdapterMock = { getProfile: jest.fn().mockResolvedValue({}) };
  const financeToolsRegistry = new FinanceToolsRegistry(
    kpiServiceMock as any,
    prismaMock as any,
  );
  financeToolsRegistry.onModuleInit();
  const riskToolsRegistry = new RiskToolsRegistry(prismaMock as any);
  riskToolsRegistry.onModuleInit();
  const knowledgeToolsRegistry = new KnowledgeToolsRegistry(
    memoryAdapterMock as any,
  );
  knowledgeToolsRegistry.onModuleInit();

  const createRegistry = () =>
    new RaiToolsRegistry(
      techMapServiceMock as any,
      deviationServiceMock as any,
      agroToolsRegistry,
      financeToolsRegistry,
      riskToolsRegistry,
      knowledgeToolsRegistry,
    );

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("executes a registered tool with a valid payload", async () => {
    const registry = createRegistry();
    registry.onModuleInit();

    const result = await registry.execute(
      RaiToolName.EchoMessage,
      { message: "hello" },
      actorContext,
    );

    expect(result).toEqual({
      echoedMessage: "hello",
      companyId: "company-1",
    });
  });

  it("rejects invalid payload and does not execute the handler", async () => {
    const registry = createRegistry();
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);

    const handler = jest.fn().mockResolvedValue({
      echoedMessage: "x",
      companyId: "company-1",
    });

    registry.register(
      RaiToolName.EchoMessage,
      Joi.object({
        message: Joi.string().required(),
      }),
      handler,
    );

    await expect(
      registry.execute(RaiToolName.EchoMessage, { wrong: true }, actorContext),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(handler).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"payload":{"wrong":true}'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"validation_failed"'),
    );
  });

  it("logs every successful tool call", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    const logSpy = jest
      .spyOn(Logger.prototype, "log")
      .mockImplementation(() => undefined);

    await registry.execute(
      RaiToolName.WorkspaceSnapshot,
      { route: "/tasks", lastUserAction: "open-task" },
      actorContext,
    );

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"toolName":"workspace_snapshot"'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"status":"success"'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"payload":{"route":"/tasks","lastUserAction":"open-task"}'),
    );
  });

  it("logs payload when handler execution fails", async () => {
    const registry = createRegistry();
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);

    registry.register(
      RaiToolName.EchoMessage,
      Joi.object({
        message: Joi.string().required(),
      }),
      async () => {
        throw new Error("boom");
      },
    );

    await expect(
      registry.execute(
        RaiToolName.EchoMessage,
        { message: "hello" },
        actorContext,
      ),
    ).rejects.toThrow("boom");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"payload":{"message":"hello"}'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"handler_failed"'),
    );
  });

  it("routes generate tech map draft through TechMapService with scoped companyId", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    techMapServiceMock.createDraftStub.mockResolvedValueOnce({
      draftId: "tm-1",
      status: "DRAFT",
      fieldRef: "field-1",
      seasonRef: "season-1",
      crop: "rapeseed",
      missingMust: ["stages"],
      tasks: [],
      assumptions: [],
    });

    const result = await registry.execute(
      RaiToolName.GenerateTechMapDraft,
      {
        fieldRef: "field-1",
        seasonRef: "season-1",
        crop: "rapeseed",
      },
      actorContext,
    );

    expect(techMapServiceMock.createDraftStub).toHaveBeenCalledWith({
      fieldRef: "field-1",
      seasonRef: "season-1",
      crop: "rapeseed",
      companyId: "company-1",
    });
    expect(result).toEqual(
      expect.objectContaining({
        draftId: "tm-1",
        status: "DRAFT",
      }),
    );
  });

  it("computes plan fact within tenant scope", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    prismaMock.harvestPlan.findFirst.mockResolvedValueOnce({
      id: "plan-1",
      status: "ACTIVE",
      seasonId: "season-1",
      companyId: "company-1",
    });
    kpiServiceMock.calculatePlanKPI.mockResolvedValueOnce({
      hasData: true,
      roi: 12.3,
      ebitda: 1000,
      revenue: 2000,
      totalActualCost: 900,
      totalPlannedCost: 950,
    });

    const result = await registry.execute(
      RaiToolName.ComputePlanFact,
      { scope: { planId: "plan-1" } },
      actorContext,
    );

    expect(kpiServiceMock.calculatePlanKPI).toHaveBeenCalledWith(
      "plan-1",
      expect.objectContaining({ companyId: "company-1" }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        planId: "plan-1",
        status: "ACTIVE",
        roi: 12.3,
      }),
    );
  });

  it("filters deviations by season and field within tenant scope", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    deviationServiceMock.getActiveDeviations.mockResolvedValueOnce([
      {
        id: "dev-1",
        status: "OPEN",
        harvestPlanId: "plan-1",
        budgetPlanId: "budget-1",
        harvestPlan: {
          seasonId: "season-1",
          techMaps: [{ fieldId: "field-1" }],
        },
      },
      {
        id: "dev-2",
        status: "OPEN",
        harvestPlanId: "plan-2",
        budgetPlanId: null,
        harvestPlan: {
          seasonId: "season-2",
          techMaps: [{ fieldId: "field-2" }],
        },
      },
    ]);

    const result = await registry.execute(
      RaiToolName.ComputeDeviations,
      { scope: { seasonId: "season-1", fieldId: "field-1" } },
      actorContext,
    );

    expect(deviationServiceMock.getActiveDeviations).toHaveBeenCalledWith({
      companyId: "company-1",
    });
    expect(result).toEqual({
      count: 1,
      seasonId: "season-1",
      fieldId: "field-1",
      items: [
        {
          id: "dev-1",
          status: "OPEN",
          harvestPlanId: "plan-1",
          budgetPlanId: "budget-1",
        },
      ],
    });
  });

  it("returns open alerts with severity filter in tenant scope", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    prismaMock.agroEscalation.findMany.mockResolvedValueOnce([
      {
        id: "esc-1",
        severity: "S4",
        reason: "critical deviation",
        status: "OPEN",
        references: { fieldRef: "field-1" },
      },
    ]);

    const result = await registry.execute(
      RaiToolName.EmitAlerts,
      { severity: "S4" },
      actorContext,
    );

    expect(prismaMock.agroEscalation.findMany).toHaveBeenCalledWith({
      where: {
        companyId: "company-1",
        status: "OPEN",
        severity: { in: ["S4"] },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
    expect(result).toEqual({
      count: 1,
      severity: "S4",
      items: [
        {
          id: "esc-1",
          severity: "S4",
          reason: "critical deviation",
          status: "OPEN",
          references: { fieldRef: "field-1" },
        },
      ],
    });
  });
});
