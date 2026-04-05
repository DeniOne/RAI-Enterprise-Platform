import { Test, TestingModule } from "@nestjs/testing";
import { RaiChatService } from "./rai-chat.service";
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
import { RaiToolName } from "./tools/rai-tools.types";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { AgentExecutionAdapterService } from "./runtime/agent-execution-adapter.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { TechMapService } from "../tech-map/tech-map.service";
import { DeviationService } from "../consulting/deviation.service";
import { KpiService } from "../consulting/kpi.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RiskPolicyEngineService } from "./security/risk-policy-engine.service";
import { PendingActionService } from "./security/pending-action.service";
import { SensitiveDataFilterService } from "./security/sensitive-data-filter.service";
import { TraceSummaryService } from "./trace-summary.service";
import { AutonomyPolicyService } from "./autonomy-policy.service";
import { PerformanceMetricsService } from "./performance/performance-metrics.service";
import { QueueMetricsService } from "./performance/queue-metrics.service";
import { BudgetControllerService } from "./security/budget-controller.service";
import { IncidentOpsService } from "./incident-ops.service";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { AgentRegistryService } from "./agent-registry.service";
import { AgentRuntimeConfigService } from "./agent-runtime-config.service";
import { OpenRouterGatewayService } from "./agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "./agent-platform/agent-prompt-assembly.service";
import { RuntimeGovernanceControlService } from "./runtime/runtime-governance-control.service";
import { RuntimeGovernanceEventService } from "./runtime-governance/runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "./runtime-governance/runtime-governance-policy.service";
import { RuntimeGovernanceFeatureFlagsService } from "./runtime-governance/runtime-governance-feature-flags.service";
import { SemanticRouterService } from "./semantic-router/semantic-router.service";
import { SemanticIngressService } from "./semantic-ingress.service";
import { BranchSchedulerService } from "./planner/branch-scheduler.service";
import { BranchStatePlaneService } from "./branch-state-plane.service";

describe("RaiChatService", () => {
  let service: RaiChatService;
  const memoryAdapterMock = {
    store: jest.fn().mockResolvedValue(undefined),
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
    getTrustBudget: jest.fn().mockReturnValue({
      maxTrackedBranches: 6,
    }),
    resolveTrustLatencyBudgetMs: jest.fn().mockReturnValue(1500),
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
  const semanticRouterServiceMock = {
    evaluate: jest.fn().mockResolvedValue({
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
      latencyMs: 1,
      sliceId: null,
      promotedPrimary: false,
      executionPath: "semantic_route_shadow",
      requestedToolCalls: [],
      classification: {
        targetRole: null,
        intent: null,
        toolName: null,
        confidence: 0,
        method: "semantic_route_shadow",
        reason: "mock",
      },
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
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.RAI_CHAT_MEMORY_RECALL_TIMEOUT_MS;
    delete process.env.RAI_CHAT_MEMORY_TOP_K;
    delete process.env.RAI_CHAT_MEMORY_MIN_SIMILARITY;
    delete process.env.RAI_CHAT_MEMORY_APPEND_MAX_CHARS;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaiChatService,
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
        {
          provide: FrontOfficeToolsRegistry,
          useValue: {
            has: jest.fn((toolName: RaiToolName) =>
              [
                RaiToolName.LogDialogMessage,
                RaiToolName.ClassifyDialogThread,
                RaiToolName.CreateFrontOfficeEscalation,
              ].includes(toolName),
            ),
            execute: jest.fn(async (toolName: RaiToolName, payload: any) => {
              if (toolName === RaiToolName.LogDialogMessage) {
                return {
                  logged: true,
                  auditLogId: "audit-front-office-log",
                  threadKey: payload.threadExternalId ?? "thread-1",
                  channel: payload.channel,
                  direction: payload.direction,
                };
              }
              if (toolName === RaiToolName.ClassifyDialogThread) {
                return {
                  classification: /срочно|проблем/i.test(String(payload.messageText))
                    ? "escalation_signal"
                    : /нужно|сделай|заведи|передай/i.test(String(payload.messageText))
                      ? "task_process"
                      : "free_chat",
                  confidence: 0.65,
                  reasons: ["front-office-mock"],
                  targetOwnerRole: undefined,
                  needsEscalation: false,
                  threadKey: payload.threadExternalId ?? "thread-1",
                  anchorCandidates: {
                    farmRefs: [],
                    fieldIds: [],
                    seasonIds: [],
                    taskIds: [],
                  },
                  mustClarifications: [],
                  handoffSummary: `classification=free_chat | ${payload.messageText}`,
                };
              }
              return {
                created: true,
                auditLogId: "audit-front-office-escalation",
                classification: "escalation_signal",
                targetOwnerRole: "monitoring",
                summary: "handoff",
                threadKey: payload.threadExternalId ?? "thread-1",
              };
            }),
          },
        },
        { provide: ContractsToolsRegistry, useValue: { has: jest.fn().mockReturnValue(false), execute: jest.fn() } },
        AgroDeterministicEngineFacade,
        AgronomAgent,
        EconomistAgent,
        KnowledgeAgent,
        MonitoringAgent,
        { provide: CrmAgent, useValue: { run: jest.fn() } },
        {
          provide: FrontOfficeAgent,
          useValue: {
            run: jest.fn().mockResolvedValue({
              status: "COMPLETED",
              explain: "Принял: привет",
              data: { accepted: true },
              evidence: [],
              toolCallsCount: 0,
              fallbackUsed: false,
            }),
          },
        },
        { provide: ContractsAgent, useValue: { run: jest.fn() } },
        { provide: ChiefAgronomistAgent, useValue: { run: jest.fn() } },
        { provide: DataScientistAgent, useValue: { run: jest.fn() } },
        IntentRouterService,
        RaiToolsRegistry,
        RaiChatWidgetBuilder,
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
        { provide: TechMapService, useValue: { createDraftStub: jest.fn() } },
        { provide: DeviationService, useValue: { getActiveDeviations: jest.fn().mockResolvedValue([]) } },
        { provide: KpiService, useValue: { calculatePlanKPI: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            harvestPlan: { findFirst: jest.fn() },
            agroEscalation: { findMany: jest.fn().mockResolvedValue([]) },
            aiAuditEntry: { create: jest.fn().mockResolvedValue({}) },
            pendingAction: {
              create: jest.fn().mockResolvedValue({ id: "pa-1" }),
              findFirst: jest.fn().mockResolvedValue({
                id: "pa-1",
                companyId: "company-1",
                status: "APPROVED_FINAL",
                expiresAt: new Date(Date.now() + 3_600_000),
              }),
            },
          },
        },
        RiskPolicyEngineService,
        PendingActionService,
        { provide: SensitiveDataFilterService, useValue: { mask: (s: string) => s } },
        { provide: PerformanceMetricsService, useValue: { recordLatency: jest.fn().mockResolvedValue(undefined), recordError: jest.fn().mockResolvedValue(undefined) } },
        {
          provide: QueueMetricsService,
          useValue: {
            beginRuntimeExecution: jest.fn().mockResolvedValue(undefined),
            endRuntimeExecution: jest.fn().mockResolvedValue(undefined),
            getQueuePressure: jest.fn().mockResolvedValue({
              pressureState: "STABLE",
              signalFresh: true,
              totalBacklog: 1,
              hottestQueue: "runtime_active_tool_calls",
              observedQueues: [],
            }),
          },
        },
        { provide: BudgetControllerService, useValue: { evaluateRuntimeBudget: jest.fn().mockResolvedValue({ outcome: "ALLOW", reason: "WITHIN_BUDGET", source: "agent_registry_max_tokens", estimatedTokens: 0, budgetLimit: null, allowedToolNames: [], droppedToolNames: [], ownerRoles: [] }) } },
        { provide: IncidentOpsService, useValue: { logIncident: jest.fn() } },
        { provide: TraceSummaryService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
        { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
        {
          provide: TruthfulnessEngineService,
          useValue: {
            calculateTraceTruthfulness: jest
              .fn()
              .mockResolvedValue({
                bsScorePct: 0,
                evidenceCoveragePct: 0,
                invalidClaimsPct: 0,
              }),
            buildBranchTrustInputs: jest.fn().mockReturnValue({
              accounting: { total: 0, verified: 0, conflicting: 0, missing: 0 },
              evidenceCoveragePct: 0,
              invalidClaimsPct: 0,
              reasons: [],
            }),
          },
        },
        {
          provide: AgentRegistryService,
          useValue: {
            getEffectiveKernel: jest.fn().mockResolvedValue({
              definition: { defaultAutonomyMode: "advisory" },
              outputContract: {
                responseSchemaVersion: "v1",
                contractId: "knowledge-v1",
                requiresEvidence: false,
                requiresDeterministicValidation: false,
              },
              runtimeProfile: { model: "openrouter/test", provider: "openrouter" },
              toolBindings: [
                {
                  toolName: RaiToolName.WorkspaceSnapshot,
                  isEnabled: true,
                  requiresHumanGate: false,
                  riskLevel: "READ",
                },
                {
                  toolName: RaiToolName.EchoMessage,
                  isEnabled: true,
                  requiresHumanGate: false,
                  riskLevel: "READ",
                },
                {
                  toolName: RaiToolName.LogDialogMessage,
                  isEnabled: true,
                  requiresHumanGate: false,
                  riskLevel: "READ",
                },
                {
                  toolName: RaiToolName.ClassifyDialogThread,
                  isEnabled: true,
                  requiresHumanGate: false,
                  riskLevel: "READ",
                },
                {
                  toolName: RaiToolName.CreateFrontOfficeEscalation,
                  isEnabled: true,
                  requiresHumanGate: true,
                  riskLevel: "WRITE",
                },
                {
                  toolName: RaiToolName.QueryKnowledge,
                  isEnabled: true,
                  requiresHumanGate: false,
                  riskLevel: "READ",
                },
              ],
              connectorBindings: [],
              isActive: true,
            }),
            getRegistry: jest.fn().mockResolvedValue([]),
            getEffectiveAgent: jest.fn().mockResolvedValue(null),
          },
        },
        AgentRuntimeConfigService,
        { provide: OpenRouterGatewayService, useValue: { generate: jest.fn().mockRejectedValue(new Error("OPENROUTER_API_KEY_MISSING")) } },
        AgentPromptAssemblyService,
        { provide: RuntimeGovernanceEventService, useValue: runtimeGovernanceEventServiceMock },
        { provide: RuntimeGovernancePolicyService, useValue: runtimeGovernancePolicyServiceMock },
        { provide: RuntimeGovernanceFeatureFlagsService, useValue: runtimeGovernanceFeatureFlagsServiceMock },
        { provide: SemanticRouterService, useValue: semanticRouterServiceMock },
        SemanticIngressService,
        BranchSchedulerService,
        BranchStatePlaneService,
      ],
    }).compile();

    service = module.get(RaiChatService);
    module.get(AgroToolsRegistry).onModuleInit();
    module.get(FinanceToolsRegistry).onModuleInit();
    module.get(RiskToolsRegistry).onModuleInit();
    module.get(KnowledgeToolsRegistry).onModuleInit();
    module.get(RaiToolsRegistry).onModuleInit();
  });

  it("returns typed suggested actions and suppresses legacy widgets in agentExecution path", async () => {
    const result = await service.handleChat(
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
    );

    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: RaiToolName.EchoMessage,
        }),
        expect.objectContaining({
          toolName: RaiToolName.WorkspaceSnapshot,
        }),
      ]),
    );

    expect(result.widgets).toEqual([]);

    expect(result.toolCalls).toEqual(expect.any(Array));
    expect(result.toolCalls.length).toBeGreaterThan(0);
    expect(result.traceId).toEqual(expect.stringMatching(/^tr_/));
    expect(result.threadId).toEqual(expect.stringMatching(/^th_/));
    expect(result.openUiToken).toBeUndefined();
  });

  it("интегрируется с памятью: вызывает retrieve и store", async () => {
    memoryAdapterMock.retrieve.mockResolvedValue({
      items: [
        {
          id: "m1",
          content: "Вчера мы обсуждали урожай редьки",
          similarity: 0.88,
          outcome: "POSITIVE",
          confidence: 0.9,
          metadata: {},
        },
      ],
    });

    const result = await service.handleChat(
      {
        message: "Что мы обсуждали?",
        threadId: "thread-123",
      },
      "company-1",
    );

    // Проверяем вызов retrieve
    expect(memoryAdapterMock.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
      }),
      expect.any(Array),
      expect.any(Object),
    );

    // Проверяем вызов appendInteraction
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        sessionId: "thread-123",
      }),
      expect.objectContaining({
        userMessage: "Что мы обсуждали?",
      }),
    );

    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("строго соблюдает изоляцию по companyId", async () => {
    const maliciousRequest = {
      message: "Дай чужие данные",
      // Допустим, злоумышленник пытается подменить компанию в метаданных (если бы мы их брали оттуда)
      metadata: { companyId: "other-company" },
    };

    await service.handleChat(maliciousRequest as any, "trusted-company-id");

    // Проверяем, что в память ушло правильное ID
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "trusted-company-id",
      }),
      expect.any(Object),
    );

    // И в поиск тоже
    expect(memoryAdapterMock.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "trusted-company-id",
      }),
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("fail-open: таймаут retrieval не ломает чат", async () => {
    process.env.RAI_CHAT_MEMORY_RECALL_TIMEOUT_MS = "1";
    memoryAdapterMock.retrieve.mockImplementation(
      () => new Promise(() => { }),
    );

    const result = await service.handleChat(
      {
        message: "привет",
      },
      "company-1",
    );

    expect(result.text).toContain("Принял: привет");
    expect(result.text).not.toContain("Контекст из памяти:");
  });

  it("не пишет секреты в память (denylist)", async () => {
    await service.handleChat(
      {
        message: "my password=12345 please store",
      },
      "company-1",
    );

    expect(memoryAdapterMock.appendInteraction).not.toHaveBeenCalled();
  });

  it("прогоняет путь signal -> advisory -> feedback -> memory append", async () => {
    externalSignalsServiceMock.process.mockResolvedValue({
      advisory: {
        traceId: "trace-ext-1",
        recommendation: "REVIEW",
        confidence: 0.81,
        summary: "Нужна ручная проверка",
        explainability: {
          traceId: "trace-ext-1",
          why: "score=-0.4000; NDVI указывает на просадку; погода добавляет риск",
          factors: [{ name: "ndvi", value: 0.31, direction: "NEGATIVE" }],
          sources: [
            {
              kind: "ndvi",
              source: "sentinel2",
              observedAt: "2026-03-02T10:00:00.000Z",
              entityRef: "field-1",
              provenance: "sentinel-pass",
            },
          ],
        },
      },
      feedbackStored: true,
    });

    const result = await service.handleChat(
      {
        message: "Проверь внешние сигналы",
        threadId: "thread-ext-1",
        externalSignals: [
          {
            id: "sig-1",
            kind: "ndvi" as any,
            source: "sentinel2" as any,
            observedAt: "2026-03-02T10:00:00.000Z",
            entityRef: "field-1",
            value: 0.31,
            confidence: 0.82,
            provenance: "sentinel-pass",
          },
        ],
        advisoryFeedback: {
          decision: "accept",
          reason: "Подтверждаю ручную проверку",
        },
      },
      "company-1",
    );

    expect(externalSignalsServiceMock.process).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        threadId: "thread-ext-1",
      }),
    );
    expect(result.advisory).toEqual(
      expect.objectContaining({
        recommendation: "REVIEW",
      }),
    );
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("не поднимает legacy widgets при смене route и companyId в agentExecution path", async () => {
    const executionResult = await service.handleChat(
      {
        message: "Проверь исполнение",
        workspaceContext: {
          route: "/consulting/execution/manager",
          lastUserAction: "open-manager",
          selectedRowSummary: {
            kind: "operation",
            id: "op-1",
            title: "Опрыскивание 12",
          },
        },
      },
      "company-AB12",
    );

    const dashboardResult = await service.handleChat(
      {
        message: "Покажи дашборд",
        workspaceContext: {
          route: "/consulting/dashboard",
        },
      },
      "company-ZX99",
    );

    expect(executionResult.widgets).toEqual([]);
    expect(dashboardResult.widgets).toEqual([]);
  });
});
