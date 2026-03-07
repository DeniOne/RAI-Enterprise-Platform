import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Provider } from "@nestjs/common";
import request = require("supertest");

jest.mock("../src/modules/tech-map/tech-map.module", () => {
  const { Module } = require("@nestjs/common");
  const { TechMapService } = require("../src/modules/tech-map/tech-map.service");
  const { TechMapBudgetService } = require("../src/modules/tech-map/economics/tech-map-budget.service");
  class MockTechMapModule {}
  Module({
    providers: [
      {
        provide: TechMapService,
        useValue: {
          createDraftStub: jest.fn().mockImplementation(
            async ({
              fieldRef,
              seasonRef,
              crop,
              companyId,
            }: {
              fieldRef: string;
              seasonRef: string;
              crop: "rapeseed" | "sunflower";
              companyId: string;
            }) => ({
              draftId: `draft-${fieldRef}-${seasonRef}`,
              status: "DRAFT",
              fieldRef,
              seasonRef,
              crop,
              companyId,
              missingMust: ["soilType", "moisture", "precursor", "stages"],
              tasks: [],
              assumptions: [],
            }),
          ),
        },
      },
      { provide: TechMapBudgetService, useValue: {} },
    ],
    exports: [TechMapService, TechMapBudgetService],
  })(MockTechMapModule);
  return { TechMapModule: MockTechMapModule };
});

jest.mock("../src/modules/consulting/consulting.module", () => {
  const { Module } = require("@nestjs/common");
  const { DeviationService } = require("../src/modules/consulting/deviation.service");
  const { KpiService } = require("../src/modules/consulting/kpi.service");
  class MockConsultingModule {}
  Module({
    providers: [
      { provide: DeviationService, useValue: {} },
      {
        provide: KpiService,
        useValue: {
          calculatePlanKPI: jest.fn().mockResolvedValue({
            hasData: true,
            roi: 0.165,
            ebitda: 2200,
            revenue: 4100,
            totalActualCost: 1800,
            totalPlannedCost: 1900,
          }),
        },
      },
    ],
    exports: [DeviationService, KpiService],
  })(MockConsultingModule);
  return { ConsultingModule: MockConsultingModule };
});

jest.mock("../src/modules/satellite/satellite.module", () => {
  const { Module } = require("@nestjs/common");
  const { SatelliteIngestionService } = require("../src/modules/satellite/satellite-ingestion.service");
  const { SatelliteQueryService } = require("../src/modules/satellite/satellite-query.service");
  class MockSatelliteModule {}
  Module({
    providers: [
      {
        provide: SatelliteIngestionService,
        useValue: { ingest: jest.fn().mockResolvedValue(undefined) },
      },
      {
        provide: SatelliteQueryService,
        useValue: {},
      },
    ],
    exports: [SatelliteIngestionService, SatelliteQueryService],
  })(MockSatelliteModule);
  return { SatelliteModule: MockSatelliteModule };
});

jest.mock("../src/modules/agro-events/agro-events.module", () => {
  const { Module } = require("@nestjs/common");
  class MockAgroEventsModule {}
  Module({})(MockAgroEventsModule);
  return { AgroEventsModule: MockAgroEventsModule };
});

jest.mock("../src/modules/adaptive-learning/adaptive-learning.module", () => {
  const { Module } = require("@nestjs/common");
  class MockAdaptiveLearningModule {}
  Module({})(MockAdaptiveLearningModule);
  return { AdaptiveLearningModule: MockAdaptiveLearningModule };
});

import { ExplainabilityPanelModule } from "../src/modules/explainability/explainability-panel.module";
import { RaiChatModule } from "../src/modules/rai-chat/rai-chat.module";
import { TenantContextService } from "../src/shared/tenant-context/tenant-context.service";
import { JwtAuthGuard } from "../src/shared/auth/jwt-auth.guard";
import { RolesGuard } from "../src/shared/auth/roles.guard";
import { ExplainabilityPanelService } from "../src/modules/explainability/explainability-panel.service";
import { AgentManagementService } from "../src/modules/explainability/agent-management.service";
import { AgentPromptGovernanceService } from "../src/modules/explainability/agent-prompt-governance.service";
import { IncidentOpsService } from "../src/modules/rai-chat/incident-ops.service";
import { PrismaService } from "../src/shared/prisma/prisma.service";
import { RedisService } from "../src/shared/redis/redis.service";
import { S3Service } from "../src/shared/s3/s3.service";
import { PerformanceMetricsService } from "../src/modules/rai-chat/performance/performance-metrics.service";
import { CostAnalyticsService } from "../src/modules/explainability/cost-analytics.service";
import { TraceTopologyService } from "../src/modules/explainability/trace-topology.service";
import { SafeReplayService } from "../src/modules/rai-chat/safe-replay.service";
import { AutonomyPolicyService } from "../src/modules/rai-chat/autonomy-policy.service";
import { IntentRouterService } from "../src/modules/rai-chat/intent-router/intent-router.service";

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: "u-smoke", companyId: "company-a", role: "ADMIN" };
    return true;
  }
}

class TestRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

const createPrismaProxy = () =>
  new Proxy(
    {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as Record<string, unknown>,
    {
      get(target, prop: string | symbol) {
        if (typeof prop === "symbol") {
          return Reflect.get(target, prop);
        }
        if (!(prop in target)) {
          target[prop] = new Proxy(
            {},
            {
              get(delegateTarget, delegateProp: string | symbol) {
                if (typeof delegateProp === "symbol") {
                  return Reflect.get(delegateTarget, delegateProp);
                }
                if (!(delegateProp in delegateTarget)) {
                  delegateTarget[delegateProp] = jest.fn().mockResolvedValue([]);
                }
                return delegateTarget[delegateProp as keyof typeof delegateTarget];
              },
            },
          );
        }
        return target[prop as keyof typeof target];
      },
    },
  );

describe("A_RAI live API smoke", () => {
  let app: INestApplication;

  const tenantContext = {
    getCompanyId: jest.fn(() => "company-a"),
    getStore: jest.fn(() => ({ companyId: "company-a" })),
    isSystemOperation: jest.fn(() => false),
    run: jest.fn((_store, callback: () => unknown) => callback()),
  };

  const explainabilityPanel = {
    getTruthfulnessDashboard: jest.fn(),
    getQueuePressure: jest.fn(),
    getTraceTimeline: jest.fn(),
    getTraceForensics: jest.fn(),
  };

  const performanceMetrics = {
    getAggregatedMetrics: jest.fn(),
  };

  const autonomyPolicy = {
    getCompanyAutonomyStatus: jest.fn(),
  };

  const costAnalytics = {
    getCostHotspots: jest.fn(),
  };

  const traceTopology = {
    getTraceTopology: jest.fn(),
  };

  const safeReplay = {
    runReplay: jest.fn(),
  };

  const incidentOps = {
    getIncidentsFeed: jest.fn(),
    resolveIncident: jest.fn(),
    executeRunbook: jest.fn(),
    getGovernanceCounters: jest.fn(),
    logIncident: jest.fn(),
  };

  const agentManagement = {
    getAgentConfigs: jest.fn(),
  };

  const promptGovernance = {
    createChangeRequest: jest.fn(),
    startCanary: jest.fn(),
    reviewCanary: jest.fn(),
    promoteApprovedChange: jest.fn(),
    rollbackPromotedChange: jest.fn(),
  };
  const intentRouter = {
    classify: jest.fn(),
    buildAutoToolCall: jest.fn(),
  };

  const prismaProxy = createPrismaProxy();
  const prismaProxyTyped = prismaProxy as any;
  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    setNX: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    getClient: jest.fn(),
  };
  const s3Mock = {
    onModuleInit: jest.fn(),
    getStatus: jest.fn(() => false),
    validateObjectIntegrity: jest.fn(),
  };
  const memoryAdapterMock = {
    retrieve: jest.fn(),
    appendInteraction: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };
  const memoryAdapterProvider: Provider = {
    provide: "MEMORY_ADAPTER",
    useValue: memoryAdapterMock,
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "smoke-secret";
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";

    const moduleRef = await Test.createTestingModule({
      imports: [RaiChatModule, ExplainabilityPanelModule],
      providers: [memoryAdapterProvider],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .overrideProvider(TenantContextService)
      .useValue(tenantContext)
      .overrideProvider(ExplainabilityPanelService)
      .useValue(explainabilityPanel)
      .overrideProvider(PerformanceMetricsService)
      .useValue(performanceMetrics)
      .overrideProvider(AutonomyPolicyService)
      .useValue(autonomyPolicy)
      .overrideProvider(CostAnalyticsService)
      .useValue(costAnalytics)
      .overrideProvider(TraceTopologyService)
      .useValue(traceTopology)
      .overrideProvider(SafeReplayService)
      .useValue(safeReplay)
      .overrideProvider(IncidentOpsService)
      .useValue(incidentOps)
      .overrideProvider(AgentManagementService)
      .useValue(agentManagement)
      .overrideProvider(AgentPromptGovernanceService)
      .useValue(promptGovernance)
      .overrideProvider(IntentRouterService)
      .useValue(intentRouter)
      .overrideProvider(PrismaService)
      .useValue(prismaProxy)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .overrideProvider(S3Service)
      .useValue(s3Mock)
      .overrideProvider("MEMORY_ADAPTER")
      .useValue(memoryAdapterMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tenantContext.getCompanyId.mockReturnValue("company-a");
    tenantContext.getStore.mockReturnValue({ companyId: "company-a" });
    intentRouter.classify.mockReturnValue({
      targetRole: "knowledge",
      intent: null,
      toolName: null,
      confidence: 0,
      method: "smoke",
      reason: "default",
    });
    intentRouter.buildAutoToolCall.mockReturnValue(null);
    memoryAdapterMock.retrieve.mockResolvedValue({
      traceId: "trace-memory",
      total: 0,
      positive: 0,
      negative: 0,
      unknown: 0,
      items: [],
    });
    memoryAdapterMock.appendInteraction.mockResolvedValue(undefined);
    memoryAdapterMock.getProfile.mockResolvedValue({});
    memoryAdapterMock.updateProfile.mockResolvedValue(undefined);
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaProxyTyped.agentConfiguration.findMany as jest.Mock).mockResolvedValue([]);
    (prismaProxyTyped.agentCapabilityBinding.findMany as jest.Mock).mockResolvedValue([]);
    (prismaProxyTyped.agentToolBinding.findMany as jest.Mock).mockResolvedValue([]);
    (prismaProxyTyped.agentConnectorBinding.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("GET /api/rai/explainability/queue-pressure отвечает live observability contract", async () => {
    explainabilityPanel.getQueuePressure.mockResolvedValue({
      companyId: "company-a",
      pressureState: "PRESSURED",
      signalFresh: true,
      totalBacklog: 6,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [
        {
          queueName: "runtime_active_tool_calls",
          lastSize: 6,
          avgSize: 4,
          peakSize: 7,
          samples: 3,
          activeInstances: 2,
          lastObservedAt: "2026-03-07T10:00:00.000Z",
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/queue-pressure?timeWindowMs=3600000")
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        companyId: "company-a",
        pressureState: "PRESSURED",
        signalFresh: true,
        totalBacklog: 6,
      }),
    );
    expect(explainabilityPanel.getQueuePressure).toHaveBeenCalledWith(
      "company-a",
      3600000,
    );
  });

  it("GET /api/rai/incidents/feed соблюдает tenant-scoped semantics на живом HTTP route", async () => {
    tenantContext.getCompanyId.mockReturnValue("company-b");
    incidentOps.getIncidentsFeed.mockResolvedValue([
      {
        id: "inc-1",
        companyId: "company-b",
        traceId: "tr-1",
        incidentType: "QUALITY_BS_DRIFT",
        status: "OPEN",
        severity: "HIGH",
        details: { source: "smoke" },
        createdAt: "2026-03-07T10:00:00.000Z",
        resolvedAt: null,
        resolveComment: null,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get("/api/rai/incidents/feed?limit=10&offset=0")
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].companyId).toBe("company-b");
    expect(incidentOps.getIncidentsFeed).toHaveBeenCalledWith("company-b", 10, 0);
  });

  it("GET /api/rai/agents/config отдаёт governed control-plane read model по HTTP", async () => {
    agentManagement.getAgentConfigs.mockResolvedValue({
      global: [],
      tenantOverrides: [],
      agents: [
        {
          role: "agronomist",
          agentName: "AgronomAgent",
          businessRole: "Генерация DRAFT техкарт",
          ownerDomain: "agro",
          runtime: {
            configId: "cfg-1",
            source: "tenant",
            bindingsSource: "persisted",
            llmModel: "gpt-4o",
            maxTokens: 8000,
            systemPrompt: "Prompt",
            capabilities: ["AgroToolsRegistry"],
            tools: ["generate_tech_map_draft"],
            isActive: true,
          },
          tenantAccess: {
            companyId: "company-a",
            mode: "OVERRIDE",
            source: "tenant",
            isActive: true,
          },
          kernel: {
            runtimeProfile: {
              profileId: "agronomist-runtime-v1",
              modelRoutingClass: "strong",
              provider: "openrouter",
              model: "gpt-4o",
              maxInputTokens: 8000,
              maxOutputTokens: 4000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {
              policyId: "agronom-memory-v1",
              allowedScopes: ["tenant", "domain"],
              retrievalPolicy: "scoped_recall",
              writePolicy: "append_summary",
              sensitiveDataPolicy: "allow_masked_only",
            },
            outputContract: {
              contractId: "agronom-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: true,
              fallbackMode: "deterministic_summary",
            },
            governancePolicy: {
              policyId: "agronom-governance-v1",
              allowedAutonomyModes: ["advisory"],
              humanGateRules: ["write_tools_require_review"],
              criticalActionRules: ["no_critical_actions"],
              auditRequirements: ["trace"],
              fallbackRules: ["use_deterministic_summary_if_llm_unavailable"],
            },
            toolBindings: [],
            connectorBindings: [],
          },
        },
        {
          role: "marketer",
          agentName: "MarketerAgent",
          businessRole: "Campaign planning and governed recommendations",
          ownerDomain: "marketing",
          runtime: {
            configId: "cfg-marketer",
            source: "tenant",
            bindingsSource: "persisted",
            llmModel: "openai/gpt-4o-mini",
            maxTokens: 8000,
            systemPrompt: "You are marketer.",
            capabilities: ["MarketingToolsRegistry"],
            tools: [],
            isActive: true,
          },
          tenantAccess: {
            companyId: "company-a",
            mode: "OVERRIDE",
            source: "tenant",
            isActive: true,
          },
          kernel: {
            runtimeProfile: {
              profileId: "marketer-runtime-v1",
              modelRoutingClass: "fast",
              provider: "openrouter",
              model: "openai/gpt-4o-mini",
              executionAdapterRole: "knowledge",
              maxInputTokens: 8000,
              maxOutputTokens: 3000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {
              policyId: "marketer-memory-v1",
              allowedScopes: ["tenant", "domain"],
              retrievalPolicy: "scoped_recall",
              writePolicy: "append_summary",
              sensitiveDataPolicy: "mask",
            },
            outputContract: {
              contractId: "marketer-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "recommendations", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: false,
              fallbackMode: "retrieval_summary",
            },
            governancePolicy: {
              policyId: "marketer-governance-v1",
              allowedAutonomyModes: ["advisory"],
              humanGateRules: ["campaign_launch_requires_human_gate"],
              criticalActionRules: ["no_unreviewed_writes"],
              auditRequirements: ["trace", "evidence"],
              fallbackRules: ["use_read_model_summary_if_llm_unavailable"],
            },
            toolBindings: [],
            connectorBindings: [],
          },
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/agents/config")
      .expect(200);

    expect(response.body.agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "agronomist",
          runtime: expect.objectContaining({
            source: "tenant",
            bindingsSource: "persisted",
          }),
        }),
        expect.objectContaining({
          role: "marketer",
          ownerDomain: "marketing",
          kernel: expect.objectContaining({
            runtimeProfile: expect.objectContaining({
              executionAdapterRole: "knowledge",
            }),
          }),
        }),
      ]),
    );
    expect(agentManagement.getAgentConfigs).toHaveBeenCalledWith("company-a");
  });

  it("POST /api/rai/agents/config/change-requests создаёт governed change request по живому HTTP path", async () => {
    promptGovernance.createChangeRequest.mockResolvedValue({
      id: "change-1",
      role: "agronomist",
      scope: "TENANT",
      targetVersion: "version-1",
      status: "READY_FOR_CANARY",
      evalVerdict: "APPROVED",
      canaryStatus: "NOT_STARTED",
      rollbackStatus: "NOT_REQUIRED",
      productionDecision: "PENDING",
      requestedConfig: {
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "Prompt v2",
        llmModel: "gpt-4o",
        maxTokens: 1200,
        isActive: true,
        capabilities: ["AgroToolsRegistry"],
      },
      promotedAt: null,
      rolledBackAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/agents/config/change-requests?scope=tenant")
      .send({
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "Prompt v2",
        llmModel: "gpt-4o",
        maxTokens: 1200,
        capabilities: ["AgroToolsRegistry"],
      })
      .expect(201);

    expect(response.body.status).toBe("READY_FOR_CANARY");
    expect(promptGovernance.createChangeRequest).toHaveBeenCalledWith(
      "company-a",
      expect.objectContaining({
        role: "agronomist",
        llmModel: "gpt-4o",
      }),
      "tenant",
    );
  });

  it("POST /api/rai/agents/config остаётся закрытым как legacy bypass route", async () => {
    await request(app.getHttpServer())
      .post("/api/rai/agents/config")
      .send({
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "legacy direct write",
        llmModel: "gpt-4o",
        maxTokens: 1200,
      })
      .expect(404);
  });

  it("POST /api/rai/chat отдаёт clarification overlay payload для agronomist tech_map_draft без контекста", async () => {
    intentRouter.classify.mockReturnValue({
      targetRole: "agronomist",
      intent: "generate_tech_map_draft",
      toolName: "generate_tech_map_draft",
      confidence: 0.88,
      method: "smoke",
      reason: "forced techmap route",
    });
    intentRouter.buildAutoToolCall.mockReturnValue(null);
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "agronomist" && companyId === "company-a") {
          return {
            id: "cfg-agronomist-company-a",
            name: "AgronomAgent",
            role: "agronomist",
            systemPrompt: "You are agronomist.",
            llmModel: "openai/gpt-4o",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["AgroToolsRegistry"],
            runtimeProfile: {
              profileId: "agronomist-runtime-v1",
              modelRoutingClass: "strong",
              provider: "openrouter",
              model: "openai/gpt-4o",
              maxInputTokens: 8000,
              maxOutputTokens: 4000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "agronom-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "deterministic_basis", "assumptions", "missing_data", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: true,
              fallbackMode: "deterministic_summary",
            },
            governancePolicy: {},
            autonomyMode: "advisory",
          };
        }
        return null;
      },
    );

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Составь черновик техкарты по озимому рапсу",
        workspaceContext: {
          route: "/consulting/techmaps",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("agronomist");
    expect(response.body.text).toContain("Чтобы подготовить техкарту");
    expect(response.body.pendingClarification).toEqual(
      expect.objectContaining({
        kind: "missing_context",
        intentId: "tech_map_draft",
      }),
    );
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "context_acquisition",
          parentWindowId: null,
          category: "clarification",
          priority: 85,
          mode: "panel",
          status: "needs_user_input",
        }),
        expect.objectContaining({
          type: "context_hint",
          parentWindowId: expect.any(String),
          category: "analysis",
          priority: 40,
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
            }),
          ]),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path возвращает completed result windows для agronomist tech_map_draft", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "agronomist" && companyId === "company-a") {
          return {
            id: "cfg-agronomist-company-a",
            name: "AgronomAgent",
            role: "agronomist",
            systemPrompt: "You are agronomist.",
            llmModel: "openai/gpt-4o",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["AgroToolsRegistry"],
            runtimeProfile: {
              profileId: "agronomist-runtime-v1",
              modelRoutingClass: "strong",
              provider: "openrouter",
              model: "openai/gpt-4o",
              maxInputTokens: 8000,
              maxOutputTokens: 4000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "agronom-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "deterministic_basis", "assumptions", "missing_data", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: true,
              fallbackMode: "deterministic_summary",
            },
            governancePolicy: {},
            autonomyMode: "advisory",
          };
        }
        return null;
      },
    );

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Составь черновик техкарты по озимому рапсу",
        clarificationResume: {
          windowId: "win-techmap-smoke",
          intentId: "tech_map_draft",
          agentRole: "agronomist",
          collectedContext: {
            fieldRef: "field-42",
            seasonRef: "season-42",
          },
        },
        workspaceContext: {
          route: "/consulting/techmaps/active",
          activeEntityRefs: [{ kind: "field", id: "field-42", label: "Поле 42" }],
          filters: {
            seasonId: "season-42",
          },
        },
        threadId: "thread-smoke-techmap",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("agronomist");
    expect(response.body.pendingClarification).toBeNull();
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          windowId: "win-techmap-smoke",
          type: "context_acquisition",
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
          windowId: "win-techmap-smoke-result-hint",
          type: "context_hint",
          parentWindowId: "win-techmap-smoke",
          category: "result",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
              targetWindowId: "win-techmap-smoke",
            }),
            expect.objectContaining({
              kind: "open_field_card",
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

  it("POST /api/rai/chat отдаёт clarification overlay payload для economist plan-fact без контекста", async () => {
    intentRouter.classify.mockReturnValue({
      targetRole: "economist",
      intent: "compute_plan_fact",
      toolName: "compute_plan_fact",
      confidence: 0.88,
      method: "smoke",
      reason: "forced finance route",
    });
    intentRouter.buildAutoToolCall.mockReturnValue({
      name: "compute_plan_fact",
      payload: {
        scope: {},
      },
    });
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "economist" && companyId === "company-a") {
          return {
            id: "cfg-economist-company-a",
            name: "EconomistAgent",
            role: "economist",
            systemPrompt: "You are economist.",
            llmModel: "openai/gpt-4o-mini",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["FinanceToolsRegistry"],
            runtimeProfile: {
              profileId: "economist-runtime-v1",
              modelRoutingClass: "fast",
              provider: "openrouter",
              model: "openai/gpt-4o-mini",
              maxInputTokens: 8000,
              maxOutputTokens: 3000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "economist-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: false,
              fallbackMode: "deterministic_summary",
            },
            governancePolicy: {},
            autonomyMode: "advisory",
          };
        }
        return null;
      },
    );

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Покажи план-факт по сезону",
        workspaceContext: {
          route: "/consulting/yield",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("economist");
    expect(response.body.text).toContain("Чтобы показать план-факт");
    expect(response.body.pendingClarification).toEqual(
      expect.objectContaining({
        kind: "missing_context",
        intentId: "compute_plan_fact",
        agentRole: "economist",
      }),
    );
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "context_acquisition",
          title: "Добор контекста для план-факта",
          category: "clarification",
          payload: expect.objectContaining({
            intentId: "compute_plan_fact",
            missingKeys: ["seasonId"],
          }),
        }),
        expect.objectContaining({
          type: "context_hint",
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

  it("POST /api/rai/chat отдаёт comparison work windows для economist scenario path", async () => {
    intentRouter.classify.mockReturnValue({
      targetRole: "economist",
      intent: "simulate_scenario",
      toolName: "simulate_scenario",
      confidence: 0.91,
      method: "smoke",
      reason: "forced scenario route",
    });
    intentRouter.buildAutoToolCall.mockReturnValue({
      name: "simulate_scenario",
      payload: {
        scope: {},
      },
    });
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "economist" && companyId === "company-a") {
          return {
            id: "cfg-economist-company-a",
            name: "EconomistAgent",
            role: "economist",
            systemPrompt: "You are economist.",
            llmModel: "openai/gpt-4o-mini",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["FinanceToolsRegistry"],
            runtimeProfile: {
              profileId: "economist-runtime-v1",
              modelRoutingClass: "fast",
              provider: "openrouter",
              model: "openai/gpt-4o-mini",
              maxInputTokens: 8000,
              maxOutputTokens: 3000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "economist-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: false,
              fallbackMode: "deterministic_summary",
            },
            governancePolicy: {},
            autonomyMode: "advisory",
          };
        }
        return null;
      },
    );

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Сравни сценарий по экономике",
        workspaceContext: {
          route: "/consulting/yield",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("economist");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "comparison",
          category: "analysis",
          mode: "takeover",
          payload: expect.objectContaining({
            columns: ["Текущий сценарий", "Комментарий"],
          }),
        }),
        expect.objectContaining({
          type: "related_signals",
          category: "signals",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
            }),
          ]),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path возвращает completed result windows для economist plan-fact", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "economist" && companyId === "company-a") {
          return {
            id: "cfg-economist-company-a",
            name: "EconomistAgent",
            role: "economist",
            systemPrompt: "You are economist.",
            llmModel: "openai/gpt-4o-mini",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["FinanceToolsRegistry"],
            runtimeProfile: {
              profileId: "economist-runtime-v1",
              modelRoutingClass: "fast",
              provider: "openrouter",
              model: "openai/gpt-4o-mini",
              maxInputTokens: 8000,
              maxOutputTokens: 3000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "economist-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: false,
              fallbackMode: "deterministic_summary",
            },
            governancePolicy: {},
            autonomyMode: "advisory",
          };
        }
        return null;
      },
    );
    (prismaProxyTyped.harvestPlan.findFirst as jest.Mock)
      .mockResolvedValueOnce({
        id: "plan-9",
        status: "ACTIVE",
        seasonId: "season-9",
        companyId: "company-a",
      })
      .mockResolvedValueOnce({
        id: "plan-9",
        status: "ACTIVE",
        seasonId: "season-9",
        companyId: "company-a",
      });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Покажи план-факт по сезону",
        clarificationResume: {
          windowId: "win-planfact-smoke",
          intentId: "compute_plan_fact",
          agentRole: "economist",
          collectedContext: {
            seasonId: "season-9",
          },
        },
        workspaceContext: {
          route: "/consulting/yield",
          filters: {
            seasonId: "season-9",
          },
        },
        threadId: "thread-smoke-planfact",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("economist");
    expect(response.body.pendingClarification).toBeNull();
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          windowId: "win-planfact-smoke",
          type: "context_acquisition",
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
          windowId: "win-planfact-smoke-result-hint",
          type: "context_hint",
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "focus_window",
              targetWindowId: "win-planfact-smoke",
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

  it("POST /api/rai/chat knowledge path возвращает structured_result и related_signals окна", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastMessagePreview: "Регламент по технике безопасности и производственной дисциплине.",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "регламент",
        workspaceContext: {
          route: "/knowledge/base",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("knowledge");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          category: "result",
          payload: expect.objectContaining({
            intentId: "query_knowledge",
          }),
        }),
        expect.objectContaining({
          type: "related_signals",
          category: "signals",
          payload: expect.objectContaining({
            intentId: "query_knowledge",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat monitoring path возвращает related_signals и structured_result окна", async () => {
    intentRouter.classify.mockReturnValueOnce({
      targetRole: "monitoring",
      intent: "emit_alerts",
      toolName: "EmitAlerts",
      confidence: 0.8,
      method: "smoke",
      reason: "forced monitoring route",
    });
    intentRouter.buildAutoToolCall.mockReturnValueOnce({
      name: "EmitAlerts",
      payload: { severity: "S4" },
    });
    (prismaProxyTyped.agroEscalation.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: "esc-1",
        severity: "S4",
        reason: "Резкий рост риска",
        status: "OPEN",
        references: { fieldRef: "FIELD-12" },
        createdAt: new Date("2026-03-07T10:00:00.000Z"),
      },
    ]);

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "покажи алерты",
        workspaceContext: {
          route: "/governance/security#incidents",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("monitoring");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "related_signals",
          category: "signals",
          payload: expect.objectContaining({
            intentId: "emit_alerts",
          }),
        }),
        expect.objectContaining({
          type: "structured_result",
          category: "analysis",
          payload: expect.objectContaining({
            intentId: "emit_alerts",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat исполняет future role через executionAdapterRole binding", async () => {
    intentRouter.classify.mockReturnValue({
      targetRole: "marketer",
      intent: null,
      toolName: null,
      confidence: 0.91,
      method: "smoke",
      reason: "forced marketer route",
    });
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "marketer" && companyId === "company-a") {
          return {
            id: "cfg-marketer-company-a",
            name: "MarketerAgent",
            role: "marketer",
            systemPrompt: "You are marketer.",
            llmModel: "openai/gpt-4o-mini",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["MarketingToolsRegistry"],
            runtimeProfile: {
              profileId: "marketer-runtime-v1",
              modelRoutingClass: "fast",
              provider: "openrouter",
              model: "openai/gpt-4o-mini",
              maxInputTokens: 8000,
              maxOutputTokens: 3000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
              executionAdapterRole: "knowledge",
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "marketer-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "recommendations", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: false,
              fallbackMode: "retrieval_summary",
            },
            governancePolicy: {},
            autonomyMode: "advisory",
          };
        }
        return null;
      },
    );

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Нужны идеи маркетинговой кампании по рапсу",
        workspaceContext: {
          route: "/marketing/campaigns",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("marketer");
    expect(response.body.outputContractVersion).toBe("v1");
    expect(typeof response.body.text).toBe("string");
  });

});
