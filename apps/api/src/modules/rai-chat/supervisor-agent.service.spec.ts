import { Test, TestingModule } from "@nestjs/testing";
import { SupervisorAgent } from "./supervisor-agent.service";
import { SupervisorForensicsService } from "./supervisor-forensics.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { AgroToolsRegistry } from "./tools/agro-tools.registry";
import { FinanceToolsRegistry } from "./tools/finance-tools.registry";
import { RiskToolsRegistry } from "./tools/risk-tools.registry";
import { KnowledgeToolsRegistry } from "./tools/knowledge-tools.registry";
import { CrmToolsRegistry } from "./tools/crm-tools.registry";
import { FrontOfficeToolsRegistry } from "./tools/front-office-tools.registry";
import { ContractsToolsRegistry } from "./tools/contracts-tools.registry";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { EconomistAgent } from "./agents/economist-agent.service";
import { KnowledgeAgent } from "./agents/knowledge-agent.service";
import { MonitoringAgent } from "./agents/monitoring-agent.service";
import { CrmAgent } from "./agents/crm-agent.service";
import { FrontOfficeAgent } from "./agents/front-office-agent.service";
import { ContractsAgent } from "./agents/contracts-agent.service";
import { ChiefAgronomistAgent } from "./agents/chief-agronomist-agent.service";
import { DataScientistAgent } from "./agents/data-scientist-agent.service";
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
import { OpenRouterGatewayService } from "./agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "./agent-platform/agent-prompt-assembly.service";
import { AgentExecutionAdapterService } from "./runtime/agent-execution-adapter.service";
import { RuntimeGovernanceControlService } from "./runtime/runtime-governance-control.service";
import { RuntimeGovernanceEventService } from "./runtime-governance/runtime-governance-event.service";
import { RuntimeGovernanceFeatureFlagsService } from "./runtime-governance/runtime-governance-feature-flags.service";
import { RuntimeGovernancePolicyService } from "./runtime-governance/runtime-governance-policy.service";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "../../shared/rai-chat/rai-chat-widgets.types";

describe("SupervisorAgent", () => {
  let agent: SupervisorAgent;
  let agentRuntimeService: AgentRuntimeService;
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
    getQueuePressure: jest.fn().mockResolvedValue({
      pressureState: "STABLE",
      signalFresh: true,
      totalBacklog: 1,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [],
    }),
  };
  const agentRuntimeConfigServiceMock = {
    resolveToolAccess: jest.fn().mockResolvedValue({ allowed: true }),
    getEffectiveKernel: jest.fn().mockResolvedValue({
      definition: { defaultAutonomyMode: "advisory" },
      outputContract: {
        responseSchemaVersion: "v1",
        contractId: "agronom-v1",
        requiresEvidence: true,
        requiresDeterministicValidation: false,
      },
      runtimeProfile: { model: "openrouter/test", provider: "openrouter" },
      toolBindings: [
        {
          toolName: RaiToolName.GenerateTechMapDraft,
          isEnabled: true,
          requiresHumanGate: true,
          riskLevel: "WRITE",
        },
        {
          toolName: RaiToolName.ComputeDeviations,
          isEnabled: true,
          requiresHumanGate: false,
          riskLevel: "READ",
        },
        {
          toolName: RaiToolName.ComputePlanFact,
          isEnabled: true,
          requiresHumanGate: false,
          riskLevel: "READ",
        },
        {
          toolName: RaiToolName.EmitAlerts,
          isEnabled: true,
          requiresHumanGate: true,
          riskLevel: "WRITE",
        },
      ],
      connectorBindings: [],
      isActive: true,
    }),
  };
  const incidentOpsServiceMock = {
    logIncident: jest.fn(),
  };
  const openRouterGatewayMock = {
    generate: jest.fn().mockRejectedValue(new Error("OPENROUTER_API_KEY_MISSING")),
  };
  const agentPromptAssemblyMock = {
    buildMessages: jest.fn().mockReturnValue([]),
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
      fallbackReason: "NONE",
      fallbackMode: "NONE",
    }),
  };
  const runtimeGovernanceEventServiceMock = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const runtimeGovernancePolicyServiceMock = {
    getRolePolicy: jest.fn().mockReturnValue({
      concurrency: {
        maxParallelToolCalls: 8,
        maxParallelGroups: 6,
        deadlineMs: 30_000,
      },
      thresholds: {
        queueSaturationThreshold: "SATURATED",
      },
    }),
    resolveFallbackMode: jest.fn().mockReturnValue("READ_ONLY_SUPPORT"),
  };
  const runtimeGovernanceFeatureFlagsServiceMock = {
    getFlags: jest.fn().mockReturnValue({
      enforcementEnabled: true,
      queueFallbackEnabled: true,
      queueFallbackShadowMode: false,
      emergencyKillSwitch: false,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.RAI_AGENT_RUNTIME_MODE;
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
        SupervisorForensicsService,
        MemoryCoordinatorService,
        AgentRuntimeService,
        AgentExecutionAdapterService,
        RuntimeGovernanceControlService,
        ResponseComposerService,
        AgroToolsRegistry,
        FinanceToolsRegistry,
        RiskToolsRegistry,
        KnowledgeToolsRegistry,
        { provide: CrmToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
        { provide: FrontOfficeToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
        { provide: ContractsToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
        AgroDeterministicEngineFacade,
        AgronomAgent,
        EconomistAgent,
        KnowledgeAgent,
        MonitoringAgent,
        { provide: CrmAgent, useValue: { run: jest.fn() } },
        { provide: FrontOfficeAgent, useValue: { run: jest.fn() } },
        { provide: ContractsAgent, useValue: { run: jest.fn() } },
        { provide: ChiefAgronomistAgent, useValue: { run: jest.fn() } },
        { provide: DataScientistAgent, useValue: { run: jest.fn() } },
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
        { provide: OpenRouterGatewayService, useValue: openRouterGatewayMock },
        { provide: AgentPromptAssemblyService, useValue: agentPromptAssemblyMock },
        { provide: TraceSummaryService, useValue: { record: jest.fn().mockResolvedValue(undefined), updateQuality: jest.fn().mockResolvedValue(undefined) } },
        { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
        { provide: TruthfulnessEngineService, useValue: { calculateTraceTruthfulness: jest.fn().mockResolvedValue(20) } },
        { provide: RuntimeGovernanceEventService, useValue: runtimeGovernanceEventServiceMock },
        { provide: RuntimeGovernancePolicyService, useValue: runtimeGovernancePolicyServiceMock },
        { provide: RuntimeGovernanceFeatureFlagsService, useValue: runtimeGovernanceFeatureFlagsServiceMock },
      ],
    }).compile();

    agent = module.get(SupervisorAgent);
    agentRuntimeService = module.get(AgentRuntimeService);
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
    expect(result.widgets).toEqual([]);
    expect(result.traceId).toEqual(expect.stringMatching(/^tr_/));
    expect(result.threadId).toEqual(expect.stringMatching(/^th_/));
    expect(result.memoryUsed ?? []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
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

    expect(result.text).toContain("ничего не найдено в базе знаний");
    expect(result.memoryUsed ?? []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
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
    expect(result.text).toContain("Отклонения получены");
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
    expect(result.text).toContain("План plan-9:");
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
            companyId: "company-1",
            signals: expect.any(Array),
          }),
        }),
      ]),
    );
    expect(prismaServiceMock.agroEscalation.findMany).toHaveBeenCalled();
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

    expect(techMapServiceMock.createDraftStub).toHaveBeenCalled();
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.GenerateTechMapDraft,
          payload: expect.any(Object),
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

  it("превращает agronomist NEEDS_MORE_DATA в payload добора контекста для техкарты", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "agronomist",
      intent: "generate_tech_map_draft",
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.7,
      method: "regex",
      reason: "match: техкарт",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.GenerateTechMapDraft,
      payload: {},
    });

    const result = await agent.orchestrate(
      {
        message: "Составь техкарту по озимому рапсу",
        workspaceContext: {
          route: "/consulting/techmaps",
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.text).toContain("Чтобы подготовить техкарту");
    expect(result.agentRole).toBe("agronomist");
    expect(result.pendingClarification).toEqual(
      expect.objectContaining({
        kind: "missing_context",
        intentId: "tech_map_draft",
        autoResume: true,
      }),
    );
    expect(result.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "context_acquisition",
          parentWindowId: null,
          relatedWindowIds: [expect.stringContaining("win-techmap-")],
          category: "clarification",
          priority: 85,
          mode: "panel",
          status: "needs_user_input",
          payload: expect.objectContaining({
            missingKeys: ["fieldRef", "seasonRef"],
          }),
        }),
        expect.objectContaining({
          type: "context_hint",
          parentWindowId: expect.stringContaining("win-techmap-"),
          relatedWindowIds: [expect.stringContaining("win-techmap-")],
          category: "analysis",
          priority: 40,
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
              targetWindowId: expect.stringContaining("win-techmap-"),
            }),
          ]),
        }),
      ]),
    );
    expect(result.activeWindowId).toEqual(expect.stringContaining("win-techmap-"));
  });

  it("отдаёт inline mode, если для техкарты не хватает только одного поля контекста", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "agronomist",
      intent: "generate_tech_map_draft",
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.7,
      method: "regex",
      reason: "match: техкарт",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.GenerateTechMapDraft,
      payload: { seasonRef: "season-2026" },
    });

    const result = await agent.orchestrate(
      {
        message: "Составь техкарту по озимому рапсу",
        workspaceContext: {
          route: "/consulting/techmaps",
          filters: {
            seasonId: "season-2026",
          },
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "context_acquisition",
          parentWindowId: null,
          category: "clarification",
          priority: 95,
          mode: "inline",
          status: "needs_user_input",
          payload: expect.objectContaining({
            seasonRef: "season-2026",
            missingKeys: ["fieldRef"],
          }),
        }),
        expect.objectContaining({
          type: "context_hint",
          parentWindowId: expect.stringContaining("win-techmap-"),
          mode: "inline",
          category: "analysis",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
            }),
          ]),
        }),
      ]),
    );
  });

  it("resume path повторно запускает tech_map_draft и возвращает completed window", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    const result = await agent.orchestrate(
      {
        message: "Составь техкарту по озимому рапсу",
        clarificationResume: {
          windowId: "win-techmap-thread-1",
          intentId: "tech_map_draft",
          agentRole: "agronomist",
          collectedContext: {
            fieldRef: "field-42",
            seasonRef: "season-42",
          },
        },
        workspaceContext: {
          route: "/consulting/techmaps",
        },
        threadId: "thread-1",
      },
      "company-1",
      "user-1",
    );

    expect(result.pendingClarification).toBeNull();
    expect(result.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          windowId: "win-techmap-thread-1",
          parentWindowId: null,
          relatedWindowIds: ["win-techmap-thread-1-result-hint"],
          category: "result",
          priority: 70,
          mode: "takeover",
          status: "completed",
          payload: expect.objectContaining({
            fieldRef: "field-42",
            seasonRef: "season-42",
            missingKeys: [],
          }),
        }),
        expect.objectContaining({
          windowId: "win-techmap-thread-1-result-hint",
          type: "context_hint",
          parentWindowId: "win-techmap-thread-1",
          category: "result",
          priority: 30,
          mode: "inline",
          status: "completed",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
              targetWindowId: "win-techmap-thread-1",
            }),
            expect.objectContaining({
              kind: "open_field_card",
              label: "Открыть поле",
            }),
            expect.objectContaining({
              kind: "go_to_techmap",
              targetRoute: "/consulting/techmaps/active",
            }),
          ]),
        }),
      ]),
    );
  });

  it("превращает economist NEEDS_MORE_DATA в payload добора контекста для план-факта", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "economist",
      intent: "compute_plan_fact",
      toolName: RaiToolName.ComputePlanFact,
      confidence: 0.78,
      method: "regex",
      reason: "match: plan-fact",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputePlanFact,
      payload: { scope: {} },
    });

    const result = await agent.orchestrate(
      {
        message: "Покажи план-факт по сезону",
        workspaceContext: {
          route: "/consulting/yield",
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.text).toContain("Чтобы показать план-факт");
    expect(result.agentRole).toBe("economist");
    expect(result.pendingClarification).toEqual(
      expect.objectContaining({
        kind: "missing_context",
        intentId: "compute_plan_fact",
        agentRole: "economist",
      }),
    );
    expect(result.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "context_acquisition",
          title: "Добор контекста для план-факта",
          category: "clarification",
          status: "needs_user_input",
          payload: expect.objectContaining({
            intentId: "compute_plan_fact",
            missingKeys: ["seasonId"],
          }),
        }),
        expect.objectContaining({
          type: "context_hint",
          title: "Что ещё нужно для план-факта",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "open_route",
              targetRoute: "/consulting/yield",
            }),
          ]),
        }),
      ]),
    );
  });

  it("resume path повторно запускает compute_plan_fact и возвращает completed window", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
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
      roi: 0.165,
      ebitda: 2200,
      revenue: 4100,
      totalActualCost: 1800,
      totalPlannedCost: 1900,
    });

    const result = await agent.orchestrate(
      {
        message: "Покажи план-факт по сезону",
        clarificationResume: {
          windowId: "win-planfact-thread-1",
          intentId: "compute_plan_fact",
          agentRole: "economist",
          collectedContext: {
            seasonId: "season-9",
          },
        },
        workspaceContext: {
          route: "/consulting/yield",
          filters: { seasonId: "season-9" },
        },
        threadId: "thread-1",
      },
      "company-1",
      "user-1",
    );

    expect(result.pendingClarification).toBeNull();
    expect(result.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          windowId: "win-planfact-thread-1",
          title: "План-факт готов",
          category: "result",
          mode: "takeover",
          status: "completed",
          payload: expect.objectContaining({
            intentId: "compute_plan_fact",
            seasonId: "season-9",
            missingKeys: [],
          }),
        }),
        expect.objectContaining({
          windowId: "win-planfact-thread-1-result-hint",
          type: "context_hint",
          category: "result",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
              targetWindowId: "win-planfact-thread-1",
            }),
            expect.objectContaining({
              kind: "open_route",
              targetRoute: "/consulting/yield",
            }),
          ]),
        }),
      ]),
    );
  });

  it("запускает hidden cross-check через knowledge при низком trust score", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "agronomist",
      intent: "compute_deviations",
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.91,
      method: "tool_call_primary",
      reason: "explicit intent",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputeDeviations,
      payload: { fieldRef: "FIELD-6" },
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.ComputeDeviations,
            result: { summary: "Отклонения по питанию найдены." },
          },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Агроном собрал первичный результат.",
          structuredOutput: {
            confidence: 0.2,
            summary: "Низкая уверенность в данных.",
            crossCheckRequired: true,
          },
          toolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              result: { summary: "Отклонения по питанию найдены." },
            },
          ],
          connectorCalls: [],
          evidence: [],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.ComputeDeviations],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.QueryKnowledge,
            result: {
              hits: 1,
              items: [{ content: "Норматив подтвержден", score: 0.9 }],
            },
          },
        ],
        agentExecution: {
          role: "knowledge",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Knowledge cross-check подтверждает расчёт.",
          structuredOutput: {
            summary: "Knowledge cross-check подтверждает расчёт.",
            confidence: 0.9,
          },
          toolCalls: [
            {
              name: RaiToolName.QueryKnowledge,
              result: { hits: 1 },
            },
          ],
          connectorCalls: [],
          evidence: [
            {
              claim: "Норматив подтвержден",
              sourceType: "KB",
              sourceId: "kb-1",
              confidenceScore: 0.9,
            },
          ],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.QueryKnowledge],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "knowledge-v1",
          },
        },
      } as any);

    const response = await agent.orchestrate(
      {
        message: "проверь норму селитры и стоимость",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalledTimes(2);
    expect(response.text).toContain("Синтез делегированной цепочки");
    expect(response.text).toContain("Knowledge cross-check подтверждает расчёт.");
    expect(response.intermediateSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: RaiToolName.QueryKnowledge,
        }),
      ]),
    );
  });

  it("фиксирует before/after token-cost метрики для legacy-long-text vs stage3-json", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    const costPer1kTokensUsd = 0.002;
    const ratePerMsUsd = 0.000002;

    intentRouterMock.classify.mockReturnValue({
      targetRole: "agronomist",
      intent: "compute_deviations",
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.9,
      method: "tool_call_primary",
      reason: "explicit",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValue({
      name: RaiToolName.ComputeDeviations,
      payload: { fieldRef: "FIELD-6" },
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          { name: RaiToolName.ComputeDeviations, result: { summary: "legacy" } },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Legacy long text answer",
          structuredOutput: { confidence: 0.9, summary: "legacy baseline" },
          toolCalls: [{ name: RaiToolName.ComputeDeviations, result: {} }],
          connectorCalls: [],
          evidence: [],
          usage: { promptTokens: 2000, completionTokens: 800, totalTokens: 2800 },
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.ComputeDeviations],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        executedTools: [
          { name: RaiToolName.ComputeDeviations, result: { summary: "json" } },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "JSON worker answer",
          structuredOutput: {
            confidence: 0.2,
            summary: "json baseline",
            crossCheckRequired: true,
          },
          structuredOutputs: [{ summary: "json baseline" }],
          toolCalls: [{ name: RaiToolName.ComputeDeviations, result: {} }],
          connectorCalls: [],
          evidence: [],
          usage: { promptTokens: 900, completionTokens: 300, totalTokens: 1200 },
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.ComputeDeviations],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        executedTools: [
          { name: RaiToolName.QueryKnowledge, result: { hits: 1, items: [] } },
        ],
        agentExecution: {
          role: "knowledge",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "cross-check",
          structuredOutput: {
            summary: "cross-check",
            confidence: 0.9,
          },
          toolCalls: [{ name: RaiToolName.QueryKnowledge, result: {} }],
          connectorCalls: [],
          evidence: [],
          usage: { promptTokens: 140, completionTokens: 60, totalTokens: 200 },
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.QueryKnowledge],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "knowledge-v1",
          },
        },
      } as any);

    const startedLegacy = Date.now();
    await agent.orchestrate(
      {
        message: "legacy baseline",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      "company-1",
      "user-1",
    );
    const legacyLatencyMs = Date.now() - startedLegacy;

    const startedStage3 = Date.now();
    await agent.orchestrate(
      {
        message: "stage3 baseline",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      "company-1",
      "user-1",
    );
    const stage3LatencyMs = Date.now() - startedStage3;

    expect(executeAgentSpy).toHaveBeenCalledTimes(3);
    const auditCalls = prismaServiceMock.aiAuditEntry.create.mock.calls;
    expect(auditCalls).toHaveLength(2);
    const legacyTokens = auditCalls[0][0].data.tokensUsed as number;
    const stage3Tokens = auditCalls[1][0].data.tokensUsed as number;
    expect(legacyTokens).toBe(2800);
    expect(stage3Tokens).toBe(1400);
    expect(stage3Tokens).toBeLessThan(legacyTokens);

    const legacyCost =
      legacyTokens / 1000 * costPer1kTokensUsd + legacyLatencyMs * ratePerMsUsd;
    const stage3Cost =
      stage3Tokens / 1000 * costPer1kTokensUsd + stage3LatencyMs * ratePerMsUsd;
    console.info(
      "[STAGE3_TOKEN_METRICS]",
      JSON.stringify({
        legacyTokens,
        stage3Tokens,
        legacyLatencyMs,
        stage3LatencyMs,
        legacyCostUsd: Number(legacyCost.toFixed(6)),
        stage3CostUsd: Number(stage3Cost.toFixed(6)),
      }),
    );
    expect(stage3Cost).toBeLessThan(legacyCost);
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
          SupervisorForensicsService,
          MemoryCoordinatorService,
          AgentRuntimeService,
          AgentExecutionAdapterService,
          RuntimeGovernanceControlService,
          ResponseComposerService,
          AgroToolsRegistry,
          FinanceToolsRegistry,
          RiskToolsRegistry,
          KnowledgeToolsRegistry,
          { provide: CrmToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
          { provide: FrontOfficeToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
          { provide: ContractsToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
          AgroDeterministicEngineFacade,
          AgronomAgent,
          EconomistAgent,
          KnowledgeAgent,
          MonitoringAgent,
          { provide: CrmAgent, useValue: { run: jest.fn() } },
          { provide: FrontOfficeAgent, useValue: { run: jest.fn() } },
          { provide: ContractsAgent, useValue: { run: jest.fn() } },
          { provide: ChiefAgronomistAgent, useValue: { run: jest.fn() } },
          { provide: DataScientistAgent, useValue: { run: jest.fn() } },
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
          { provide: OpenRouterGatewayService, useValue: openRouterGatewayMock },
          { provide: AgentPromptAssemblyService, useValue: agentPromptAssemblyMock },
          { provide: TraceSummaryService, useValue: overrides?.traceSummary ?? traceSummaryMock },
          { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
          { provide: TruthfulnessEngineService, useValue: overrides?.truthfulness ?? truthfulnessMock },
          { provide: RuntimeGovernanceEventService, useValue: runtimeGovernanceEventServiceMock },
          { provide: RuntimeGovernancePolicyService, useValue: runtimeGovernancePolicyServiceMock },
          { provide: RuntimeGovernanceFeatureFlagsService, useValue: runtimeGovernanceFeatureFlagsServiceMock },
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

  describe("platform-wide interaction contracts", () => {
    it("knowledge path возвращает unified windows через contract-layer", async () => {
      process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
      memoryAdapterMock.getProfile.mockResolvedValueOnce({
        lastMessagePreview: "Регламент по сезону и технике безопасности для полевых работ.",
      });

      const response = await agent.orchestrate(
        {
          message: "регламент",
          workspaceContext: {
            route: "/knowledge/base",
          },
        },
        "company-a",
        "user-1",
      );

      expect(response.agentRole).toBe("knowledge");
      expect(response.workWindows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "structured_result",
            payload: expect.objectContaining({
              intentId: "query_knowledge",
            }),
          }),
          expect.objectContaining({
            type: "related_signals",
            payload: expect.objectContaining({
              intentId: "query_knowledge",
            }),
          }),
        ]),
      );
    });

    it("monitoring path возвращает unified windows через contract-layer", async () => {
      process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
      intentRouterMock.classify.mockReturnValueOnce({
        targetRole: "monitoring",
        intent: "emit_alerts",
        toolName: RaiToolName.EmitAlerts,
        confidence: 0.8,
        method: "regex",
        reason: "match: алерт|alert",
      });
      intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
        name: RaiToolName.EmitAlerts,
        payload: { severity: "S4" },
      });
      prismaServiceMock.agroEscalation.findMany.mockResolvedValueOnce([
        {
          id: "esc-1",
          severity: "S4",
          reason: "Risk spike",
          status: "OPEN",
          references: { entity: "FIELD-12" },
          createdAt: new Date("2026-03-07T10:00:00.000Z"),
        },
      ]);

      const response = await agent.orchestrate(
        {
          message: "покажи алерты",
          workspaceContext: {
            route: "/governance/security#incidents",
          },
        },
        "company-a",
        "user-1",
      );

      expect(response.agentRole).toBe("monitoring");
      expect(response.workWindows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "related_signals",
            payload: expect.objectContaining({
              intentId: "emit_alerts",
            }),
          }),
          expect.objectContaining({
            type: "structured_result",
            payload: expect.objectContaining({
              intentId: "emit_alerts",
            }),
          }),
        ]),
      );
    });
  });
});
