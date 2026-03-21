import { BadRequestException, Logger } from "@nestjs/common";
import * as Joi from "joi";
import { RaiToolsRegistry } from "./rai-tools.registry";
import { AgroToolsRegistry } from "./agro-tools.registry";
import { FinanceToolsRegistry } from "./finance-tools.registry";
import { RiskToolsRegistry } from "./risk-tools.registry";
import { KnowledgeToolsRegistry } from "./knowledge-tools.registry";
import { CrmToolsRegistry } from "./crm-tools.registry";
import { FrontOfficeToolsRegistry } from "./front-office-tools.registry";
import { ContractsToolsRegistry } from "./contracts-tools.registry";
import { RaiToolName } from "./rai-tools.types";
import { RiskPolicyEngineService } from "../security/risk-policy-engine.service";
import { PendingActionService } from "../security/pending-action.service";
import { RiskPolicyBlockedError } from "../../../shared/rai-chat/security/risk-policy-blocked.error";
import {
  AutonomyLevel,
  AutonomyPolicyService,
} from "../autonomy-policy.service";
import { AgentRuntimeConfigService } from "../agent-runtime-config.service";
import { AgentConfigBlockedError } from "../../../shared/rai-chat/security/agent-config-blocked.error";
import { IncidentOpsService } from "../incident-ops.service";
import { SystemIncidentType } from "@rai/prisma-client";
import { RuntimeGovernanceEventService } from "../runtime-governance/runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "../runtime-governance/runtime-governance-policy.service";
import { RuntimeGovernanceFeatureFlagsService } from "../runtime-governance/runtime-governance-feature-flags.service";

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
  const pendingActionCreateMock = jest.fn().mockResolvedValue({ id: "pa-1" });
  const prismaMock = {
    harvestPlan: { findFirst: jest.fn() },
    agroEscalation: { findMany: jest.fn().mockResolvedValue([]) },
    pendingAction: { create: pendingActionCreateMock },
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
  const crmToolsRegistry = {
    has: jest.fn((name: RaiToolName) =>
      [
        RaiToolName.LookupCounterpartyByInn,
        RaiToolName.RegisterCounterparty,
        RaiToolName.CreateCounterpartyRelation,
        RaiToolName.CreateCrmAccount,
        RaiToolName.GetCrmAccountWorkspace,
        RaiToolName.UpdateCrmAccount,
        RaiToolName.CreateCrmContact,
        RaiToolName.UpdateCrmContact,
        RaiToolName.DeleteCrmContact,
        RaiToolName.CreateCrmInteraction,
        RaiToolName.UpdateCrmInteraction,
        RaiToolName.DeleteCrmInteraction,
        RaiToolName.CreateCrmObligation,
        RaiToolName.UpdateCrmObligation,
        RaiToolName.DeleteCrmObligation,
      ].includes(name),
    ),
    execute: jest.fn(),
  } as unknown as CrmToolsRegistry;
  const frontOfficeToolsRegistry = {
    has: jest.fn((name: RaiToolName) =>
      [
        RaiToolName.LogDialogMessage,
        RaiToolName.ClassifyDialogThread,
        RaiToolName.CreateFrontOfficeEscalation,
      ].includes(name),
    ),
    execute: jest.fn(),
  } as unknown as FrontOfficeToolsRegistry;
  const contractsToolsRegistry = {
    has: jest.fn((name: RaiToolName) =>
      [
        RaiToolName.CreateCommerceContract,
        RaiToolName.ListCommerceContracts,
        RaiToolName.GetCommerceContract,
        RaiToolName.CreateCommerceObligation,
        RaiToolName.CreateFulfillmentEvent,
        RaiToolName.ListFulfillmentEvents,
        RaiToolName.CreateInvoiceFromFulfillment,
        RaiToolName.PostInvoice,
        RaiToolName.ListInvoices,
        RaiToolName.CreatePayment,
        RaiToolName.ConfirmPayment,
        RaiToolName.AllocatePayment,
        RaiToolName.GetArBalance,
      ].includes(name),
    ),
    execute: jest.fn(),
  } as unknown as ContractsToolsRegistry;

  const riskPolicyEngine = new RiskPolicyEngineService();
  const pendingActionService = new PendingActionService(prismaMock as any);
  const autonomyPolicy = {
    getCompanyAutonomyLevel: jest
      .fn()
      .mockResolvedValue(AutonomyLevel.AUTONOMOUS),
  } as unknown as AutonomyPolicyService;
  const agentRuntimeConfig = {
    resolveToolAccess: jest.fn().mockResolvedValue({ allowed: true }),
  } as unknown as AgentRuntimeConfigService;
  const incidentOps = {
    logIncident: jest.fn(),
  } as unknown as IncidentOpsService;
  const governanceEvents = {
    record: jest.fn().mockResolvedValue(undefined),
  } as unknown as RuntimeGovernanceEventService;
  const runtimeGovernancePolicy = {
    resolveFallbackMode: jest.fn().mockReturnValue("MANUAL_HUMAN_REQUIRED"),
  } as unknown as RuntimeGovernancePolicyService;
  const runtimeGovernanceFlags = {
    getFlags: jest.fn().mockReturnValue({
      apiEnabled: true,
      uiEnabled: true,
      enforcementEnabled: true,
      autoQuarantineEnabled: true,
    }),
  } as unknown as RuntimeGovernanceFeatureFlagsService;

  const createRegistry = () =>
    new RaiToolsRegistry(
      techMapServiceMock as any,
      deviationServiceMock as any,
      agroToolsRegistry,
      financeToolsRegistry,
      riskToolsRegistry,
      knowledgeToolsRegistry,
      crmToolsRegistry,
      frontOfficeToolsRegistry,
      contractsToolsRegistry,
      riskPolicyEngine,
      pendingActionService,
      autonomyPolicy,
      agentRuntimeConfig,
      incidentOps,
      governanceEvents,
      runtimeGovernancePolicy,
      runtimeGovernanceFlags,
    );

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    (agentRuntimeConfig.resolveToolAccess as jest.Mock).mockResolvedValue({ allowed: true });
    (autonomyPolicy.getCompanyAutonomyLevel as jest.Mock).mockResolvedValue(
      AutonomyLevel.AUTONOMOUS,
    );
    (crmToolsRegistry.execute as jest.Mock).mockReset();
    (frontOfficeToolsRegistry.execute as jest.Mock).mockReset();
    (contractsToolsRegistry.execute as jest.Mock).mockReset();
    (runtimeGovernanceFlags.getFlags as jest.Mock).mockReturnValue({
      apiEnabled: true,
      uiEnabled: true,
      enforcementEnabled: true,
      autoQuarantineEnabled: true,
    });
  });

  it("QUARANTINE создаёт autonomy incident", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (autonomyPolicy.getCompanyAutonomyLevel as jest.Mock).mockResolvedValueOnce(
      AutonomyLevel.QUARANTINE,
    );

    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      ),
    ).rejects.toBeInstanceOf(RiskPolicyBlockedError);

    expect(incidentOps.logIncident).toHaveBeenCalledWith({
      companyId: "company-1",
      traceId: "trace-1",
      incidentType: SystemIncidentType.AUTONOMY_QUARANTINE,
      severity: "HIGH",
      details: expect.objectContaining({
        toolName: RaiToolName.GenerateTechMapDraft,
      }),
    });
  });

  it("TOOL_FIRST forced PendingAction создаёт autonomy incident", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (autonomyPolicy.getCompanyAutonomyLevel as jest.Mock).mockResolvedValueOnce(
      AutonomyLevel.TOOL_FIRST,
    );
    jest
      .spyOn(pendingActionService, "requiresConfirmation")
      .mockReturnValue(false);
    pendingActionCreateMock.mockResolvedValueOnce({ id: "pa-toolfirst" });

    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      ),
    ).rejects.toBeInstanceOf(RiskPolicyBlockedError);

    expect(incidentOps.logIncident).toHaveBeenCalledWith({
      companyId: "company-1",
      traceId: "trace-1",
      incidentType: SystemIncidentType.AUTONOMY_TOOL_FIRST,
      severity: "MEDIUM",
      details: expect.objectContaining({
        pendingActionId: "pa-toolfirst",
        policySource: "AutonomyPolicy",
      }),
    });
  });

  it("при выключенном enforcement autonomy policy не блокирует write tool", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (runtimeGovernanceFlags.getFlags as jest.Mock).mockReturnValue({
      apiEnabled: true,
      uiEnabled: true,
      enforcementEnabled: false,
      autoQuarantineEnabled: true,
    });
    jest
      .spyOn(riskPolicyEngine, "evaluate")
      .mockReturnValue("ALLOWED" as any);

    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      ),
    ).resolves.toBeUndefined();

    expect(autonomyPolicy.getCompanyAutonomyLevel).not.toHaveBeenCalled();
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

  it("replayMode: WRITE tool returns mock and does not call handler", async () => {
    const registry = createRegistry();
    registry.onModuleInit();

    const result = await registry.execute(
      RaiToolName.GenerateTechMapDraft,
      { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
      { ...actorContext, replayMode: true },
    );

    expect(result).toEqual({ replayed: true, mock: true });
    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
  });

  it("replayMode: READ tool executes normally", async () => {
    const registry = createRegistry();
    registry.onModuleInit();

    const result = await registry.execute(
      RaiToolName.EchoMessage,
      { message: "hello" },
      { ...actorContext, replayMode: true },
    );

    expect(result).toEqual({
      echoedMessage: "hello",
      companyId: "company-1",
    });
  });

  it("WRITE tool GenerateTechMapDraft blocked by RiskPolicy, creates PendingAction", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    pendingActionCreateMock.mockResolvedValueOnce({ id: "pa-123" });

    let err: unknown;
    try {
      await registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      );
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(RiskPolicyBlockedError);
    expect((err as RiskPolicyBlockedError).actionId).toBe("pa-123");
    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
    expect(pendingActionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "company-1",
        traceId: "trace-1",
        toolName: RaiToolName.GenerateTechMapDraft,
        riskLevel: "WRITE",
        status: "PENDING",
      }),
    });
  });

  it("disabled agent blocks tool execution before RiskPolicy/handler", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (agentRuntimeConfig.resolveToolAccess as jest.Mock).mockResolvedValueOnce({
      allowed: false,
      reasonCode: "AGENT_DISABLED",
      role: "agronomist",
      requiredCapability: "AgroToolsRegistry",
    });

    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      ),
    ).rejects.toBeInstanceOf(AgentConfigBlockedError);

    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
    expect(pendingActionCreateMock).not.toHaveBeenCalled();
  });

  it("missing capability blocks tool execution before handler", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (agentRuntimeConfig.resolveToolAccess as jest.Mock).mockResolvedValueOnce({
      allowed: false,
      reasonCode: "CAPABILITY_DENIED",
      role: "knowledge",
      requiredCapability: "KnowledgeToolsRegistry",
    });

    await expect(
      registry.execute(
        RaiToolName.QueryKnowledge,
        { query: "нормы высева" },
        actorContext,
      ),
    ).rejects.toBeInstanceOf(AgentConfigBlockedError);
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

  it("routes contracts tools into ContractsToolsRegistry", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (contractsToolsRegistry.execute as jest.Mock).mockResolvedValue({
      invoiceId: "invoice-1",
      balance: 1200,
    });
    jest
      .spyOn(riskPolicyEngine, "evaluate")
      .mockReturnValue("ALLOWED" as any);

    const result = await registry.execute(
      RaiToolName.GetArBalance,
      { invoiceId: "invoice-1" },
      actorContext,
    );

    expect(result).toEqual({ invoiceId: "invoice-1", balance: 1200 });
    expect(contractsToolsRegistry.execute).toHaveBeenCalledWith(
      RaiToolName.GetArBalance,
      { invoiceId: "invoice-1" },
      actorContext,
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

  it("WRITE tool EmitAlerts blocked by RiskPolicy, creates PendingAction", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    pendingActionCreateMock.mockResolvedValueOnce({ id: "pa-emit" });

    await expect(
      registry.execute(RaiToolName.EmitAlerts, { severity: "S4" }, actorContext),
    ).rejects.toThrow(RiskPolicyBlockedError);

    expect(prismaMock.agroEscalation.findMany).not.toHaveBeenCalled();
    expect(pendingActionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        toolName: RaiToolName.EmitAlerts,
        riskLevel: "WRITE",
      }),
    });
  });

  it("прямой пользовательский CRM WRITE выполняется без PendingAction", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (crmToolsRegistry.execute as jest.Mock).mockResolvedValueOnce({
      created: true,
      source: "DADATA",
      partyId: "party-42",
      legalName: "ООО Ромашка",
      inn: "2610000615",
      jurisdictionCode: "RU",
      lookupStatus: "FOUND",
      alreadyExisted: false,
    });

    const result = await registry.execute(
      RaiToolName.RegisterCounterparty,
      { inn: "2610000615", jurisdictionCode: "RU" },
      {
        ...actorContext,
        userId: "user-1",
        userConfirmed: true,
        userIntentSource: "direct_user_command",
        writePolicy: {
          decision: "execute",
          reason: "semantic_default_execute",
        },
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        partyId: "party-42",
        legalName: "ООО Ромашка",
      }),
    );
    expect(crmToolsRegistry.execute).toHaveBeenCalledWith(
      RaiToolName.RegisterCounterparty,
      { inn: "2610000615", jurisdictionCode: "RU" },
      expect.objectContaining({
        userId: "user-1",
        userConfirmed: true,
        userIntentSource: "direct_user_command",
        writePolicy: {
          decision: "execute",
          reason: "semantic_default_execute",
        },
      }),
    );
    expect(pendingActionCreateMock).not.toHaveBeenCalled();
  });

  it("CRM WRITE без direct_user_command остаётся в governed PendingAction path", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    pendingActionCreateMock.mockResolvedValueOnce({ id: "pa-crm-governed" });

    await expect(
      registry.execute(
        RaiToolName.RegisterCounterparty,
        { inn: "2610000615", jurisdictionCode: "RU" },
        {
          ...actorContext,
          userId: "user-1",
          userConfirmed: true,
          userIntentSource: "delegated_or_autonomous",
          writePolicy: {
            decision: "confirm",
            reason: "semantic_default_confirm",
          },
        },
      ),
    ).rejects.toBeInstanceOf(RiskPolicyBlockedError);

    expect(crmToolsRegistry.execute).not.toHaveBeenCalled();
    expect(pendingActionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        toolName: RaiToolName.RegisterCounterparty,
        riskLevel: "WRITE",
        requestedByUserId: "user-1",
      }),
    });
  });

  it("QUARANTINE level блокирует мутирующие тулзы до RiskPolicy", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (autonomyPolicy.getCompanyAutonomyLevel as jest.Mock).mockResolvedValueOnce(
      AutonomyLevel.QUARANTINE,
    );

    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      ),
    ).rejects.toBeInstanceOf(RiskPolicyBlockedError);

    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
    expect(pendingActionCreateMock).not.toHaveBeenCalled();
  });

  it("TOOL_FIRST форсирует PendingAction даже при ALLOWED из RiskPolicy", async () => {
    const registry = createRegistry();
    registry.onModuleInit();
    (autonomyPolicy.getCompanyAutonomyLevel as jest.Mock).mockResolvedValueOnce(
      AutonomyLevel.TOOL_FIRST,
    );
    jest
      .spyOn(riskPolicyEngine, "evaluate")
      .mockReturnValue("ALLOWED" as any);
    pendingActionCreateMock.mockResolvedValueOnce({ id: "pa-auto" });

    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "field-1", seasonRef: "season-1", crop: "rapeseed" },
        actorContext,
      ),
    ).rejects.toBeInstanceOf(RiskPolicyBlockedError);

    expect(pendingActionCreateMock).toHaveBeenCalled();
    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
  });
});
