import { Test, TestingModule } from "@nestjs/testing";
import { SystemIncidentType } from "@rai/prisma-client";
import { SupervisorAgent } from "../supervisor-agent.service";
import { IntentRouterService } from "../intent-router/intent-router.service";
import { MemoryCoordinatorService } from "../memory/memory-coordinator.service";
import { AgentRuntimeService } from "./agent-runtime.service";
import { SupervisorForensicsService } from "../supervisor-forensics.service";
import { ResponseComposerService } from "../composer/response-composer.service";
import { ExternalSignalsService } from "../external-signals.service";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import { TraceSummaryService } from "../trace-summary.service";
import { TruthfulnessEngineService } from "../truthfulness-engine.service";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { AgroToolsRegistry } from "../tools/agro-tools.registry";
import { FinanceToolsRegistry } from "../tools/finance-tools.registry";
import { RiskToolsRegistry } from "../tools/risk-tools.registry";
import { KnowledgeToolsRegistry } from "../tools/knowledge-tools.registry";
import { CrmToolsRegistry } from "../tools/crm-tools.registry";
import { FrontOfficeToolsRegistry } from "../tools/front-office-tools.registry";
import { ContractsToolsRegistry } from "../tools/contracts-tools.registry";
import { RiskPolicyEngineService } from "../security/risk-policy-engine.service";
import { PendingActionService } from "../security/pending-action.service";
import { AutonomyPolicyService } from "../autonomy-policy.service";
import { AgentRuntimeConfigService } from "../agent-runtime-config.service";
import { AgentRegistryService } from "../agent-registry.service";
import { IncidentOpsService } from "../incident-ops.service";
import { BudgetControllerService } from "../security/budget-controller.service";
import { PerformanceMetricsService } from "../performance/performance-metrics.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { RaiToolName } from "../tools/rai-tools.types";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { DeviationService } from "../../consulting/deviation.service";
import { TechMapService } from "../../tech-map/tech-map.service";
import { KpiService } from "../../consulting/kpi.service";
import { TechMapBudgetService } from "../../tech-map/economics/tech-map-budget.service";
import { AgroDeterministicEngineFacade } from "../deterministic/agro-deterministic.facade";
import { AgronomAgent } from "../agents/agronom-agent.service";
import { EconomistAgent } from "../agents/economist-agent.service";
import { KnowledgeAgent } from "../agents/knowledge-agent.service";
import { MonitoringAgent } from "../agents/monitoring-agent.service";
import { CrmAgent } from "../agents/crm-agent.service";
import { FrontOfficeAgent } from "../agents/front-office-agent.service";
import { ContractsAgent } from "../agents/contracts-agent.service";
import { ChiefAgronomistAgent } from "../agents/chief-agronomist-agent.service";
import { DataScientistAgent } from "../agents/data-scientist-agent.service";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import { AgentExecutionAdapterService } from "./agent-execution-adapter.service";
import { RuntimeGovernanceControlService } from "./runtime-governance-control.service";
import { RuntimeGovernanceEventService } from "../runtime-governance/runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "../runtime-governance/runtime-governance-policy.service";
import { RuntimeGovernanceFeatureFlagsService } from "../runtime-governance/runtime-governance-feature-flags.service";
import { SemanticRouterService } from "../semantic-router/semantic-router.service";
import { SemanticIngressService } from "../semantic-ingress.service";
import { BranchSchedulerService } from "../planner/branch-scheduler.service";
import { BranchStatePlaneService } from "../branch-state-plane.service";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import type { CompositeWorkflowStageContract } from "../../../shared/rai-chat/composite-orchestration.types";
import { DecisionType } from "../../../shared/rai-chat/semantic-routing.types";
import { ConfidenceBand } from "../../../shared/rai-chat/semantic-routing.types";

type JsonRecord = Record<string, unknown>;

interface InMemoryPrismaState {
  agentConfigurations: Array<JsonRecord>;
  agentCapabilityBindings: Array<JsonRecord>;
  agentToolBindings: Array<JsonRecord>;
  agentConnectorBindings: Array<JsonRecord>;
  aiAuditEntries: Array<JsonRecord>;
  traceSummaries: Array<JsonRecord>;
  systemIncidents: Array<JsonRecord>;
  pendingActions: Array<JsonRecord>;
  qualityAlerts: Array<JsonRecord>;
  autonomyOverrides: Array<JsonRecord>;
  harvestPlans: Array<JsonRecord>;
  agroEscalations: Array<JsonRecord>;
}

const flushAsync = async () => {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

const sortByCreatedAtDesc = (rows: Array<JsonRecord>) =>
  [...rows].sort(
    (left, right) =>
      new Date(String(right.createdAt)).getTime() -
      new Date(String(left.createdAt)).getTime(),
  );

const matchesWhere = (row: JsonRecord, where: JsonRecord | undefined): boolean => {
  if (!where) {
    return true;
  }

  return Object.entries(where).every(([key, expected]) => {
    const actual = row[key];

    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const record = expected as JsonRecord;
      if ("in" in record && Array.isArray(record.in)) {
        return record.in.includes(actual);
      }
      if ("gte" in record) {
        return new Date(String(actual)).getTime() >= new Date(String(record.gte)).getTime();
      }
      if ("not" in record) {
        return actual !== record.not;
      }
      return matchesWhere((actual as JsonRecord) ?? {}, record);
    }

    return actual === expected;
  });
};

const createPrismaMock = (state: InMemoryPrismaState) => ({
  agentConfiguration: {
    findMany: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.agentConfigurations.filter((row) => matchesWhere(row, where)),
    ),
    findUnique: jest.fn(
      async ({
        where,
      }: {
        where: {
          agent_config_role_company_unique: {
            role: string;
            companyId: string | null;
          };
        };
      }) =>
        state.agentConfigurations.find(
          (row) =>
            row.role === where.agent_config_role_company_unique.role &&
            row.companyId === where.agent_config_role_company_unique.companyId,
        ) ?? null,
    ),
  },
  agentCapabilityBinding: {
    findMany: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.agentCapabilityBindings.filter((row) => matchesWhere(row, where)),
    ),
  },
  agentToolBinding: {
    findMany: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.agentToolBindings.filter((row) => matchesWhere(row, where)),
    ),
  },
  agentConnectorBinding: {
    findMany: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.agentConnectorBindings.filter((row) => matchesWhere(row, where)),
    ),
  },
  aiAuditEntry: {
    create: jest.fn(async ({ data }: { data: JsonRecord }) => {
      const entry = {
        id: `audit-${state.aiAuditEntries.length + 1}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      state.aiAuditEntries.push(entry);
      return entry;
    }),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
      state.aiAuditEntries.find((row) => row.id === where.id) ?? null,
    ),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: JsonRecord }) => {
      const entry = state.aiAuditEntries.find((row) => row.id === where.id);
      if (!entry) {
        throw new Error(`AiAuditEntry ${where.id} not found`);
      }
      Object.assign(entry, data);
      return entry;
    }),
  },
  traceSummary: {
    upsert: jest.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { trace_summary_trace_company_unique: { traceId: string; companyId: string } };
        create: JsonRecord;
        update: JsonRecord;
      }) => {
        const target = state.traceSummaries.find(
          (row) =>
            row.traceId === where.trace_summary_trace_company_unique.traceId &&
            row.companyId === where.trace_summary_trace_company_unique.companyId,
        );
        if (target) {
          Object.assign(target, update);
          return target;
        }
        const row = {
          id: `trace-${state.traceSummaries.length + 1}`,
          createdAt: new Date().toISOString(),
          ...create,
        };
        state.traceSummaries.push(row);
        return row;
      },
    ),
    update: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { trace_summary_trace_company_unique: { traceId: string; companyId: string } };
        data: JsonRecord;
      }) => {
        const target = state.traceSummaries.find(
          (row) =>
            row.traceId === where.trace_summary_trace_company_unique.traceId &&
            row.companyId === where.trace_summary_trace_company_unique.companyId,
        );
        if (!target) {
          throw new Error("TraceSummary not found");
        }
        Object.assign(target, data);
        return target;
      },
    ),
    findMany: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.traceSummaries.filter((row) => matchesWhere(row, where)),
    ),
  },
  systemIncident: {
    create: jest.fn(async ({ data }: { data: JsonRecord }) => {
      const row = {
        id: `incident-${state.systemIncidents.length + 1}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      state.systemIncidents.push(row);
      return row;
    }),
    findMany: jest.fn(async ({ where, take, skip }: { where?: JsonRecord; take?: number; skip?: number }) => {
      const rows = sortByCreatedAtDesc(
        state.systemIncidents.filter((row) => matchesWhere(row, where)),
      );
      return rows.slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
    }),
  },
  pendingAction: {
    create: jest.fn(async ({ data }: { data: JsonRecord }) => {
      const row = { id: `pa-${state.pendingActions.length + 1}`, ...data };
      state.pendingActions.push(row);
      return row;
    }),
    findFirst: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.pendingActions.find((row) => matchesWhere(row, where)) ?? null,
    ),
  },
  qualityAlert: {
    findFirst: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.qualityAlerts.find((row) => matchesWhere(row, where)) ?? null,
    ),
  },
  autonomyOverride: {
    findFirst: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.autonomyOverrides.find((row) => matchesWhere(row, where)) ?? null,
    ),
  },
  harvestPlan: {
    findFirst: jest.fn(async ({ where, orderBy }: { where?: JsonRecord; orderBy?: JsonRecord }) => {
      let rows = state.harvestPlans.filter((row) => matchesWhere(row, where));
      if (orderBy?.createdAt === "desc") {
        rows = sortByCreatedAtDesc(rows);
      }
      return rows[0] ?? null;
    }),
  },
  agroEscalation: {
    findMany: jest.fn(async ({ where, take }: { where?: JsonRecord; take?: number }) =>
      state.agroEscalations.filter((row) => matchesWhere(row, where)).slice(0, take ?? 20),
    ),
  },
});

const baseRegistryState = (): InMemoryPrismaState => ({
  agentConfigurations: [
    {
      id: "cfg-global-agro",
      role: "agronomist",
      companyId: null,
      systemPrompt: "global agro",
      llmModel: "gpt-4o",
      maxTokens: 16000,
      capabilities: ["AgroToolsRegistry"],
      isActive: true,
    },
    {
      id: "cfg-global-economist",
      role: "economist",
      companyId: null,
      systemPrompt: "global economist",
      llmModel: "gpt-4o-mini",
      maxTokens: 8000,
      capabilities: ["FinanceToolsRegistry"],
      isActive: true,
    },
    {
      id: "cfg-global-knowledge",
      role: "knowledge",
      companyId: null,
      systemPrompt: "global knowledge",
      llmModel: "gpt-4o-mini",
      maxTokens: 4000,
      capabilities: ["KnowledgeToolsRegistry"],
      isActive: true,
    },
    {
      id: "cfg-global-monitoring",
      role: "monitoring",
      companyId: null,
      systemPrompt: "global monitoring",
      llmModel: "gpt-4o-mini",
      maxTokens: 4000,
      capabilities: ["RiskToolsRegistry"],
      isActive: true,
    },
  ],
  agentCapabilityBindings: [
    { role: "agronomist", companyId: null, capability: "AgroToolsRegistry", isEnabled: true },
    { role: "economist", companyId: null, capability: "FinanceToolsRegistry", isEnabled: true },
    { role: "knowledge", companyId: null, capability: "KnowledgeToolsRegistry", isEnabled: true },
    { role: "monitoring", companyId: null, capability: "RiskToolsRegistry", isEnabled: true },
  ],
  agentToolBindings: [
    { role: "agronomist", companyId: null, toolName: RaiToolName.ComputeDeviations, isEnabled: true },
    { role: "agronomist", companyId: null, toolName: RaiToolName.GenerateTechMapDraft, isEnabled: true },
    { role: "economist", companyId: null, toolName: RaiToolName.ComputePlanFact, isEnabled: true },
    { role: "economist", companyId: null, toolName: RaiToolName.SimulateScenario, isEnabled: true },
    { role: "economist", companyId: null, toolName: RaiToolName.ComputeRiskAssessment, isEnabled: true },
    { role: "knowledge", companyId: null, toolName: RaiToolName.QueryKnowledge, isEnabled: true },
    { role: "monitoring", companyId: null, toolName: RaiToolName.EmitAlerts, isEnabled: true },
    { role: "monitoring", companyId: null, toolName: RaiToolName.GetWeatherForecast, isEnabled: true },
  ],
  agentConnectorBindings: [],
  aiAuditEntries: [],
  traceSummaries: [],
  systemIncidents: [],
  pendingActions: [],
  qualityAlerts: [],
  autonomyOverrides: [],
  harvestPlans: [
    {
      id: "plan-1",
      companyId: "company-1",
      seasonId: "season-1",
      status: "ACTIVE",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
  ],
  agroEscalations: [],
});

describe("Runtime spine integration", () => {
  let moduleRef: TestingModule;
  let supervisor: SupervisorAgent;
  let prismaState: InMemoryPrismaState;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  const memoryAdapterMock = {
    retrieve: jest.fn(),
    appendInteraction: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };
  const deviationServiceMock = {
    getActiveDeviations: jest.fn(),
  };
  const techMapServiceMock = {
    createDraftStub: jest.fn(),
  };
  const kpiServiceMock = {
    calculatePlanKPI: jest.fn(),
  };
  const externalSignalsServiceMock = {
    process: jest.fn(),
  };
  const truthfulnessEngineMock = {
    calculateTraceTruthfulness: jest.fn(),
    buildBranchTrustInputs: jest.fn(),
  };
  const performanceMetricsMock = {
    recordLatency: jest.fn(),
    recordError: jest.fn(),
  };
  const queueMetricsMock = {
    beginRuntimeExecution: jest.fn(),
    endRuntimeExecution: jest.fn(),
    getQueuePressure: jest.fn(),
  };
  const techMapBudgetMock = {
    calculateBudget: jest.fn(),
  };
  const openRouterGatewayMock = {
    generate: jest.fn().mockRejectedValue(new Error("OPENROUTER_API_KEY_MISSING")),
  };
  const agentPromptAssemblyMock = {
    buildMessages: jest.fn().mockReturnValue([]),
  };
  const crmAgentMock = { run: jest.fn() };
  const frontOfficeAgentMock = { run: jest.fn() };
  const contractsAgentMock = { run: jest.fn() };
  const chiefAgronomistAgentMock = { run: jest.fn() };
  const dataScientistAgentMock = { run: jest.fn() };
  const runtimeGovernanceEventsMock = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const runtimeGovernancePolicyMock = {
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
    getTrustBudget: jest.fn().mockReturnValue({
      maxTrackedBranches: 4,
      maxCrossCheckBranches: 1,
      latencyBudgetMs: {
        happyPathMs: 300,
        multiSourceReadMs: 800,
        crossCheckTriggeredMs: 1_500,
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
  const disabledToolsRegistryMock = {
    has: jest.fn().mockReturnValue(false),
    execute: jest.fn(),
  };
  const runtimeGovernanceFeatureFlagsMock = {
    getFlags: jest.fn().mockReturnValue({
      enforcementEnabled: true,
      queueFallbackEnabled: true,
      queueFallbackShadowMode: false,
      emergencyKillSwitch: false,
    }),
  };
  const semanticRouterMock = {
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

  const buildModule = async () => {
    prismaState = baseRegistryState();
    prismaMock = createPrismaMock(prismaState);

    memoryAdapterMock.retrieve.mockResolvedValue({
      traceId: "trace-memory",
      total: 0,
      positive: 0,
      negative: 0,
      unknown: 0,
      items: [],
    });
    memoryAdapterMock.appendInteraction.mockResolvedValue(undefined);
    memoryAdapterMock.getProfile.mockResolvedValue({
      lastMessagePreview: "Справка по севообороту",
    });
    memoryAdapterMock.updateProfile.mockResolvedValue(undefined);
    deviationServiceMock.getActiveDeviations.mockResolvedValue([
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
    techMapServiceMock.createDraftStub.mockResolvedValue({
      draftId: "draft-1",
      status: "DRAFT",
      fieldRef: "field-1",
      seasonRef: "season-1",
      crop: "rapeseed",
      missingMust: [],
      tasks: [],
      assumptions: [],
    });
    kpiServiceMock.calculatePlanKPI.mockResolvedValue({
      hasData: true,
      roi: 12,
      ebitda: 100,
      revenue: 200,
      totalActualCost: 50,
      totalPlannedCost: 40,
    });
    externalSignalsServiceMock.process.mockResolvedValue({
      advisory: undefined,
      feedbackStored: false,
    });
    truthfulnessEngineMock.calculateTraceTruthfulness.mockResolvedValue({
      bsScorePct: 4,
      evidenceCoveragePct: 100,
      invalidClaimsPct: 0,
    });
    truthfulnessEngineMock.buildBranchTrustInputs.mockImplementation(() => ({
      classifiedEvidence: [],
      accounting: {
        total: 1,
        evidenced: 1,
        verified: 1,
        unverified: 0,
        invalid: 0,
      },
      totalWeight: 1,
      weightedEvidence: {
        verified: 1,
        unverified: 0,
        invalid: 0,
      },
      bsScorePct: 0,
      evidenceCoveragePct: 100,
      invalidClaimsPct: 0,
      qualityStatus: "READY",
      recommendedVerdict: "VERIFIED",
      requiresCrossCheck: false,
      reasons: [],
    }));
    performanceMetricsMock.recordLatency.mockResolvedValue(undefined);
    performanceMetricsMock.recordError.mockResolvedValue(undefined);
    queueMetricsMock.beginRuntimeExecution.mockResolvedValue(undefined);
    queueMetricsMock.endRuntimeExecution.mockResolvedValue(undefined);
    queueMetricsMock.getQueuePressure.mockResolvedValue({
      pressureState: "STABLE",
      signalFresh: true,
      totalBacklog: 1,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [],
    });
    techMapBudgetMock.calculateBudget.mockResolvedValue({
      totalActual: 0,
      totalPlanned: 0,
    });

    moduleRef = await Test.createTestingModule({
      providers: [
        SupervisorAgent,
        IntentRouterService,
        MemoryCoordinatorService,
        AgentRuntimeService,
        SupervisorForensicsService,
        AgentExecutionAdapterService,
        RuntimeGovernanceControlService,
        ResponseComposerService,
        RaiChatWidgetBuilder,
        TraceSummaryService,
        RaiToolsRegistry,
        AgroToolsRegistry,
        AgroDeterministicEngineFacade,
        FinanceToolsRegistry,
        RiskToolsRegistry,
        KnowledgeToolsRegistry,
        { provide: CrmToolsRegistry, useValue: disabledToolsRegistryMock },
        { provide: FrontOfficeToolsRegistry, useValue: disabledToolsRegistryMock },
        { provide: ContractsToolsRegistry, useValue: disabledToolsRegistryMock },
        AgronomAgent,
        EconomistAgent,
        KnowledgeAgent,
        MonitoringAgent,
        { provide: CrmAgent, useValue: crmAgentMock },
        { provide: FrontOfficeAgent, useValue: frontOfficeAgentMock },
        { provide: ContractsAgent, useValue: contractsAgentMock },
        { provide: ChiefAgronomistAgent, useValue: chiefAgronomistAgentMock },
        { provide: DataScientistAgent, useValue: dataScientistAgentMock },
        RiskPolicyEngineService,
        PendingActionService,
        AutonomyPolicyService,
        AgentRuntimeConfigService,
        AgentRegistryService,
        IncidentOpsService,
        BudgetControllerService,
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
        { provide: TruthfulnessEngineService, useValue: truthfulnessEngineMock },
        { provide: SensitiveDataFilterService, useValue: { mask: (value: string) => value } },
        { provide: PerformanceMetricsService, useValue: performanceMetricsMock },
        { provide: QueueMetricsService, useValue: queueMetricsMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
        { provide: DeviationService, useValue: deviationServiceMock },
        { provide: TechMapService, useValue: techMapServiceMock },
        { provide: KpiService, useValue: kpiServiceMock },
        { provide: TechMapBudgetService, useValue: techMapBudgetMock },
        { provide: OpenRouterGatewayService, useValue: openRouterGatewayMock },
        { provide: AgentPromptAssemblyService, useValue: agentPromptAssemblyMock },
        { provide: RuntimeGovernanceEventService, useValue: runtimeGovernanceEventsMock },
        { provide: RuntimeGovernancePolicyService, useValue: runtimeGovernancePolicyMock },
        { provide: RuntimeGovernanceFeatureFlagsService, useValue: runtimeGovernanceFeatureFlagsMock },
        { provide: SemanticRouterService, useValue: semanticRouterMock },
        SemanticIngressService,
        BranchSchedulerService,
        BranchStatePlaneService,
      ],
    }).compile();

    supervisor = moduleRef.get(SupervisorAgent);
    moduleRef.get(AgroToolsRegistry).onModuleInit();
    moduleRef.get(FinanceToolsRegistry).onModuleInit();
    moduleRef.get(RiskToolsRegistry).onModuleInit();
    moduleRef.get(KnowledgeToolsRegistry).onModuleInit();
    moduleRef.get(RaiToolsRegistry).onModuleInit();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await buildModule();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it("проходит happy-path через Supervisor -> Runtime -> Registry -> Audit/Trace", async () => {
    const response = await supervisor.orchestrate(
      {
        message: "Покажи отклонения по полю",
        toolCalls: [
          {
            name: RaiToolName.ComputeDeviations,
            payload: {
              scope: { seasonId: "season-1", fieldId: "field-1" },
            },
          },
        ],
        workspaceContext: {
          route: "/consulting/fields",
        },
      },
      "company-1",
      "user-1",
    );

    await flushAsync();

    expect(response.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputeDeviations,
        }),
      ]),
    );
    expect(deviationServiceMock.getActiveDeviations).toHaveBeenCalledWith({
      companyId: "company-1",
    });
    expect(prismaState.traceSummaries).toHaveLength(1);
    expect(prismaState.traceSummaries[0]).toMatchObject({
      companyId: "company-1",
      bsScorePct: 4,
      evidenceCoveragePct: 100,
      invalidClaimsPct: 0,
    });
    expect(prismaState.aiAuditEntries).toHaveLength(1);
    expect(prismaState.aiAuditEntries[0]).toMatchObject({
      companyId: "company-1",
      traceId: response.traceId,
      toolNames: [RaiToolName.ComputeDeviations],
    });
    expect(
      Array.isArray(
        ((prismaState.aiAuditEntries[0].metadata as JsonRecord).phases as unknown[]),
      ),
    ).toBe(true);
  });

  it("пишет cross-check trust telemetry в trace summary при selective second-pass", async () => {
    const executeAgentSpy = jest
      .spyOn(moduleRef.get(AgentRuntimeService), "executeAgent")
      .mockResolvedValueOnce({
        executedTools: [
          {
            name: RaiToolName.ComputeDeviations,
            result: { summary: "Первичный расчёт собран." },
          },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "explicit_tool_path",
          text: "Первичный агро-ответ.",
          structuredOutput: {
            summary: "Первичная ветка",
            confidence: 0.2,
          },
          toolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              result: { summary: "Первичный расчёт собран." },
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
            result: { summary: "Knowledge cross-check подтверждает ограниченно." },
          },
        ],
        agentExecution: {
          role: "knowledge",
          status: "COMPLETED",
          executionPath: "explicit_tool_path",
          text: "Knowledge cross-check подтверждает ограниченно.",
          structuredOutput: {
            summary: "Knowledge cross-check",
            confidence: 0.9,
          },
          toolCalls: [
            {
              name: RaiToolName.QueryKnowledge,
              result: { summary: "Knowledge cross-check подтверждает ограниченно." },
            },
          ],
          connectorCalls: [],
          evidence: [
            {
              claim: "Найден вторичный источник",
              sourceType: "DOC",
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
    truthfulnessEngineMock.buildBranchTrustInputs
      .mockReturnValueOnce({
        classifiedEvidence: [],
        accounting: {
          total: 1,
          evidenced: 0,
          verified: 0,
          unverified: 1,
          invalid: 0,
        },
        totalWeight: 0,
        weightedEvidence: {
          verified: 0,
          unverified: 1,
          invalid: 0,
        },
        bsScorePct: null,
        evidenceCoveragePct: null,
        invalidClaimsPct: null,
        qualityStatus: "PENDING_EVIDENCE",
        recommendedVerdict: "UNVERIFIED",
        requiresCrossCheck: true,
        reasons: ["missing_source"],
      })
      .mockReturnValueOnce({
        classifiedEvidence: [],
        accounting: {
          total: 1,
          evidenced: 1,
          verified: 1,
          unverified: 0,
          invalid: 0,
        },
        totalWeight: 1,
        weightedEvidence: {
          verified: 1,
          unverified: 0,
          invalid: 0,
        },
        bsScorePct: 0,
        evidenceCoveragePct: 100,
        invalidClaimsPct: 0,
        qualityStatus: "READY",
        recommendedVerdict: "VERIFIED",
        requiresCrossCheck: false,
        reasons: [],
      });

    await supervisor.orchestrate(
      {
        message: "Проверь отклонения по полю и перепроверь источник",
        toolCalls: [
          {
            name: RaiToolName.ComputeDeviations,
            payload: {
              scope: { seasonId: "season-1", fieldId: "field-1" },
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    await flushAsync();

    expect(executeAgentSpy).toHaveBeenCalledTimes(2);
    expect(prismaState.traceSummaries).toHaveLength(1);
    expect(prismaState.traceSummaries[0]).toMatchObject({
      verifiedBranchCount: 1,
      partialBranchCount: 0,
      unverifiedBranchCount: 1,
      conflictedBranchCount: 0,
      rejectedBranchCount: 0,
      trustLatencyProfile: "CROSS_CHECK_TRIGGERED",
      trustLatencyBudgetMs: 1_500,
      trustLatencyWithinBudget: true,
    });
    expect(prismaState.aiAuditEntries[0]).toMatchObject({
      metadata: expect.objectContaining({
        branchTrustAssessments: expect.arrayContaining([
          expect.objectContaining({ verdict: "UNVERIFIED" }),
          expect.objectContaining({ verdict: "VERIFIED" }),
        ]),
      }),
    });
  });

  it("останавливает runtime на budget deny, не исполняет tool и пишет incident + audit/trace", async () => {
    const agronomistConfig = prismaState.agentConfigurations.find(
      (row) => row.role === "agronomist" && row.companyId === null,
    );
    if (!agronomistConfig) {
      throw new Error("Missing agronomist config");
    }
    agronomistConfig.maxTokens = 2000;

    const response = await supervisor.orchestrate(
      {
        message: "Сделай техкарту",
        toolCalls: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            payload: {
              fieldRef: "field-1",
              seasonRef: "season-1",
              crop: "rapeseed",
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    await flushAsync();

    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
    expect(response.toolCalls).toEqual([]);
    expect(response.runtimeBudget).toMatchObject({
      outcome: "DENY",
      reason: "TOKEN_BUDGET_EXCEEDED:agronomist:generate_tech_map_draft",
    });
    expect(prismaState.systemIncidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          companyId: "company-1",
          incidentType: SystemIncidentType.UNKNOWN,
          severity: "HIGH",
          details: expect.objectContaining({
            subtype: "BUDGET_RUNTIME_DENIED",
          }),
        }),
      ]),
    );
    expect(prismaState.aiAuditEntries[0]).toMatchObject({
      companyId: "company-1",
      toolNames: [],
    });
    expect(
      ((prismaState.aiAuditEntries[0].metadata as JsonRecord).runtimeBudget as JsonRecord).outcome,
    ).toBe("DENY");
  });

  it("учитывает effective registry state и блокирует tool до исполнения handler", async () => {
    prismaState.agentToolBindings = prismaState.agentToolBindings.map((binding) =>
      binding.role === "knowledge" && binding.toolName === RaiToolName.QueryKnowledge
        ? { ...binding, isEnabled: false }
        : binding,
    );

    const response = await supervisor.orchestrate(
      {
        message: "Найди в базе знания про севооборот",
        toolCalls: [
          {
            name: RaiToolName.QueryKnowledge,
            payload: {
              query: "севооборот",
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    await flushAsync();

    expect(memoryAdapterMock.getProfile).toHaveBeenCalledTimes(1);
    expect(response.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.QueryKnowledge,
          payload: expect.objectContaining({
            agentConfigBlocked: true,
            reasonCode: "CAPABILITY_DENIED",
          }),
        }),
      ]),
    );
    expect(prismaState.aiAuditEntries).toHaveLength(1);
    expect(prismaState.traceSummaries).toHaveLength(1);
    expect(prismaState.systemIncidents).toHaveLength(0);
  });

  describe("Planner sequential multi-tick e2e", () => {
    const graphId = "g_cp-e2e-seq4_na";

    function makeSequential4BranchFrame(): SemanticIngressFrame {
      const stages: CompositeWorkflowStageContract[] = [
        {
          stageId: "s0",
          order: 0,
          agentRole: "agronomist",
          intent: "e0",
          toolName: RaiToolName.EchoMessage,
          label: "l0",
          dependsOn: [],
          status: "planned",
        },
        {
          stageId: "s1",
          order: 1,
          agentRole: "agronomist",
          intent: "e1",
          toolName: RaiToolName.EchoMessage,
          label: "l1",
          dependsOn: ["s0"],
          status: "planned",
        },
        {
          stageId: "s2",
          order: 2,
          agentRole: "agronomist",
          intent: "e2",
          toolName: RaiToolName.EchoMessage,
          label: "l2",
          dependsOn: ["s1"],
          status: "planned",
        },
        {
          stageId: "s3",
          order: 3,
          agentRole: "agronomist",
          intent: "e3",
          toolName: RaiToolName.EchoMessage,
          label: "l3",
          dependsOn: ["s2"],
          status: "planned",
        },
      ];
      return {
        version: "v1",
        interactionMode: "task_request",
        requestShape: "composite",
        domainCandidates: [],
        goal: null,
        entities: [],
        requestedOperation: {
          ownerRole: "agronomist",
          intent: "planner_e2e",
          toolName: RaiToolName.EchoMessage,
          decisionType: DecisionType.Execute,
          source: "semantic_route_primary",
        },
        operationAuthority: "delegated_or_autonomous",
        missingSlots: [],
        riskClass: "safe_read",
        requiresConfirmation: false,
        confidenceBand: ConfidenceBand.High,
        explanation: "e2e",
        writePolicy: { decision: "execute", reason: "e2e" },
        compositePlan: {
          planId: "cp-e2e-seq4",
          workflowId: "agro.seq_e2e",
          /** Не совпадает с `primaryExecution.role`, иначе `applyCompositeWorkflowStage` уходит в CRM multi-executeAgent. */
          leadOwnerAgent: "planner_e2e_orchestrator",
          executionStrategy: "sequential",
          summary: "e2e sequential",
          stages,
        },
        subIntentGraph: {
          version: "v1",
          graphId,
          branches: stages.map((s) => ({
            branchId: s.stageId,
            ownerRole: s.agentRole,
            intent: s.intent,
            toolName: s.toolName,
            kind: "analytical" as const,
            dependsOn: [...s.dependsOn],
          })),
        },
      };
    }

    beforeEach(() => {
      process.env.RAI_PLANNER_RUNTIME_ENABLED = "true";
    });

    afterEach(() => {
      delete process.env.RAI_PLANNER_RUNTIME_ENABLED;
    });

    it("четыре сообщения в одном thread: четыре вызова executeAgent, срез планировщика в конце полностью COMPLETED", async () => {
      const ingress = moduleRef.get(SemanticIngressService);
      const buildFrameSpy = jest.spyOn(ingress, "buildFrame").mockImplementation(() =>
        JSON.parse(JSON.stringify(makeSequential4BranchFrame())) as SemanticIngressFrame,
      );
      const execSpy = jest.spyOn(moduleRef.get(AgentRuntimeService), "executeAgent").mockResolvedValue({
        executedTools: [
          {
            name: RaiToolName.EchoMessage,
            result: { ok: true },
          },
        ],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "explicit_tool_path",
          text: "e2e",
          structuredOutput: {},
          toolCalls: [
            {
              name: RaiToolName.EchoMessage,
              result: { ok: true },
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
            allowedToolNames: [RaiToolName.EchoMessage],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>);

      const threadId = "th-planner-seq-e2e";
      const companyId = "company-1";
      for (let i = 0; i < 4; i += 1) {
        const res = await supervisor.orchestrate(
          {
            message: `planner e2e tick ${i}`,
            threadId,
            clientTraceId: `ct-e2e-${i}`,
            toolCalls: [
              {
                name: RaiToolName.EchoMessage,
                payload: { text: `tick-${i}` },
              },
            ],
          },
          companyId,
          "user-1",
        );
        expect(res.executionSurface?.branches?.length).toBe(4);
      }

      await flushAsync();

      expect(buildFrameSpy).toHaveBeenCalledTimes(4);
      expect(execSpy).toHaveBeenCalledTimes(4);

      const plane = moduleRef.get(BranchStatePlaneService);
      const slice = await plane.getThreadPlannerSlice(companyId, threadId);
      expect(slice).not.toBeNull();
      expect(slice!.executionSurface.branches.map((b) => b.lifecycle)).toEqual([
        "COMPLETED",
        "COMPLETED",
        "COMPLETED",
        "COMPLETED",
      ]);

      buildFrameSpy.mockRestore();
      execSpy.mockRestore();
    });
  });

  describe("Planner multi-explicit tool e2e", () => {
    beforeEach(() => {
      process.env.RAI_PLANNER_RUNTIME_ENABLED = "true";
    });

    afterEach(() => {
      delete process.env.RAI_PLANNER_RUNTIME_ENABLED;
    });

    it("два явных toolCalls без composite: реальный buildFrame → SubIntentGraph из двух веток, surface COMPLETED, telemetry", async () => {
      const execSpy = jest
        .spyOn(moduleRef.get(AgentRuntimeService), "executeAgent")
        .mockImplementation(async (executionRequest) => {
          const toolName = executionRequest.requestedTools?.[0]?.name;
          if (toolName === RaiToolName.ComputeDeviations) {
            return {
              executedTools: [
                {
                  name: RaiToolName.ComputeDeviations,
                  result: { summary: "dev ok" },
                },
              ],
              agentExecution: {
                role: "agronomist",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "deviation ok",
                structuredOutput: {
                  intent: "compute_deviations",
                  confidence: 0.92,
                  branchVerdict: "VERIFIED",
                },
                toolCalls: [
                  {
                    name: RaiToolName.ComputeDeviations,
                    result: { summary: "dev ok" },
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
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          if (toolName === RaiToolName.QueryKnowledge) {
            return {
              executedTools: [
                {
                  name: RaiToolName.QueryKnowledge,
                  result: { summary: "k ok" },
                },
              ],
              agentExecution: {
                role: "knowledge",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "knowledge ok",
                structuredOutput: {
                  intent: "query_knowledge",
                  confidence: 0.88,
                  branchVerdict: "VERIFIED",
                },
                toolCalls: [
                  {
                    name: RaiToolName.QueryKnowledge,
                    result: { summary: "k ok" },
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
                  allowedToolNames: [RaiToolName.QueryKnowledge],
                  blockedToolNames: [],
                  connectorNames: [],
                  outputContractId: "knowledge-v1",
                },
              },
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          throw new Error(`unexpected tool ${String(toolName)}`);
        });

      const res = await supervisor.orchestrate(
        {
          message: "multi explicit planner e2e",
          clientTraceId: "ct-multi-explicit-e2e",
          workspaceContext: { route: "/consulting/fields" },
          toolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              payload: { scope: { seasonId: "season-1", fieldId: "field-1" } },
            },
            {
              name: RaiToolName.QueryKnowledge,
              payload: { query: "норма" },
            },
          ],
        },
        "company-1",
        "user-1",
      );

      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(2);
      expect(execSpy.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          role: "agronomist",
          requestedTools: [
            expect.objectContaining({
              name: RaiToolName.ComputeDeviations,
            }),
          ],
        }),
      );
      expect(execSpy.mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({
          role: "knowledge",
          requestedTools: [
            expect.objectContaining({
              name: RaiToolName.QueryKnowledge,
            }),
          ],
        }),
      );
      expect(res.executionSurface?.branches).toHaveLength(2);
      expect(res.executionSurface?.branches.every((b) => b.lifecycle === "COMPLETED")).toBe(true);
      expect(res.executionExplainability?.branches).toHaveLength(2);
      expect(
        res.executionSurface?.branches.map((b) => b.branchId).sort(),
      ).toEqual(
        ["explicit_0_compute_deviations", "explicit_1_query_knowledge"].sort(),
      );

      expect(prismaState.aiAuditEntries.length).toBeGreaterThanOrEqual(1);
      const meta = prismaState.aiAuditEntries[0].metadata as JsonRecord;
      expect(meta.plannerBranchTelemetry).toEqual(
        expect.objectContaining({
          maxConcurrentBranches: 4,
          branches: expect.any(Array),
        }),
      );
      expect((meta.plannerBranchTelemetry as JsonRecord).branches).toHaveLength(2);

      execSpy.mockRestore();
    });
  });

  describe("Planner tech-map clarify e2e", () => {
    beforeEach(() => {
      process.env.RAI_PLANNER_RUNTIME_ENABLED = "true";
      process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    });

    afterEach(() => {
      delete process.env.RAI_PLANNER_RUNTIME_ENABLED;
      delete process.env.RAI_AGENT_RUNTIME_MODE;
    });

    it("tech_map_core как WRITE уходит в BLOCKED_ON_CONFIRMATION и clarify branch не активируется до подтверждения", async () => {
      semanticRouterMock.evaluate.mockResolvedValueOnce({
        promotedPrimary: false,
        sliceId: "agro.techmaps.list-open-create",
        requestedToolCalls: [],
        classification: {
          targetRole: "agronomist",
          intent: "tech_map_draft",
          toolName: RaiToolName.GenerateTechMapDraft,
          confidence: 0.85,
          method: "semantic_route_shadow",
          reason: "semantic_router:techmap_create_execute",
        },
        semanticIntent: {
          domain: "agro",
          entity: "techmap",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: [],
          focusObject: {
            kind: "techmap",
            id: "techmap-77",
          },
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "semantic_router:techmap_create_execute",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [RaiToolName.GenerateTechMapDraft],
          eligibleFlows: ["tech_map_draft"],
          requiredContextMissing: ["soil_profile"],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: true,
          abstainReason: null,
          policyBlockReason: null,
        },
        candidateRoutes: [],
        divergence: {
          isMismatch: false,
          mismatchKinds: [],
          summary: "match",
          legacyRouteKey: "agronomist:tech_map_draft",
          semanticRouteKey: "agro:techmap:create",
        },
        versionInfo: {
          routerVersion: "semantic-router-v1",
          promptVersion: "semantic-router-prompt-v1",
          toolsetVersion: "toolset-v1",
          workspaceStateDigest: "digest",
        },
        latencyMs: 5,
        executionPath: "semantic_route_shadow",
        routingContext: {
          source: "shadow",
          promotedPrimary: false,
          enforceCapabilityGating: false,
          sliceId: "agro.techmaps.list-open-create",
          semanticIntent: {
            domain: "agro",
            entity: "techmap",
            action: "create",
            interactionMode: "write_candidate",
            mutationRisk: "side_effecting_write",
            filters: {},
            requiredContext: [],
            focusObject: {
              kind: "techmap",
              id: "techmap-77",
            },
            dialogState: {
              activeFlow: null,
              pendingClarificationKeys: [],
              lastUserAction: null,
            },
            resolvability: "resolved",
            ambiguityType: "none",
            confidenceBand: "high",
            reason: "semantic_router:techmap_create_execute",
          },
          routeDecision: {
            decisionType: "execute",
            recommendedExecutionMode: "direct_execute",
            eligibleTools: [RaiToolName.GenerateTechMapDraft],
            eligibleFlows: ["tech_map_draft"],
            requiredContextMissing: ["soil_profile"],
            policyChecksRequired: [],
            needsConfirmation: false,
            needsClarification: true,
            abstainReason: null,
            policyBlockReason: null,
          },
          candidateRoutes: [],
        },
        llmUsed: false,
        llmError: null,
      });
      techMapServiceMock.createDraftStub.mockResolvedValueOnce({
        draftId: "draft-clarify-1",
        status: "DRAFT",
        fieldRef: "field-1",
        seasonRef: "season-1",
        crop: "rapeseed",
        missingMust: ["soil_profile"],
        tasks: [],
        assumptions: [],
        clarifyBatch: {
          mode: "MULTI_STEP",
          status: "OPEN",
          resume_token:
            "resume:tech-map:draft-clarify-1:clarify:draft-clarify-1:soil_profile",
        },
        workflowResumeState: {
          resume_from_phase: "MISSING_CONTEXT_TRIAGE",
          external_recheck_required: false,
        },
      });

      const execSpy = jest.spyOn(moduleRef.get(AgentRuntimeService), "executeAgent");

      const response = await supervisor.orchestrate(
        {
          message: "Сделай техкарту",
          toolCalls: [
            {
              name: RaiToolName.GenerateTechMapDraft,
              payload: {
                fieldRef: "field-1",
                seasonRef: "season-1",
                crop: "rapeseed",
              },
            },
          ],
        },
        "company-1",
        "user-1",
      );

      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(1);
      expect(response.executionSurface?.branches).toHaveLength(2);
      const byId = new Map(
        response.executionSurface!.branches.map((branch) => [branch.branchId, branch]),
      );
      expect(byId.get("tech_map_core")?.lifecycle).toBe("BLOCKED_ON_CONFIRMATION");
      expect(byId.get("tech_map_clarify")?.lifecycle).toBe("PLANNED");
    });
  });

  describe("Planner multi-explicit concurrency cap e2e", () => {
    beforeEach(() => {
      process.env.RAI_PLANNER_RUNTIME_ENABLED = "true";
      process.env.RAI_PLANNER_MAX_CONCURRENT_BRANCHES = "1";
    });

    afterEach(() => {
      delete process.env.RAI_PLANNER_RUNTIME_ENABLED;
      delete process.env.RAI_PLANNER_MAX_CONCURRENT_BRANCHES;
    });

    it("два explicit-корня при cap=1: одна ветка COMPLETED, вторая PLANNED + concurrencyDeferral + telemetry cap", async () => {
      const execSpy = jest
        .spyOn(moduleRef.get(AgentRuntimeService), "executeAgent")
        .mockImplementation(async (executionRequest) => {
          const toolName = executionRequest.requestedTools?.[0]?.name;
          if (toolName !== RaiToolName.ComputeDeviations) {
            throw new Error(`unexpected tool ${String(toolName)}`);
          }
          return {
            executedTools: [
              {
                name: RaiToolName.ComputeDeviations,
                result: { summary: "dev ok" },
              },
            ],
            agentExecution: {
              role: "agronomist",
              status: "COMPLETED",
              executionPath: "explicit_tool_path",
              text: "cap e2e",
              structuredOutput: {
                intent: "compute_deviations",
                confidence: 0.91,
                branchVerdict: "VERIFIED",
              },
              toolCalls: [
                {
                  name: RaiToolName.ComputeDeviations,
                  result: { summary: "dev ok" },
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
          } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
        });

      const res = await supervisor.orchestrate(
        {
          message: "multi explicit cap1 e2e",
          clientTraceId: "ct-multi-explicit-cap1",
          workspaceContext: { route: "/consulting/fields" },
          toolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              payload: { scope: { seasonId: "season-1", fieldId: "field-1" } },
            },
            {
              name: RaiToolName.QueryKnowledge,
              payload: { query: "норма" },
            },
          ],
        },
        "company-1",
        "user-1",
      );

      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(1);
      expect(res.executionSurface?.branches).toHaveLength(2);
      const byId = new Map(
        res.executionSurface!.branches.map((b) => [b.branchId, b]),
      );
      expect(byId.get("explicit_0_compute_deviations")?.lifecycle).toBe("COMPLETED");
      expect(byId.get("explicit_1_query_knowledge")?.lifecycle).toBe("PLANNED");

      expect(res.executionExplainability?.concurrencyDeferral).toEqual({
        cap: 1,
        deferredBranchIds: ["explicit_1_query_knowledge"],
      });
      const deferredEx = res.executionExplainability?.branches?.find(
        (b) => b.branchId === "explicit_1_query_knowledge",
      );
      expect(deferredEx?.policyDecision).toBe("branch_concurrency_cap");

      expect(prismaState.aiAuditEntries.length).toBeGreaterThanOrEqual(1);
      const meta = prismaState.aiAuditEntries[0].metadata as JsonRecord;
      expect(meta.plannerBranchTelemetry).toEqual(
        expect.objectContaining({
          maxConcurrentBranches: 1,
          branches: expect.any(Array),
        }),
      );

      execSpy.mockRestore();
    });

    it("cap=1 + второй тик в том же threadId: carry-forward, две ветки COMPLETED, два executeAgent", async () => {
      const execSpy = jest
        .spyOn(moduleRef.get(AgentRuntimeService), "executeAgent")
        .mockImplementation(async (executionRequest) => {
          const toolName = executionRequest.requestedTools?.[0]?.name;
          if (toolName === RaiToolName.ComputeDeviations) {
            return {
              executedTools: [
                {
                  name: RaiToolName.ComputeDeviations,
                  result: { summary: "dev ok" },
                },
              ],
              agentExecution: {
                role: "agronomist",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "carry deviations ok",
                structuredOutput: {
                  intent: "compute_deviations",
                  confidence: 0.91,
                  branchVerdict: "VERIFIED",
                },
                toolCalls: [
                  {
                    name: RaiToolName.ComputeDeviations,
                    result: { summary: "dev ok" },
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
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          if (toolName === RaiToolName.QueryKnowledge) {
            return {
              executedTools: [
                {
                  name: RaiToolName.QueryKnowledge,
                  result: { summary: "k ok" },
                },
              ],
              agentExecution: {
                role: "knowledge",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "carry knowledge ok",
                structuredOutput: {
                  intent: "query_knowledge",
                  confidence: 0.87,
                  branchVerdict: "VERIFIED",
                },
                toolCalls: [
                  {
                    name: RaiToolName.QueryKnowledge,
                    result: { summary: "k ok" },
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
                  allowedToolNames: [RaiToolName.QueryKnowledge],
                  blockedToolNames: [],
                  connectorNames: [],
                  outputContractId: "knowledge-v1",
                },
              },
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          throw new Error(`unexpected tool ${String(toolName)}`);
        });

      const threadId = "th-multi-explicit-cap1-carry";
      const companyId = "company-1";
      const base = {
        threadId,
        workspaceContext: { route: "/consulting/fields" },
        toolCalls: [
          {
            name: RaiToolName.ComputeDeviations,
            payload: { scope: { seasonId: "season-1", fieldId: "field-1" } },
          },
          {
            name: RaiToolName.QueryKnowledge,
            payload: { query: "норма" },
          },
        ],
      };

      const res1 = await supervisor.orchestrate(
        {
          ...base,
          message: "cap carry tick 1",
          clientTraceId: "ct-cap1-carry-1",
        },
        companyId,
        "user-1",
      );
      await flushAsync();

      expect(
        res1.executionSurface?.branches.find(
          (b) => b.branchId === "explicit_1_query_knowledge",
        )?.lifecycle,
      ).toBe("PLANNED");
      expect(res1.executionExplainability?.concurrencyDeferral?.deferredBranchIds).toEqual([
        "explicit_1_query_knowledge",
      ]);

      const res2 = await supervisor.orchestrate(
        {
          ...base,
          message: "cap carry tick 2",
          clientTraceId: "ct-cap1-carry-2",
        },
        companyId,
        "user-1",
      );
      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(2);
      expect(execSpy.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          role: "agronomist",
          requestedTools: [
            expect.objectContaining({
              name: RaiToolName.ComputeDeviations,
            }),
          ],
        }),
      );
      expect(execSpy.mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({
          role: "knowledge",
          requestedTools: [
            expect.objectContaining({
              name: RaiToolName.QueryKnowledge,
            }),
          ],
        }),
      );
      expect(res2.executionSurface?.branches).toHaveLength(2);
      expect(
        res2.executionSurface?.branches.every((b) => b.lifecycle === "COMPLETED"),
      ).toBe(true);
      expect(res2.executionExplainability?.concurrencyDeferral).toBeUndefined();

      const plane = moduleRef.get(BranchStatePlaneService);
      const slice = await plane.getThreadPlannerSlice(companyId, threadId);
      expect(slice).not.toBeNull();
      expect(slice!.executionSurface.branches.map((b) => b.lifecycle)).toEqual([
        "COMPLETED",
        "COMPLETED",
      ]);

      execSpy.mockRestore();
    });

    it("cap=1 + governed mutation resume: BLOCKED -> APPROVED_FINAL -> carry-forward до второй ветки", async () => {
      const execSpy = jest
        .spyOn(moduleRef.get(AgentRuntimeService), "executeAgent")
        .mockImplementation(async (executionRequest) => {
          const toolName = executionRequest.requestedTools?.[0]?.name;
          const inn =
            executionRequest.requestedTools?.[0]?.payload &&
            typeof executionRequest.requestedTools[0].payload === "object"
              ? (executionRequest.requestedTools[0].payload as JsonRecord).inn
              : undefined;

          if (
            toolName === RaiToolName.RegisterCounterparty &&
            inn === "2636041493" &&
            execSpy.mock.calls.length === 1
          ) {
            return {
              executedTools: [
                {
                  name: RaiToolName.RegisterCounterparty,
                  result: { riskPolicyBlocked: true, actionId: "pa-1" },
                },
              ],
              agentExecution: {
                role: "crm_agent",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "Создание контрагента ожидает подтверждения.",
                structuredOutput: {
                  intent: "register_counterparty",
                  confidence: 0.95,
                  branchVerdict: "VERIFIED",
                },
                toolCalls: [
                  {
                    name: RaiToolName.RegisterCounterparty,
                    result: { riskPolicyBlocked: true, actionId: "pa-1" },
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
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          if (toolName === RaiToolName.RegisterCounterparty) {
            return {
              executedTools: [
                {
                  name: RaiToolName.RegisterCounterparty,
                  result: { partyId: "party-1", summary: "crm ok" },
                },
              ],
              agentExecution: {
                role: "crm_agent",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "Контрагент зарегистрирован.",
                structuredOutput: {
                  intent: "register_counterparty",
                  confidence: 0.93,
                  branchVerdict: "VERIFIED",
                  data: { partyId: "party-1" },
                },
                toolCalls: [
                  {
                    name: RaiToolName.RegisterCounterparty,
                    result: { partyId: "party-1", summary: "crm ok" },
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
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          if (toolName === RaiToolName.QueryKnowledge) {
            return {
              executedTools: [
                {
                  name: RaiToolName.QueryKnowledge,
                  result: { summary: "knowledge ok" },
                },
              ],
              agentExecution: {
                role: "knowledge",
                status: "COMPLETED",
                executionPath: "explicit_tool_path",
                text: "Справка из базы знаний найдена.",
                structuredOutput: {
                  intent: "query_knowledge",
                  confidence: 0.87,
                  branchVerdict: "VERIFIED",
                },
                toolCalls: [
                  {
                    name: RaiToolName.QueryKnowledge,
                    result: { summary: "knowledge ok" },
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
                  allowedToolNames: [RaiToolName.QueryKnowledge],
                  blockedToolNames: [],
                  connectorNames: [],
                  outputContractId: "knowledge-v1",
                },
              },
            } as Awaited<ReturnType<AgentRuntimeService["executeAgent"]>>;
          }

          throw new Error(`unexpected tool ${String(toolName)}`);
        });

      const threadId = "th-planner-mutation-resume";
      const companyId = "company-1";
      const base = {
        threadId,
        workspaceContext: { route: "/crm/counterparties" },
        toolCalls: [
          {
            name: RaiToolName.RegisterCounterparty,
            payload: {
              inn: "2636041493",
              jurisdictionCode: "RU",
              partyType: "LEGAL_ENTITY",
            },
          },
          {
            name: RaiToolName.QueryKnowledge,
            payload: { query: "контрагент зарегистрирован" },
          },
        ],
      };

      const res1 = await supervisor.orchestrate(
        {
          ...base,
          message: "resume tick 1",
          clientTraceId: "ct-planner-mutation-1",
        },
        companyId,
        "user-1",
      );
      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(1);
      let byId = new Map(
        res1.executionSurface!.branches.map((branch) => [branch.branchId, branch]),
      );
      expect(byId.get("explicit_0_register_counterparty")?.lifecycle).toBe(
        "BLOCKED_ON_CONFIRMATION",
      );
      expect(byId.get("explicit_0_register_counterparty")?.pendingActionId).toBe(
        "pa-1",
      );
      expect(byId.get("explicit_1_query_knowledge")?.lifecycle).toBe("PLANNED");

      prismaState.pendingActions.push({
        id: "pa-1",
        companyId,
        status: "APPROVED_FINAL",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res2 = await supervisor.orchestrate(
        {
          ...base,
          message: "resume tick 2",
          clientTraceId: "ct-planner-mutation-2",
          executionPlannerMutationApproved: true,
          executionPlannerApprovedPendingActionId: "pa-1",
        },
        companyId,
        "user-1",
      );
      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(2);
      byId = new Map(
        res2.executionSurface!.branches.map((branch) => [branch.branchId, branch]),
      );
      expect(byId.get("explicit_0_register_counterparty")?.lifecycle).toBe(
        "COMPLETED",
      );
      expect(byId.get("explicit_1_query_knowledge")?.lifecycle).toBe("PLANNED");

      const res3 = await supervisor.orchestrate(
        {
          ...base,
          message: "resume tick 3",
          clientTraceId: "ct-planner-mutation-3",
        },
        companyId,
        "user-1",
      );
      await flushAsync();

      expect(execSpy).toHaveBeenCalledTimes(3);
      expect(execSpy.mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({
          role: "crm_agent",
          requestedTools: [
            expect.objectContaining({
              name: RaiToolName.RegisterCounterparty,
            }),
          ],
        }),
      );
      expect(execSpy.mock.calls[2]?.[0]).toEqual(
        expect.objectContaining({
          role: "knowledge",
          requestedTools: [
            expect.objectContaining({
              name: RaiToolName.QueryKnowledge,
            }),
          ],
        }),
      );
      expect(
        res3.executionSurface?.branches.every(
          (branch) => branch.lifecycle === "COMPLETED",
        ),
      ).toBe(true);

      const plane = moduleRef.get(BranchStatePlaneService);
      const slice = await plane.getThreadPlannerSlice(companyId, threadId);
      expect(slice).not.toBeNull();
      expect(slice!.executionSurface.branches.map((b) => b.lifecycle)).toEqual([
        "COMPLETED",
        "COMPLETED",
      ]);

      execSpy.mockRestore();
    });
  });
});
