import { Test, TestingModule } from "@nestjs/testing";
import { SupervisorAgent } from "./supervisor-agent.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { AgroToolsRegistry } from "./tools/agro-tools.registry";
import { FinanceToolsRegistry } from "./tools/finance-tools.registry";
import { RiskToolsRegistry } from "./tools/risk-tools.registry";
import { KnowledgeToolsRegistry } from "./tools/knowledge-tools.registry";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { EconomistAgent } from "./agents/economist-agent.service";
import { KnowledgeAgent } from "./agents/knowledge-agent.service";
import { AgroDeterministicEngineFacade } from "./deterministic/agro-deterministic.facade";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { RiskPolicyEngineService } from "./security/risk-policy-engine.service";
import { PendingActionService } from "./security/pending-action.service";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { SensitiveDataFilterService } from "./security/sensitive-data-filter.service";
import { RaiToolName } from "./tools/rai-tools.types";
import { TechMapService } from "../tech-map/tech-map.service";
import { DeviationService } from "../consulting/deviation.service";
import { KpiService } from "../consulting/kpi.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceSummaryService } from "./trace-summary.service";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { AutonomyPolicyService } from "./autonomy-policy.service";
import { WorkspaceEntityKind } from "./dto/rai-chat.dto";
import { PerformanceMetricsService } from "./performance/performance-metrics.service";
import { QueueMetricsService } from "./performance/queue-metrics.service";
import { AgentRuntimeConfigService } from "./agent-runtime-config.service";
import { IncidentOpsService } from "./incident-ops.service";
import { BudgetControllerService } from "./security/budget-controller.service";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";

describe("SupervisorAgent", () => {
  let agent: SupervisorAgent;
  const memoryAdapterMock = {
    retrieve: jest.fn().mockResolvedValue({
      traceId: undefined,
      total: 0,
      positive: 0,
      negative: 0,
      unknown: 0,
      items: [],
    }),
    appendInteraction: jest.fn().mockResolvedValue(undefined),
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };
  const externalSignalsServiceMock = {
    process: jest
      .fn()
      .mockResolvedValue({ advisory: undefined, feedbackStored: false }),
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
  const prismaServiceMock = {
    harvestPlan: { findFirst: jest.fn() },
    agroEscalation: { findMany: jest.fn().mockResolvedValue([]) },
    aiAuditEntry: { create: jest.fn().mockResolvedValue({}) },
    pendingAction: { create: jest.fn().mockResolvedValue({ id: "pa-1" }) },
  };
  const intentRouterMock = {
    classify: jest.fn().mockReturnValue({
      toolName: null,
      confidence: 0,
      method: "regex" as const,
      reason: "no_match",
    }),
    buildAutoToolCall: jest.fn().mockReturnValue(null),
  };
  const performanceMetricsServiceMock = {
    recordLatency: jest.fn().mockResolvedValue(undefined),
    recordError: jest.fn().mockResolvedValue(undefined),
  };
  const queueMetricsServiceMock = {
    beginRuntimeExecution: jest.fn().mockResolvedValue(undefined),
    endRuntimeExecution: jest.fn().mockResolvedValue(undefined),
  };
  const agentRuntimeConfigServiceMock = {
    resolveToolAccess: jest.fn().mockResolvedValue({ allowed: true }),
  };
  const incidentOpsServiceMock = {
    logIncident: jest.fn(),
  };
  const budgetControllerServiceMock = {
    evaluateRuntimeBudget: jest.fn().mockResolvedValue({
      outcome: "ALLOW",
      reason: "WITHIN_BUDGET",
      source: "agent_registry_max_tokens",
      estimatedTokens: 0,
      budgetLimit: null,
      allowedToolNames: [],
      droppedToolNames: [],
      ownerRoles: [],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    intentRouterMock.buildAutoToolCall.mockReturnValue(null);
    intentRouterMock.classify.mockReturnValue({
      toolName: null,
      confidence: 0,
      method: "regex",
      reason: "no_match",
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupervisorAgent,
        MemoryCoordinatorService,
        AgentRuntimeService,
        ResponseComposerService,
        AgroToolsRegistry,
        FinanceToolsRegistry,
        RiskToolsRegistry,
        KnowledgeToolsRegistry,
        AgroDeterministicEngineFacade,
        AgronomAgent,
        EconomistAgent,
        KnowledgeAgent,
        RaiToolsRegistry,
        RiskPolicyEngineService,
        PendingActionService,
        RaiChatWidgetBuilder,
        { provide: IntentRouterService, useValue: intentRouterMock },
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
        { provide: TechMapService, useValue: techMapServiceMock },
        { provide: DeviationService, useValue: deviationServiceMock },
        { provide: KpiService, useValue: kpiServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: SensitiveDataFilterService, useValue: { mask: (s: string) => s } },
        { provide: PerformanceMetricsService, useValue: performanceMetricsServiceMock },
        { provide: QueueMetricsService, useValue: queueMetricsServiceMock },
        { provide: AgentRuntimeConfigService, useValue: agentRuntimeConfigServiceMock },
        { provide: IncidentOpsService, useValue: incidentOpsServiceMock },
        { provide: BudgetControllerService, useValue: budgetControllerServiceMock },
        { provide: TraceSummaryService, useValue: { record: jest.fn().mockResolvedValue(undefined), updateQuality: jest.fn().mockResolvedValue(undefined) } },
        { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
        { provide: TruthfulnessEngineService, useValue: { calculateTraceTruthfulness: jest.fn().mockResolvedValue(20) } },
      ],
    }).compile();

    agent = module.get(SupervisorAgent);
    module.get(AgroToolsRegistry).onModuleInit();
    module.get(FinanceToolsRegistry).onModuleInit();
    module.get(RiskToolsRegistry).onModuleInit();
    module.get(KnowledgeToolsRegistry).onModuleInit();
    module.get(RaiToolsRegistry).onModuleInit();
  });

  it("orchestrates response contract through the supervisor layer", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastRoute: "/registry/fields",
      lastMessagePreview: "Покажи контекст",
      confidence: 0.82,
      provenance: "profile",
    });

    const result = await agent.orchestrate(
      {
        message: "Покажи контекст",
        workspaceContext: {
          route: "/registry/fields",
          lastUserAction: "open-field",
        },
        toolCalls: [
          {
            name: RaiToolName.WorkspaceSnapshot,
            payload: {
              route: "/registry/fields",
              lastUserAction: "open-field",
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ toolName: RaiToolName.EchoMessage }),
        expect.objectContaining({ toolName: RaiToolName.WorkspaceSnapshot }),
      ]),
    );
    expect(result.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.DeviationList,
        }),
        expect.objectContaining({
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.TaskBacklog,
        }),
      ]),
    );
    expect(result.traceId).toEqual(expect.stringMatching(/^tr_/));
    expect(result.threadId).toEqual(expect.stringMatching(/^th_/));
    expect(result.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
          confidence: 0.82,
        }),
      ]),
    );
    expect(memoryAdapterMock.getProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
    );
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
      expect.objectContaining({
        userMessage: "Покажи контекст",
      }),
    );
    expect(memoryAdapterMock.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
      expect.objectContaining({
        lastRoute: "/registry/fields",
      }),
    );
  });

  it("includes profile summary in response when profile exists", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastRoute: "/consulting/dashboard",
      lastMessagePreview: "Покажи KPI",
    });

    const result = await agent.orchestrate(
      {
        message: "Что дальше?",
      },
      "company-2",
      "user-2",
    );

    expect(result.text).toContain(
      "(Профиль: lastRoute=/consulting/dashboard; lastMessage=Покажи KPI)",
    );
    expect(result.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
          label: "lastRoute=/consulting/dashboard; lastMessage=Покажи KPI",
        }),
      ]),
    );
  });

  it("auto-runs deviation tool when intent is detected from the message", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputeDeviations,
      payload: {
        scope: { seasonId: "season-1", fieldId: "field-1" },
      },
    });
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
    ]);

    const result = await agent.orchestrate(
      {
        message: "покажи отклонения по полю",
        workspaceContext: {
          route: "/consulting/fields",
          activeEntityRefs: [
            { kind: WorkspaceEntityKind.field, id: "field-1" },
          ],
          filters: { seasonId: "season-1" },
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputeDeviations,
          payload: expect.objectContaining({
            count: 1,
            seasonId: "season-1",
            fieldId: "field-1",
          }),
        }),
      ]),
    );
    expect(result.text).toContain("Отклонений найдено: 1");
  });

  it("auto-runs plan fact tool when KPI intent is detected", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.ComputePlanFact,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputePlanFact,
      payload: { scope: { seasonId: "season-9" } },
    });
    prismaServiceMock.harvestPlan.findFirst
      .mockResolvedValueOnce({
        id: "plan-9",
        status: "ACTIVE",
        seasonId: "season-9",
        companyId: "company-1",
      })
      .mockResolvedValueOnce({
        id: "plan-9",
        status: "ACTIVE",
        seasonId: "season-9",
        companyId: "company-1",
      });
    kpiServiceMock.calculatePlanKPI.mockResolvedValueOnce({
      hasData: true,
      roi: 16.5,
      ebitda: 2200,
      revenue: 4100,
      totalActualCost: 1800,
      totalPlannedCost: 1900,
    });

    const result = await agent.orchestrate(
      {
        message: "kpi план факт по сезону",
        workspaceContext: {
          route: "/consulting",
          filters: { seasonId: "season-9" },
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputePlanFact,
          payload: expect.objectContaining({
            planId: "plan-9",
            seasonId: "season-9",
            roi: 16.5,
          }),
        }),
      ]),
    );
    expect(result.text).toContain("План-факт по плану plan-9");
  });

  it("auto-runs alerts tool when alert intent is detected — RiskPolicy blocks WRITE, returns PendingAction", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.EmitAlerts,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.EmitAlerts,
      payload: { severity: "S3" },
    });

    const result = await agent.orchestrate(
      {
        message: "есть ли алерт эскалация",
        workspaceContext: {
          route: "/consulting",
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.EmitAlerts,
          payload: expect.objectContaining({
            riskPolicyBlocked: true,
            actionId: "pa-1",
          }),
        }),
      ]),
    );
    expect(prismaServiceMock.agroEscalation.findMany).not.toHaveBeenCalled();
  });

  it("auto-runs tech map draft — RiskPolicy blocks WRITE, creates PendingAction", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.GenerateTechMapDraft,
      payload: {
        fieldRef: "field-42",
        seasonRef: "season-42",
        crop: "rapeseed",
      },
    });

    const result = await agent.orchestrate(
      {
        message: "сделай техкарту рапс",
        workspaceContext: {
          route: "/consulting/techmaps",
          activeEntityRefs: [
            { kind: WorkspaceEntityKind.field, id: "field-42" },
          ],
          filters: { seasonId: "season-42" },
        },
      },
      "company-1",
      "user-1",
    );

    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.GenerateTechMapDraft,
          payload: expect.objectContaining({
            riskPolicyBlocked: true,
            actionId: "pa-1",
          }),
        }),
      ]),
    );
  });

  it("returns runtimeBudget in response and audit metadata when budget governor denies execution", async () => {
    budgetControllerServiceMock.evaluateRuntimeBudget.mockResolvedValueOnce({
      outcome: "DENY",
      reason: "TOKEN_BUDGET_EXCEEDED:agronomist:generate_tech_map_draft",
      source: "agent_registry_max_tokens",
      estimatedTokens: 9000,
      budgetLimit: 8000,
      allowedToolNames: [],
      droppedToolNames: [RaiToolName.GenerateTechMapDraft],
      ownerRoles: ["agronomist"],
    });

    const result = await agent.orchestrate(
      {
        message: "сделай техкарту",
        toolCalls: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            payload: { fieldRef: "field-42", seasonRef: "season-42", crop: "rapeseed" },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    expect(result.runtimeBudget).toEqual(
      expect.objectContaining({
        outcome: "DENY",
        droppedToolNames: [RaiToolName.GenerateTechMapDraft],
      }),
    );
    expect(result.toolCalls).toEqual([]);
    expect(prismaServiceMock.aiAuditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            runtimeBudget: expect.objectContaining({
              outcome: "DENY",
            }),
          }),
        }),
      }),
    );
  });

  describe("Truthfulness runtime pipeline", () => {
    let traceSummaryMock: { record: jest.Mock; updateQuality: jest.Mock };
    let truthfulnessMock: { calculateTraceTruthfulness: jest.Mock };
    let auditCreateMock: jest.Mock;

    beforeEach(() => {
      traceSummaryMock = { record: jest.fn().mockResolvedValue(undefined), updateQuality: jest.fn().mockResolvedValue(undefined) };
      truthfulnessMock = {
        calculateTraceTruthfulness: jest.fn().mockResolvedValue({
          bsScorePct: 20,
          evidenceCoveragePct: 100,
          invalidClaimsPct: 0,
          accounting: { total: 1, evidenced: 1, verified: 1, unverified: 0, invalid: 0 },
        }),
      };
      auditCreateMock = jest.fn().mockResolvedValue({});
    });

    async function buildAgent(overrides?: {
      auditCreate?: jest.Mock;
      traceSummary?: object;
      truthfulness?: object;
    }): Promise<SupervisorAgent> {
      const mod: TestingModule = await Test.createTestingModule({
        providers: [
          SupervisorAgent,
          MemoryCoordinatorService,
          AgentRuntimeService,
          ResponseComposerService,
          AgroToolsRegistry,
          FinanceToolsRegistry,
          RiskToolsRegistry,
          KnowledgeToolsRegistry,
          AgroDeterministicEngineFacade,
          AgronomAgent,
          EconomistAgent,
          KnowledgeAgent,
          RaiToolsRegistry,
          RiskPolicyEngineService,
          PendingActionService,
          RaiChatWidgetBuilder,
          { provide: IntentRouterService, useValue: intentRouterMock },
          { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
          { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
          { provide: TechMapService, useValue: techMapServiceMock },
          { provide: DeviationService, useValue: deviationServiceMock },
          { provide: KpiService, useValue: kpiServiceMock },
          {
            provide: PrismaService,
            useValue: {
              ...prismaServiceMock,
              aiAuditEntry: { create: overrides?.auditCreate ?? auditCreateMock },
            },
          },
          { provide: SensitiveDataFilterService, useValue: { mask: (s: string) => s } },
          { provide: PerformanceMetricsService, useValue: performanceMetricsServiceMock },
          { provide: QueueMetricsService, useValue: queueMetricsServiceMock },
          { provide: AgentRuntimeConfigService, useValue: agentRuntimeConfigServiceMock },
          { provide: IncidentOpsService, useValue: incidentOpsServiceMock },
          { provide: BudgetControllerService, useValue: budgetControllerServiceMock },
          { provide: TraceSummaryService, useValue: overrides?.traceSummary ?? traceSummaryMock },
          { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
          { provide: TruthfulnessEngineService, useValue: overrides?.truthfulness ?? truthfulnessMock },
        ],
      }).compile();
      const ag = mod.get(SupervisorAgent);
      mod.get(AgroToolsRegistry).onModuleInit();
      mod.get(FinanceToolsRegistry).onModuleInit();
      mod.get(RiskToolsRegistry).onModuleInit();
      mod.get(KnowledgeToolsRegistry).onModuleInit();
      mod.get(RaiToolsRegistry).onModuleInit();
      return ag;
    }

    const baseRequest = { message: "test" };

    it("success path: audit create → calculateTraceTruthfulness → updateQuality с реальным набором метрик", async () => {
      truthfulnessMock.calculateTraceTruthfulness.mockResolvedValue({
        bsScorePct: 35,
        evidenceCoveragePct: 90,
        invalidClaimsPct: 5,
        accounting: { total: 20, evidenced: 18, verified: 15, unverified: 4, invalid: 1 },
        qualityStatus: "READY",
      });
      const ag = await buildAgent();

      await ag.orchestrate(baseRequest, "company-1", "user-1");
      // Даём микро-задержку для fire-and-forget цепочки
      await new Promise((r) => setTimeout(r, 10));

      expect(auditCreateMock).toHaveBeenCalledTimes(1);
      expect(truthfulnessMock.calculateTraceTruthfulness).toHaveBeenCalledTimes(1);
      expect(traceSummaryMock.updateQuality).toHaveBeenCalledWith(
        expect.objectContaining({
          bsScorePct: 35,
          evidenceCoveragePct: 90,
          invalidClaimsPct: 5,
        }),
      );
    });

    it("no-evidence path: движок возвращает pending quality и updateQuality не подменяет цифры", async () => {
      truthfulnessMock.calculateTraceTruthfulness.mockResolvedValue({
        bsScorePct: null,
        evidenceCoveragePct: null,
        invalidClaimsPct: null,
        accounting: { total: 0, evidenced: 0, verified: 0, unverified: 0, invalid: 0 },
        qualityStatus: "PENDING_EVIDENCE",
      });
      const ag = await buildAgent();

      await ag.orchestrate(baseRequest, "company-1", "user-1");
      await new Promise((r) => setTimeout(r, 10));

      expect(traceSummaryMock.updateQuality).toHaveBeenCalledWith(
        expect.objectContaining({ bsScorePct: null, evidenceCoveragePct: null, invalidClaimsPct: null }),
      );
    });

    it("failure path: ошибка движка не ломает orchestrate(), updateQuality не вызывается", async () => {
      truthfulnessMock.calculateTraceTruthfulness.mockRejectedValue(new Error("engine boom"));
      const ag = await buildAgent();

      const result = await ag.orchestrate(baseRequest, "company-1", "user-1");
      await new Promise((r) => setTimeout(r, 10));

      // Response возвращён корректно
      expect(result).toHaveProperty("traceId");
      // updateQuality не вызван при ошибке движка
      expect(traceSummaryMock.updateQuality).not.toHaveBeenCalled();
    });

    it("replayMode: truthfulness pipeline, audit entry и trace summary record пропущены", async () => {
      const ag = await buildAgent();

      await ag.orchestrate(baseRequest, "company-1", "user-1", { replayMode: true });
      await new Promise((r) => setTimeout(r, 10));

      // В replay режиме side effects в БД не пишутся
      expect(auditCreateMock).not.toHaveBeenCalled();
      expect(traceSummaryMock.record).not.toHaveBeenCalled();

      // И truthfulness pipeline не запускается (read-only invariant)
      expect(truthfulnessMock.calculateTraceTruthfulness).not.toHaveBeenCalled();
      expect(traceSummaryMock.updateQuality).not.toHaveBeenCalled();
    });

    it("ordering: updateQuality вызывается только после resolve traceSummary.record и aiAuditEntry.create", async () => {
      const callOrder: string[] = [];

      traceSummaryMock.record.mockImplementation(() =>
        new Promise<void>((res) => setTimeout(() => { callOrder.push("record"); res(); }, 5)),
      );
      // audit create — задержка 5ms чтобы убедиться, что await реально ждёт
      auditCreateMock.mockImplementation(() =>
        new Promise<object>((res) => setTimeout(() => { callOrder.push("audit"); res({}); }, 5)),
      );
      truthfulnessMock.calculateTraceTruthfulness.mockImplementation(() => {
        callOrder.push("truthfulness");
        return Promise.resolve({
          bsScorePct: 42,
          evidenceCoveragePct: 100,
          invalidClaimsPct: 0,
          accounting: { total: 1, evidenced: 1, verified: 1, unverified: 0, invalid: 0 },
        });
      });
      traceSummaryMock.updateQuality.mockImplementation(() => {
        callOrder.push("updateQuality");
        return Promise.resolve();
      });

      const ag = await buildAgent();
      await ag.orchestrate(baseRequest, "company-1", "user-1");
      await new Promise((r) => setTimeout(r, 30));

      // Гарантируем порядок: сначала record, потом audit, потом truthfulness, потом updateQuality
      expect(callOrder.indexOf("record")).toBeLessThan(callOrder.indexOf("audit"));
      expect(callOrder.indexOf("audit")).toBeLessThan(callOrder.indexOf("truthfulness"));
      expect(callOrder.indexOf("truthfulness")).toBeLessThan(callOrder.indexOf("updateQuality"));
    });
  });
});
