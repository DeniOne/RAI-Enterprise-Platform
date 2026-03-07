import { Test, TestingModule } from "@nestjs/testing";
import { SystemIncidentType } from "@rai/prisma-client";
import { SupervisorAgent } from "../supervisor-agent.service";
import { IntentRouterService } from "../intent-router/intent-router.service";
import { MemoryCoordinatorService } from "../memory/memory-coordinator.service";
import { AgentRuntimeService } from "./agent-runtime.service";
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

type JsonRecord = Record<string, unknown>;

interface InMemoryPrismaState {
  agentConfigurations: Array<JsonRecord>;
  agentCapabilityBindings: Array<JsonRecord>;
  agentToolBindings: Array<JsonRecord>;
  aiAuditEntries: Array<JsonRecord>;
  traceSummaries: Array<JsonRecord>;
  systemIncidents: Array<JsonRecord>;
  pendingActions: Array<JsonRecord>;
  qualityAlerts: Array<JsonRecord>;
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
  },
  qualityAlert: {
    findFirst: jest.fn(async ({ where }: { where?: JsonRecord }) =>
      state.qualityAlerts.find((row) => matchesWhere(row, where)) ?? null,
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
  aiAuditEntries: [],
  traceSummaries: [],
  systemIncidents: [],
  pendingActions: [],
  qualityAlerts: [],
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
  };
  const performanceMetricsMock = {
    recordLatency: jest.fn(),
    recordError: jest.fn(),
  };
  const queueMetricsMock = {
    beginRuntimeExecution: jest.fn(),
    endRuntimeExecution: jest.fn(),
  };
  const techMapBudgetMock = {
    calculateBudget: jest.fn(),
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
    performanceMetricsMock.recordLatency.mockResolvedValue(undefined);
    performanceMetricsMock.recordError.mockResolvedValue(undefined);
    queueMetricsMock.beginRuntimeExecution.mockResolvedValue(undefined);
    queueMetricsMock.endRuntimeExecution.mockResolvedValue(undefined);
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
        ResponseComposerService,
        RaiChatWidgetBuilder,
        TraceSummaryService,
        RaiToolsRegistry,
        AgroToolsRegistry,
        FinanceToolsRegistry,
        RiskToolsRegistry,
        KnowledgeToolsRegistry,
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
    await moduleRef.close();
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
});
