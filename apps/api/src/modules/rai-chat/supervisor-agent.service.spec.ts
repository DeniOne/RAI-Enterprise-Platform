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
import { SemanticRouterService } from "./semantic-router/semantic-router.service";
import { SemanticIngressService } from "./semantic-ingress.service";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "../../shared/rai-chat/rai-chat-widgets.types";

describe("SupervisorAgent", () => {
  let agent: SupervisorAgent;
  let agentRuntimeService: AgentRuntimeService;
  let responseComposerService: ResponseComposerService;
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
      trust: {
        maxTrackedBranches: 4,
        maxCrossCheckBranches: 1,
        latencyBudgetMs: {
          happyPathMs: 300,
          multiSourceReadMs: 800,
          crossCheckTriggeredMs: 1_500,
        },
      },
    }),
    resolveTrustLatencyBudgetMs: jest
      .fn()
      .mockImplementation((_role: string, profile: string) => {
        if (profile === "CROSS_CHECK_TRIGGERED") {
          return 1_500;
        }
        if (profile === "MULTI_SOURCE_READ") {
          return 800;
        }
        return 300;
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
  const semanticRouterMock = {
    evaluate: jest.fn().mockImplementation(async (input: any) => ({
      semanticIntent: {
        domain: "unknown",
        entity: "unknown",
        action: "unknown",
        interactionMode: "unknown",
        mutationRisk: "unknown",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: { activeFlow: null, pendingClarificationKeys: [], lastUserAction: null },
        resolvability: "missing",
        ambiguityType: "no_matching_route",
        confidenceBand: "low",
        reason: "mock",
      },
      routeDecision: {
        decisionType: "abstain",
        recommendedExecutionMode: "no_op",
        eligibleTools: [],
        eligibleFlows: [],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: true,
        abstainReason: "mock",
        policyBlockReason: null,
      },
      candidateRoutes: [],
      divergence: {
        isMismatch: false,
        mismatchKinds: [],
        summary: "match",
        legacyRouteKey: "legacy",
        semanticRouteKey: "semantic",
      },
      versionInfo: {
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        workspaceStateDigest: "digest",
      },
      latencyMs: 5,
      sliceId: null,
      promotedPrimary: false,
      executionPath: "semantic_router_shadow",
      requestedToolCalls: input.requestedToolCalls ?? [],
      classification: input.legacyClassification,
      routingContext: {
        source: "shadow",
        promotedPrimary: false,
        enforceCapabilityGating: false,
        sliceId: null,
        semanticIntent: {
          domain: "unknown",
          entity: "unknown",
          action: "unknown",
          interactionMode: "unknown",
          mutationRisk: "unknown",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: { activeFlow: null, pendingClarificationKeys: [], lastUserAction: null },
          resolvability: "missing",
          ambiguityType: "no_matching_route",
          confidenceBand: "low",
          reason: "mock",
        },
        routeDecision: {
          decisionType: "abstain",
          recommendedExecutionMode: "no_op",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: true,
          abstainReason: "mock",
          policyBlockReason: null,
        },
        candidateRoutes: [],
      },
      llmUsed: false,
      llmError: null,
    })),
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
        { provide: SemanticRouterService, useValue: semanticRouterMock },
        SemanticIngressService,
        { provide: AgentPromptAssemblyService, useValue: agentPromptAssemblyMock },
        { provide: TraceSummaryService, useValue: { record: jest.fn().mockResolvedValue(undefined), updateQuality: jest.fn().mockResolvedValue(undefined) } },
        { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
        {
          provide: TruthfulnessEngineService,
          useValue: {
            calculateTraceTruthfulness: jest.fn().mockResolvedValue(20),
            buildBranchTrustInputs: jest.fn().mockImplementation((evidence: Array<{ sourceId?: string; confidenceScore?: number }>) => {
              const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
              const hasInvalidEvidence = hasEvidence
                ? evidence.some((item) => (item.confidenceScore ?? 0) < 0.3)
                : false;
              return {
                classifiedEvidence: [],
                accounting: {
                  total: hasEvidence ? evidence.length : 0,
                  evidenced: hasEvidence
                    ? evidence.filter((item) => typeof item.sourceId === "string" && item.sourceId.trim().length > 0).length
                    : 0,
                  verified:
                    hasEvidence && !hasInvalidEvidence ? evidence.length : 0,
                  unverified: hasEvidence ? 0 : 0,
                  invalid: hasInvalidEvidence ? 1 : 0,
                },
                totalWeight: hasEvidence ? evidence.length : 0,
                weightedEvidence: {
                  verified: hasEvidence && !hasInvalidEvidence ? evidence.length : 0,
                  unverified: hasEvidence ? 0 : 0,
                  invalid: hasInvalidEvidence ? 1 : 0,
                },
                bsScorePct: hasEvidence ? (hasInvalidEvidence ? 100 : 0) : null,
                evidenceCoveragePct: hasEvidence ? 100 : null,
                invalidClaimsPct: hasEvidence ? (hasInvalidEvidence ? 100 : 0) : null,
                qualityStatus: hasEvidence ? "READY" : "PENDING_EVIDENCE",
                recommendedVerdict: hasEvidence
                  ? hasInvalidEvidence
                    ? "REJECTED"
                    : "VERIFIED"
                  : "UNVERIFIED",
                requiresCrossCheck: !hasEvidence || hasInvalidEvidence,
                reasons: hasEvidence ? [] : ["no_evidence"],
              };
            }),
          },
        },
        { provide: RuntimeGovernanceEventService, useValue: runtimeGovernanceEventServiceMock },
        { provide: RuntimeGovernancePolicyService, useValue: runtimeGovernancePolicyServiceMock },
        { provide: RuntimeGovernanceFeatureFlagsService, useValue: runtimeGovernanceFeatureFlagsServiceMock },
      ],
    }).compile();

    agent = module.get(SupervisorAgent);
    agentRuntimeService = module.get(AgentRuntimeService);
    responseComposerService = module.get(ResponseComposerService);
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

    expect(result.text).toContain("Я не совсем понял ваш запрос.");
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
            riskPolicyBlocked: true,
            actionId: expect.any(String),
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
            actionId: expect.any(String),
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
    const buildResponseSpy = jest.spyOn(
      responseComposerService,
      "buildResponse",
    );

    const response = await agent.orchestrate(
      {
        message: "проверь норму селитры и стоимость",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalledTimes(2);
    expect(response.text).toContain("Подтверждённый факт");
    expect(response.text).toContain("Knowledge cross-check подтверждает расчёт.");
    expect(response.intermediateSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: RaiToolName.QueryKnowledge,
        }),
      ]),
    );
    const composerExecution =
      buildResponseSpy.mock.calls[buildResponseSpy.mock.calls.length - 1]?.[0]
        ?.executionResult.agentExecution;
    expect(composerExecution?.structuredOutput).toEqual(
      expect.objectContaining({
        trustAssessment: "low",
        branchVerdict: "UNVERIFIED",
        trustCrossCheckTriggered: true,
        trustCrossCheckStatus: "completed",
      }),
    );
    expect(composerExecution?.branchResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branch_id: "agronomist:primary",
          source_agent: "agronomist",
          confidence: 0.2,
          scope: expect.objectContaining({
            domain: "agronomist",
            route: "/consulting/dashboard",
            company_id: "company-1",
          }),
        }),
        expect.objectContaining({
          branch_id: "knowledge:cross_check",
          source_agent: "knowledge",
        }),
      ]),
    );
    expect(composerExecution?.branchTrustAssessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branch_id: "agronomist:primary",
          verdict: "UNVERIFIED",
          requires_cross_check: true,
        }),
        expect.objectContaining({
          branch_id: "knowledge:cross_check",
          verdict: "VERIFIED",
          requires_cross_check: false,
        }),
      ]),
    );
  });

  it("запускает selective cross-check по branch verdict UNVERIFIED даже без explicit crossCheckRequired", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "agronomist",
      intent: "compute_deviations",
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.95,
      method: "tool_call_primary",
      reason: "explicit intent",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputeDeviations,
      payload: { fieldRef: "FIELD-8" },
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.ComputeDeviations,
            result: { summary: "Первичный расчёт без evidence." },
          },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Первичный расчёт без evidence.",
          structuredOutput: {
            confidence: 0.95,
            summary: "Без ссылок на источники.",
          },
          toolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              result: { summary: "Первичный расчёт без evidence." },
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
            result: { hits: 1, items: [{ content: "Подтверждение", score: 0.9 }] },
          },
        ],
        agentExecution: {
          role: "knowledge",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Knowledge cross-check подтвердил расчёт.",
          structuredOutput: {
            summary: "Knowledge cross-check подтвердил расчёт.",
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
              claim: "Подтверждение",
              sourceType: "DOC",
              sourceId: "doc-1",
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
    const buildResponseSpy = jest.spyOn(
      responseComposerService,
      "buildResponse",
    );

    await agent.orchestrate(
      {
        message: "проверь расчёт без evidence",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalledTimes(2);
    const composerExecution =
      buildResponseSpy.mock.calls[buildResponseSpy.mock.calls.length - 1]?.[0]
        ?.executionResult.agentExecution;
    expect(composerExecution?.structuredOutput).toEqual(
      expect.objectContaining({
        branchVerdict: "UNVERIFIED",
        trustCrossCheckTriggered: true,
        trustCrossCheckStatus: "completed",
      }),
    );
  });

  it("не запускает second-pass на happy path и пишет branch verdict в audit metadata", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "agronomist",
      intent: "compute_deviations",
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.95,
      method: "tool_call_primary",
      reason: "explicit intent",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputeDeviations,
      payload: { fieldRef: "FIELD-9" },
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.ComputeDeviations,
            result: { summary: "Подтверждённый расчёт." },
          },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Подтверждённый расчёт.",
          structuredOutput: {
            confidence: 0.95,
            summary: "Подтверждённый расчёт.",
          },
          toolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              result: { summary: "Подтверждённый расчёт." },
            },
          ],
          connectorCalls: [],
          evidence: [
            {
              claim: "Подтверждённый расчёт.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_deviations",
              confidenceScore: 0.95,
            },
          ],
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
      } as any);

    await agent.orchestrate(
      {
        message: "подтверждённый расчёт",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalledTimes(1);
    const auditMetadata =
      prismaServiceMock.aiAuditEntry.create.mock.calls[
        prismaServiceMock.aiAuditEntry.create.mock.calls.length - 1
      ]?.[0]?.data?.metadata;
    expect(auditMetadata).toEqual(
      expect.objectContaining({
        branchResults: expect.arrayContaining([
          expect.objectContaining({
            branch_id: "agronomist:primary",
          }),
        ]),
        branchTrustAssessments: expect.arrayContaining([
          expect.objectContaining({
            branch_id: "agronomist:primary",
            verdict: "VERIFIED",
            requires_cross_check: false,
          }),
        ]),
        phases: expect.arrayContaining([
          expect.objectContaining({
            name: "branch_trust_assessment",
          }),
        ]),
      }),
    );
  });

  it("строит semantic ingress frame для proof-slice crm.register_counterparty и пишет его в audit metadata", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "crm_agent",
      intent: "register_counterparty",
      toolName: RaiToolName.RegisterCounterparty,
      confidence: 0.82,
      method: "regex",
      reason: "responsibility:crm:register_counterparty",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.RegisterCounterparty,
      payload: {
        inn: "2636041493",
        jurisdictionCode: "RU",
        partyType: "LEGAL_ENTITY",
      },
    });
    semanticRouterMock.evaluate.mockResolvedValueOnce({
      semanticIntent: {
        domain: "crm",
        entity: "counterparty",
        action: "create",
        interactionMode: "write_candidate",
        mutationRisk: "side_effecting_write",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: {
          activeFlow: null,
          pendingClarificationKeys: [],
          lastUserAction: null,
        },
        resolvability: "resolved",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "crm_write_candidate",
      },
      routeDecision: {
        decisionType: "execute",
        recommendedExecutionMode: "direct_execute",
        eligibleTools: [],
        eligibleFlows: [],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      },
      candidateRoutes: [],
      divergence: {
        isMismatch: false,
        mismatchKinds: [],
        summary: "match",
        legacyRouteKey: "crm_agent:register_counterparty",
        semanticRouteKey: "crm:counterparty:create",
      },
      versionInfo: {
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        workspaceStateDigest: "digest",
      },
      latencyMs: 4,
      sliceId: null,
      promotedPrimary: false,
      executionPath: "semantic_router_shadow",
      requestedToolCalls: [
        {
          name: RaiToolName.RegisterCounterparty,
          payload: {
            inn: "2636041493",
            jurisdictionCode: "RU",
            partyType: "LEGAL_ENTITY",
          },
        },
      ],
      classification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.8,
        method: "semantic_router_shadow",
        reason: "crm_write_candidate",
      },
      routingContext: {
        source: "shadow",
        promotedPrimary: false,
        enforceCapabilityGating: false,
        sliceId: null,
        semanticIntent: {
          domain: "crm",
          entity: "counterparty",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "crm_write_candidate",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        candidateRoutes: [],
      },
      llmUsed: false,
      llmError: null,
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.RegisterCounterparty,
            result: { partyId: "party-1" },
          },
        ],
        agentExecution: {
          role: "crm_agent",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Контрагент зарегистрирован.",
          structuredOutput: {
            summary: "Контрагент зарегистрирован.",
            confidence: 0.82,
          },
          toolCalls: [
            {
              name: RaiToolName.RegisterCounterparty,
              result: { partyId: "party-1" },
            },
          ],
          connectorCalls: [],
          evidence: [
            {
              claim: "Регистрация контрагента подтверждена.",
              sourceType: "TOOL_RESULT",
              sourceId: "register_counterparty",
              confidenceScore: 0.95,
            },
          ],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.RegisterCounterparty],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "crm-v1",
          },
        },
      } as any);
    jest.spyOn(responseComposerService, "buildResponse").mockResolvedValueOnce({
      text: "Контрагент зарегистрирован.",
      widgets: [],
      evidence: [],
    } as any);

    await agent.orchestrate(
      {
        message: "Давай зарегим контрагента. ИНН 2636041493",
        workspaceContext: { route: "/parties" },
      },
      "company-1",
      "user-1",
    );

    const executionRequest = executeAgentSpy.mock.calls[0]?.[0];
    const actorContext = executeAgentSpy.mock.calls[0]?.[1];
    expect(executionRequest.semanticIngressFrame).toEqual(
      expect.objectContaining({
        interactionMode: "task_request",
        requestShape: "single_intent",
        proofSliceId: "crm.register_counterparty",
        operationAuthority: "direct_user_command",
        requestedOperation: expect.objectContaining({
          ownerRole: "crm_agent",
          intent: "register_counterparty",
          toolName: RaiToolName.RegisterCounterparty,
          source: "legacy_contracts",
        }),
        entities: expect.arrayContaining([
          expect.objectContaining({
            kind: "inn",
            value: "2636041493",
          }),
        ]),
      }),
    );
    expect(actorContext).toEqual(
      expect.objectContaining({
        userConfirmed: true,
        userIntentSource: "direct_user_command",
        writePolicy: expect.objectContaining({
          decision: "execute",
        }),
      }),
    );

    const auditMetadata =
      prismaServiceMock.aiAuditEntry.create.mock.calls[
        prismaServiceMock.aiAuditEntry.create.mock.calls.length - 1
      ]?.[0]?.data?.metadata;
    expect(auditMetadata).toEqual(
      expect.objectContaining({
        semanticIngressFrame: expect.objectContaining({
          proofSliceId: "crm.register_counterparty",
          requestedOperation: expect.objectContaining({
            intent: "register_counterparty",
          }),
        }),
      }),
    );
  });

  it("берет runtime role из semantic ingress frame раньше legacy classification", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValueOnce({
      targetRole: "crm_agent",
      intent: "register_counterparty",
      toolName: RaiToolName.RegisterCounterparty,
      confidence: 0.82,
      method: "regex",
      reason: "responsibility:crm:register_counterparty",
    });
    jest.spyOn((agent as any).semanticIngress, "buildFrame").mockReturnValueOnce({
      version: "v1",
      interactionMode: "free_chat",
      requestShape: "single_intent",
      domainCandidates: [],
      goal: "Привет",
      entities: [],
      requestedOperation: {
        ownerRole: "front_office_agent",
        intent: "classify_dialog_thread",
        toolName: RaiToolName.ClassifyDialogThread,
        decisionType: "execute",
        source: "legacy_contracts",
      },
      operationAuthority: "unknown",
      missingSlots: [],
      riskClass: "safe_read",
      requiresConfirmation: false,
      confidenceBand: "medium",
      explanation: "semantic-front-office",
      writePolicy: {
        decision: "execute",
        reason: "semantic_default_execute",
      },
      proofSliceId: null,
      compositePlan: null,
    } as any);

    const executeAgentSpy = jest.spyOn(agentRuntimeService, "executeAgent").mockResolvedValueOnce({
      executedTools: [],
      agentExecution: {
        role: "front_office_agent",
        status: "COMPLETED",
        executionPath: "tool_call_primary",
        text: "Принял: привет",
        structuredOutput: {
          summary: "Принял: привет",
          confidence: 0.35,
        },
        toolCalls: [],
        connectorCalls: [],
        evidence: [],
        validation: { passed: true, reasons: [] },
        fallbackUsed: false,
        outputContractVersion: "v1",
        auditPayload: {
          runtimeMode: "agent-first-hybrid",
          autonomyMode: "advisory",
          allowedToolNames: [RaiToolName.ClassifyDialogThread],
          blockedToolNames: [],
          connectorNames: [],
          outputContractId: "front-office-v1",
        },
      },
    } as any);
    jest.spyOn(responseComposerService, "buildResponse").mockResolvedValueOnce({
      text: "Принял: привет",
      widgets: [],
      evidence: [],
    } as any);

    await agent.orchestrate(
      {
        message: "привет",
        workspaceContext: { route: "/chat" },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalled();
    const executionRequest = executeAgentSpy.mock.calls[0]?.[0];
    const actorContext = executeAgentSpy.mock.calls[0]?.[1];
    expect(executionRequest?.role).toBe("front_office_agent");
    expect(actorContext).toEqual(
      expect.objectContaining({
        agentRole: "front_office_agent",
        userIntentSource: "unknown",
      }),
    );
  });

  it("не помечает explicit CRM tool-call как direct_user_command и оставляет governed confirmation boundary", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    semanticRouterMock.evaluate.mockResolvedValueOnce({
      semanticIntent: {
        domain: "crm",
        entity: "counterparty",
        action: "create",
        interactionMode: "write_candidate",
        mutationRisk: "side_effecting_write",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: {
          activeFlow: null,
          pendingClarificationKeys: [],
          lastUserAction: null,
        },
        resolvability: "resolved",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "crm_write_candidate",
      },
      routeDecision: {
        decisionType: "execute",
        recommendedExecutionMode: "direct_execute",
        eligibleTools: [],
        eligibleFlows: [],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      },
      candidateRoutes: [],
      divergence: {
        isMismatch: false,
        mismatchKinds: [],
        summary: "match",
        legacyRouteKey: "crm_agent:register_counterparty",
        semanticRouteKey: "crm:counterparty:create",
      },
      versionInfo: {
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        workspaceStateDigest: "digest",
      },
      latencyMs: 3,
      sliceId: null,
      promotedPrimary: false,
      executionPath: "semantic_router_shadow",
      requestedToolCalls: [],
      classification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 1,
        method: "semantic_router_shadow",
        reason: "crm_write_candidate",
      },
      routingContext: {
        source: "shadow",
        promotedPrimary: false,
        enforceCapabilityGating: false,
        sliceId: null,
        semanticIntent: {
          domain: "crm",
          entity: "counterparty",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "crm_write_candidate",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        candidateRoutes: [],
      },
      llmUsed: false,
      llmError: null,
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.RegisterCounterparty,
            result: { riskPolicyBlocked: true, actionId: "pa-77" },
          },
        ],
        agentExecution: {
          role: "crm_agent",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Ожидается подтверждение.",
          structuredOutput: {
            summary: "Создан PendingAction.",
            confidence: 1,
          },
          toolCalls: [
            {
              name: RaiToolName.RegisterCounterparty,
              result: { riskPolicyBlocked: true, actionId: "pa-77" },
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
            allowedToolNames: [RaiToolName.RegisterCounterparty],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "crm-v1",
          },
        },
      } as any);
    jest.spyOn(responseComposerService, "buildResponse").mockResolvedValueOnce({
      text: "Ожидается подтверждение.",
      widgets: [],
      evidence: [],
    } as any);

    await agent.orchestrate(
      {
        message: "",
        toolCalls: [
          {
            name: RaiToolName.RegisterCounterparty,
            payload: {
              inn: "2636041493",
              jurisdictionCode: "RU",
              partyType: "LEGAL_ENTITY",
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    const executionRequest = executeAgentSpy.mock.calls[0]?.[0];
    const actorContext = executeAgentSpy.mock.calls[0]?.[1];

    expect(executionRequest.semanticIngressFrame).toEqual(
      expect.objectContaining({
        proofSliceId: "crm.register_counterparty",
        operationAuthority: "delegated_or_autonomous",
        requiresConfirmation: true,
        requestedOperation: expect.objectContaining({
          source: "explicit_tool_call",
        }),
      }),
    );
    expect(actorContext).toEqual(
      expect.objectContaining({
        userConfirmed: false,
        userIntentSource: "delegated_or_autonomous",
      }),
    );
  });

  it("исполняет crm composite flow register_counterparty -> create_account -> open_workspace как staged workflow", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    semanticRouterMock.evaluate.mockResolvedValueOnce({
      semanticIntent: {
        domain: "crm",
        entity: "counterparty",
        action: "create",
        interactionMode: "write_candidate",
        mutationRisk: "side_effecting_write",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: {
          activeFlow: null,
          pendingClarificationKeys: [],
          lastUserAction: null,
        },
        resolvability: "resolved",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "crm_write_candidate",
      },
      routeDecision: {
        decisionType: "execute",
        recommendedExecutionMode: "direct_execute",
        eligibleTools: [],
        eligibleFlows: [],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      },
      candidateRoutes: [],
      divergence: {
        isMismatch: false,
        mismatchKinds: [],
        summary: "match",
        legacyRouteKey: "crm_agent:register_counterparty",
        semanticRouteKey: "crm:counterparty:create",
      },
      versionInfo: {
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        workspaceStateDigest: "digest",
      },
      latencyMs: 3,
      sliceId: null,
      promotedPrimary: false,
      executionPath: "semantic_router_shadow",
      requestedToolCalls: [],
      classification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 1,
        method: "semantic_router_shadow",
        reason: "crm_write_candidate",
      },
      routingContext: {
        source: "shadow",
        promotedPrimary: false,
        enforceCapabilityGating: false,
        sliceId: null,
        semanticIntent: {
          domain: "crm",
          entity: "counterparty",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "crm_write_candidate",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        candidateRoutes: [],
      },
      llmUsed: false,
      llmError: null,
    });

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.RegisterCounterparty,
            result: {
              created: true,
              source: "DADATA",
              partyId: "party-1",
              legalName: "ООО Ромашка",
              inn: "2636041493",
              jurisdictionCode: "RU",
              lookupStatus: "FOUND",
              alreadyExisted: false,
            },
          },
        ],
        agentExecution: {
          role: "crm_agent",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Контрагент зарегистрирован.",
          structuredOutput: {
            intent: "register_counterparty",
            data: {
              partyId: "party-1",
              legalName: "ООО Ромашка",
              inn: "2636041493",
            },
            confidence: 0.95,
          },
          toolCalls: [
            {
              name: RaiToolName.RegisterCounterparty,
              result: {
                created: true,
                source: "DADATA",
                partyId: "party-1",
                legalName: "ООО Ромашка",
                inn: "2636041493",
                jurisdictionCode: "RU",
                lookupStatus: "FOUND",
                alreadyExisted: false,
              },
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
            allowedToolNames: [RaiToolName.RegisterCounterparty],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "crm-v1",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.CreateCrmAccount,
            result: {
              accountId: "acc-1",
              name: "ООО Ромашка",
              inn: "2636041493",
              status: "ACTIVE",
              partyId: "party-1",
            },
          },
        ],
        agentExecution: {
          role: "crm_agent",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "CRM-аккаунт создан.",
          structuredOutput: {
            intent: "create_crm_account",
            data: {
              accountId: "acc-1",
              name: "ООО Ромашка",
              inn: "2636041493",
            },
            confidence: 0.92,
          },
          toolCalls: [
            {
              name: RaiToolName.CreateCrmAccount,
              result: {
                accountId: "acc-1",
                name: "ООО Ромашка",
                inn: "2636041493",
                status: "ACTIVE",
                partyId: "party-1",
              },
            },
          ],
          connectorCalls: [],
          evidence: [
            {
              claim: "CRM-аккаунт подтверждён.",
              sourceType: "TOOL_RESULT",
              sourceId: "create_crm_account",
              confidenceScore: 0.93,
            },
          ],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.CreateCrmAccount],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "crm-v1",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.GetCrmAccountWorkspace,
            result: {
              account: { id: "acc-1", name: "ООО Ромашка" },
              linkedParty: { id: "party-1", legalName: "ООО Ромашка" },
              legalEntities: [],
              contacts: [],
              interactions: [],
              obligations: [],
              documents: [],
              risks: [],
            },
          },
        ],
        agentExecution: {
          role: "crm_agent",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Карточка открыта.",
          structuredOutput: {
            intent: "review_account_workspace",
            data: {
              account: { id: "acc-1", name: "ООО Ромашка" },
            },
            confidence: 0.9,
          },
          toolCalls: [
            {
              name: RaiToolName.GetCrmAccountWorkspace,
              result: {
                account: { id: "acc-1", name: "ООО Ромашка" },
                linkedParty: { id: "party-1", legalName: "ООО Ромашка" },
                legalEntities: [],
                contacts: [],
                interactions: [],
                obligations: [],
                documents: [],
                risks: [],
              },
            },
          ],
          connectorCalls: [],
          evidence: [
            {
              claim: "Карточка workspace подтверждена.",
              sourceType: "TOOL_RESULT",
              sourceId: "get_crm_account_workspace",
              confidenceScore: 0.9,
            },
          ],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [RaiToolName.GetCrmAccountWorkspace],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "crm-v1",
          },
        },
      } as any);
    jest.spyOn(responseComposerService, "buildResponse").mockResolvedValueOnce({
      text: "CRM-композит выполнен.",
      widgets: [],
      evidence: [],
    } as any);

    await agent.orchestrate(
      {
        message:
          "Давай зарегим контрагента, потом создай аккаунт и открой карточку.",
        workspaceContext: { route: "/parties" },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalledTimes(3);

    const firstExecutionRequest = executeAgentSpy.mock.calls[0]?.[0];
    expect(firstExecutionRequest.semanticIngressFrame).toEqual(
      expect.objectContaining({
        requestShape: "composite",
        compositePlan: expect.objectContaining({
          leadOwnerAgent: "crm_agent",
          executionStrategy: "sequential",
        }),
      }),
    );

    const secondExecutionRequest = executeAgentSpy.mock.calls[1]?.[0];
    const thirdExecutionRequest = executeAgentSpy.mock.calls[2]?.[0];
    expect(secondExecutionRequest.requestedTools?.[0]?.name).toBe(
      RaiToolName.CreateCrmAccount,
    );
    expect(thirdExecutionRequest.requestedTools?.[0]?.name).toBe(
      RaiToolName.GetCrmAccountWorkspace,
    );

    const auditMetadata =
      prismaServiceMock.aiAuditEntry.create.mock.calls[
        prismaServiceMock.aiAuditEntry.create.mock.calls.length - 1
      ]?.[0]?.data?.metadata;
    expect(auditMetadata).toEqual(
      expect.objectContaining({
        semanticIngressFrame: expect.objectContaining({
          compositePlan: expect.objectContaining({
            workflowId: "crm.register_counterparty.create_account.open_workspace",
          }),
        }),
      }),
    );
  });

  it("исполняет agro execution fact -> finance cost aggregation как staged analytical workflow", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    intentRouterMock.classify.mockReturnValue({
      targetRole: "agronomist",
      intent: "compute_deviations",
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.82,
      method: "regex",
      reason: "responsibility:agro:compute_deviations",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValue(null);
    semanticRouterMock.evaluate.mockResolvedValueOnce({
      promotedPrimary: false,
      sliceId: null,
      requestedToolCalls: [],
      classification: {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.82,
        method: "semantic_router_shadow",
        reason: "agro_execution_fact",
      },
      semanticIntent: {
        domain: "agro",
        entity: "execution_fact",
        action: "read",
        interactionMode: "analysis",
        mutationRisk: "safe_read",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: {
          activeFlow: null,
          pendingClarificationKeys: [],
          lastUserAction: null,
        },
        resolvability: "resolved",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "agro_execution_fact",
      },
      routeDecision: {
        decisionType: "execute",
        recommendedExecutionMode: "direct_execute",
        eligibleTools: [],
        eligibleFlows: [],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      },
      candidateRoutes: [],
      divergence: {
        isMismatch: false,
        mismatchKinds: [],
        summary: "match",
        legacyRouteKey: "agronomist:compute_deviations",
        semanticRouteKey: "agro:execution_fact:read",
      },
      versionInfo: {
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        workspaceStateDigest: "digest",
      },
      latencyMs: 3,
      executionPath: "semantic_router_shadow",
      routingContext: {
        source: "shadow",
        promotedPrimary: false,
        enforceCapabilityGating: false,
        sliceId: null,
        semanticIntent: {
          domain: "agro",
          entity: "execution_fact",
          action: "read",
          interactionMode: "analysis",
          mutationRisk: "safe_read",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "agro_execution_fact",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        candidateRoutes: [],
      },
      llmUsed: false,
      llmError: null,
    } as any);

    const executeAgentSpy = jest
      .spyOn(agentRuntimeService, "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.ComputeDeviations,
            result: {
              seasonId: "season-2026",
              fieldId: "field-42",
              planned: 120,
              actual: 108,
              deviation: 12,
            },
          },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Агро execution fact подтвержден.",
          structuredOutput: {
            intent: "compute_deviations",
            scope: { seasonId: "season-2026", fieldId: "field-42" },
            branchVerdict: "VERIFIED",
            confidence: 0.95,
          },
          structuredOutputs: [
            {
              intent: "compute_deviations",
              scope: { seasonId: "season-2026", fieldId: "field-42" },
              branchVerdict: "VERIFIED",
              confidence: 0.95,
            },
          ],
          toolCalls: [],
          connectorCalls: [],
          evidence: [
            {
              claim: "Факт исполнения по агро-контексту подтвержден deterministic deviations.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_deviations",
              confidenceScore: 0.95,
            },
          ],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.ComputePlanFact,
            result: {
              planId: "plan-2026",
              roi: 12.4,
              ebitda: 870000,
            },
          },
        ],
        agentExecution: {
          role: "economist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Финансовая стоимость агрегирована.",
          structuredOutput: {
            intent: "compute_plan_fact",
            scope: { planId: "plan-2026", seasonId: "season-2026" },
            branchVerdict: "VERIFIED",
            confidence: 0.93,
          },
          structuredOutputs: [
            {
              intent: "compute_plan_fact",
              scope: { planId: "plan-2026", seasonId: "season-2026" },
              branchVerdict: "VERIFIED",
              confidence: 0.93,
            },
          ],
          toolCalls: [],
          connectorCalls: [],
          evidence: [
            {
              claim: "Финансовая стоимость агрегирована deterministic plan fact.",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_plan_fact",
              confidenceScore: 0.93,
            },
          ],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "economist-v1",
          },
        },
      } as any);
    const result = await agent.orchestrate(
      {
        message:
          "Собери agro execution fact -> finance cost aggregation по сезону.",
        workspaceContext: {
          route: "/consulting/dashboard",
          filters: {
            seasonId: "season-2026",
            planId: "plan-2026",
          },
          activeEntityRefs: [{ kind: WorkspaceEntityKind.field, id: "field-42" }],
        },
      },
      "company-1",
      "user-1",
    );

    expect(executeAgentSpy).toHaveBeenCalledTimes(2);
    expect(executeAgentSpy.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        role: "agronomist",
        semanticIngressFrame: expect.objectContaining({
          compositePlan: expect.objectContaining({
            workflowId: "agro.execution_fact.finance.cost_aggregation",
          }),
        }),
      }),
    );
    expect(executeAgentSpy.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        role: "economist",
      }),
    );
    expect(result.text).toContain("Составной аналитический сценарий выполнен");
    expect(result.workWindows?.some((window) => window.payload.intentId === "multi_source_aggregation")).toBe(true);
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
          evidence: [
            {
              claim: "legacy baseline",
              sourceType: "TOOL_RESULT",
              sourceId: "compute_deviations",
              confidenceScore: 0.9,
            },
          ],
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
    let truthfulnessMock: {
      calculateTraceTruthfulness: jest.Mock;
      buildBranchTrustInputs: jest.Mock;
    };
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
        buildBranchTrustInputs: jest.fn().mockImplementation((evidence: Array<{ sourceId?: string; confidenceScore?: number }>) => {
          const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
          return {
            classifiedEvidence: [],
            accounting: {
              total: hasEvidence ? evidence.length : 0,
              evidenced: hasEvidence ? evidence.length : 0,
              verified: hasEvidence ? evidence.length : 0,
              unverified: 0,
              invalid: 0,
            },
            totalWeight: hasEvidence ? evidence.length : 0,
            weightedEvidence: {
              verified: hasEvidence ? evidence.length : 0,
              unverified: 0,
              invalid: 0,
            },
            bsScorePct: hasEvidence ? 0 : null,
            evidenceCoveragePct: hasEvidence ? 100 : null,
            invalidClaimsPct: hasEvidence ? 0 : null,
            qualityStatus: hasEvidence ? "READY" : "PENDING_EVIDENCE",
            recommendedVerdict: hasEvidence ? "VERIFIED" : "UNVERIFIED",
            requiresCrossCheck: !hasEvidence,
            reasons: hasEvidence ? [] : ["no_evidence"],
          };
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
          { provide: SemanticRouterService, useValue: semanticRouterMock },
          SemanticIngressService,
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
        expect.objectContaining({
          bsScorePct: null,
          evidenceCoveragePct: null,
          invalidClaimsPct: null,
        }),
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
