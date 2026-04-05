import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  NestInterceptor,
  CallHandler,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Test } from "@nestjs/testing";
import { Provider } from "@nestjs/common";
import { Observable } from "rxjs";
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
import { IdempotencyInterceptor } from "../src/shared/idempotency/idempotency.interceptor";

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

class PassThroughIdempotencyInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle();
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
  const configService = {
    get: jest.fn((key: string) => {
      if (key === "LOOKUP_PROVIDER_PRIMARY") return "DADATA";
      return process.env[key];
    }),
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
  prismaProxyTyped.$transaction = jest.fn(async (input: unknown) => {
    if (typeof input === "function") {
      return input(prismaProxyTyped);
    }
    return input;
  });
  const unsafeQueryRawKey = "$queryRawUnsafe";
  const unsafeExecuteRawKey = "$executeRawUnsafe";
  prismaProxyTyped.$queryRaw = jest.fn().mockResolvedValue([]);
  prismaProxyTyped.$executeRaw = jest.fn().mockResolvedValue(0);
  prismaProxyTyped[unsafeQueryRawKey] = jest.fn().mockResolvedValue([]);
  prismaProxyTyped[unsafeExecuteRawKey] = jest.fn().mockResolvedValue(0);
  prismaProxyTyped.safeQueryRaw = jest.fn().mockResolvedValue([]);
  prismaProxyTyped.safeExecuteRaw = jest.fn().mockResolvedValue(0);
  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    setNX: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    isReady: jest.fn(() => false),
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
  const buildContractsAgentConfig = (companyId = "company-a") => ({
    id: `cfg-contracts-${companyId}`,
    name: "ContractsAgent",
    role: "contracts_agent",
    systemPrompt: "You are contracts agent.",
    llmModel: "openai/gpt-5-mini",
    maxTokens: 8000,
    isActive: true,
    companyId,
    capabilities: ["ContractsToolsRegistry"],
    runtimeProfile: {
      profileId: "contracts-runtime-v1",
      modelRoutingClass: "strong",
      provider: "openrouter",
      model: "openai/gpt-5-mini",
      maxInputTokens: 8000,
      maxOutputTokens: 4000,
      temperature: 0.1,
      timeoutMs: 20000,
      supportsStreaming: false,
    },
    memoryPolicy: {},
    outputContract: {
      contractId: "contracts-agent-v1",
      responseSchemaVersion: "v1",
      sections: ["summary", "commerce_state", "evidence"],
      requiresEvidence: true,
      requiresDeterministicValidation: true,
      fallbackMode: "deterministic_summary",
    },
    governancePolicy: {},
    autonomyMode: "advisory",
  });

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "smoke-secret";
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        RaiChatModule,
        ExplainabilityPanelModule,
      ],
      providers: [memoryAdapterProvider],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .overrideInterceptor(IdempotencyInterceptor)
      .useClass(PassThroughIdempotencyInterceptor)
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
      .overrideProvider(ConfigService)
      .useValue(configService)
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
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tenantContext.getCompanyId.mockReturnValue("company-a");
    tenantContext.getStore.mockReturnValue({ companyId: "company-a" });
    configService.get.mockImplementation((key: string) => {
      if (key === "LOOKUP_PROVIDER_PRIMARY") return "DADATA";
      return process.env[key];
    });
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
          activeEntityRefs: [{ kind: "field", id: "field-42" }],
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

  it("POST /api/rai/chat отдаёт clarification windows для contracts_agent при нехватке контекста договора", async () => {
    intentRouter.classify.mockReturnValue({
      targetRole: "contracts_agent",
      intent: "create_commerce_contract",
      toolName: "create_commerce_contract",
      confidence: 0.93,
      method: "smoke",
      reason: "forced contracts route",
    });
    intentRouter.buildAutoToolCall.mockReturnValue({
      name: "create_commerce_contract",
      payload: {
        number: "DOG-001",
      },
    });
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return {
            id: "cfg-contracts-company-a",
            name: "ContractsAgent",
            role: "contracts_agent",
            systemPrompt: "You are contracts agent.",
            llmModel: "openai/gpt-5-mini",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["ContractsToolsRegistry"],
            runtimeProfile: {
              profileId: "contracts-runtime-v1",
              modelRoutingClass: "strong",
              provider: "openrouter",
              model: "openai/gpt-5-mini",
              maxInputTokens: 8000,
              maxOutputTokens: 4000,
              temperature: 0.1,
              timeoutMs: 20000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "contracts-agent-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "commerce_state", "evidence"],
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
        message: "Давай заключим новый договор с Казьминский",
        workspaceContext: {
          route: "/commerce/contracts",
        },
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Не хватает контекста");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "context_acquisition",
          category: "clarification",
          title: "Нужен контекст для commerce-операции",
          status: "needs_user_input",
          payload: expect.objectContaining({
            intentId: "create_commerce_contract",
            missingKeys: expect.arrayContaining([
              "validFrom",
              "jurisdictionId",
              "roles",
            ]),
          }),
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "open_route",
              targetRoute: "/commerce/contracts/create",
            }),
          ]),
        }),
        expect.objectContaining({
          type: "context_hint",
          category: "analysis",
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path создаёт договор через contracts_agent и возвращает rich result", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return {
            id: "cfg-contracts-company-a",
            name: "ContractsAgent",
            role: "contracts_agent",
            systemPrompt: "You are contracts agent.",
            llmModel: "openai/gpt-5-mini",
            maxTokens: 8000,
            isActive: true,
            companyId: "company-a",
            capabilities: ["ContractsToolsRegistry"],
            runtimeProfile: {
              profileId: "contracts-runtime-v1",
              modelRoutingClass: "strong",
              provider: "openrouter",
              model: "openai/gpt-5-mini",
              maxInputTokens: 8000,
              maxOutputTokens: 4000,
              temperature: 0.1,
              timeoutMs: 20000,
              supportsStreaming: false,
            },
            memoryPolicy: {},
            outputContract: {
              contractId: "contracts-agent-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "commerce_state", "evidence"],
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
    (prismaProxyTyped.party.findMany as jest.Mock).mockResolvedValueOnce([
      { id: "party-1", companyId: "company-a" },
    ]);
    (prismaProxyTyped.commerceContract.create as jest.Mock).mockResolvedValueOnce({
      id: "contract-1",
      number: "DOG-001",
      type: "SUPPLY",
      status: "DRAFT",
      validFrom: new Date("2026-03-09T00:00:00.000Z"),
      validTo: null,
      jurisdictionId: "jur-1",
      regulatoryProfileId: null,
      roles: [
        {
          id: "role-1",
          partyId: "party-1",
          role: "BUYER",
          isPrimary: true,
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Заключим договор поставки",
        clarificationResume: {
          windowId: "win-contract-smoke",
          intentId: "create_commerce_contract",
          agentRole: "contracts_agent",
          collectedContext: {
            number: "DOG-001",
            type: "SUPPLY",
            validFrom: "2026-03-09T00:00:00.000Z",
            jurisdictionId: "jur-1",
            roles: [{ partyId: "party-1", role: "BUYER", isPrimary: true }],
          },
        },
        workspaceContext: {
          route: "/commerce/contracts",
        },
        threadId: "thread-smoke-contract",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Договор DOG-001 создан");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          category: "result",
          title: "Договор создан",
          payload: expect.objectContaining({
            intentId: "create_commerce_contract",
            summary: "Создан договор DOG-001.",
            sections: expect.arrayContaining([
              expect.objectContaining({
                title: "Договор",
              }),
            ]),
          }),
          actions: expect.arrayContaining([
            expect.objectContaining({
              kind: "open_route",
              targetRoute: "/commerce/contracts/contract-1",
            }),
          ]),
        }),
        expect.objectContaining({
          type: "related_signals",
          category: "signals",
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path создаёт обязательство через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.commerceContract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "contract-1",
      companyId: "company-a",
    });
    (prismaProxyTyped.commerceObligation.create as jest.Mock).mockResolvedValueOnce({
      id: "obligation-1",
      contractId: "contract-1",
      type: "DELIVER",
      status: "OPEN",
      dueDate: new Date("2026-03-15T00:00:00.000Z"),
      createdAt: new Date("2026-03-09T00:00:00.000Z"),
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Создай обязательство DELIVER",
        clarificationResume: {
          windowId: "win-obligation-smoke",
          intentId: "create_contract_obligation",
          agentRole: "contracts_agent",
          collectedContext: {
            contractId: "contract-1",
            obligationType: "DELIVER",
            dueDate: "2026-03-15T00:00:00.000Z",
          },
        },
        workspaceContext: {
          route: "/commerce/contracts/contract-1",
        },
        threadId: "thread-smoke-obligation",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Обязательство obligation-1 создано");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Обязательство создано",
          payload: expect.objectContaining({
            intentId: "create_contract_obligation",
            summary: "Создано обязательство obligation-1.",
            sections: expect.arrayContaining([
              expect.objectContaining({
                title: "Обязательство",
              }),
            ]),
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path фиксирует исполнение через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.commerceObligation.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "obligation-1",
      companyId: "company-a",
    });
    (prismaProxyTyped.commerceFulfillmentEvent.create as jest.Mock).mockResolvedValueOnce({
      id: "fulfillment-1",
      obligationId: "obligation-1",
      eventDomain: "COMMERCIAL",
      eventType: "GOODS_SHIPMENT",
      eventDate: new Date("2026-03-10T00:00:00.000Z"),
      payloadJson: { batchId: "batch-1", itemId: "item-1", uom: "kg", qty: 10 },
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
    });
    (prismaProxyTyped.stockMove.create as jest.Mock).mockResolvedValueOnce({
      id: "stock-move-1",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Зафиксируй исполнение",
        clarificationResume: {
          windowId: "win-fulfillment-smoke",
          intentId: "create_fulfillment_event",
          agentRole: "contracts_agent",
          collectedContext: {
            obligationId: "obligation-1",
            eventDomain: "COMMERCIAL",
            eventType: "GOODS_SHIPMENT",
            eventDate: "2026-03-10T00:00:00.000Z",
            batchId: "batch-1",
            itemId: "item-1",
            uom: "kg",
            qty: 10,
          },
        },
        workspaceContext: {
          route: "/commerce/fulfillment",
        },
        threadId: "thread-smoke-fulfillment",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Событие исполнения fulfillment-1 зафиксировано");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Исполнение зафиксировано",
          payload: expect.objectContaining({
            intentId: "create_fulfillment_event",
            summary: "Событие исполнения fulfillment-1 зафиксировано.",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path создаёт счёт из исполнения через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.commerceFulfillmentEvent.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "fulfillment-1",
      companyId: "company-a",
      obligationId: "obligation-1",
      obligation: {
        contractId: "contract-1",
      },
    });
    (prismaProxyTyped.invoice.create as jest.Mock).mockResolvedValueOnce({
      id: "invoice-1",
      contractId: "contract-1",
      obligationId: "obligation-1",
      fulfillmentEventId: "fulfillment-1",
      direction: "AR",
      status: "ISSUED",
      subtotal: "1000",
      taxTotal: "200",
      grandTotal: "1200",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Сформируй счёт",
        clarificationResume: {
          windowId: "win-invoice-smoke",
          intentId: "create_invoice_from_fulfillment",
          agentRole: "contracts_agent",
          collectedContext: {
            fulfillmentEventId: "fulfillment-1",
            sellerJurisdiction: "RU",
            buyerJurisdiction: "RU",
            supplyType: "GOODS",
            vatPayerStatus: "PAYER",
            subtotal: 1000,
          },
        },
        workspaceContext: {
          route: "/commerce/invoices",
        },
        threadId: "thread-smoke-invoice",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Счёт invoice-1 создан");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Счёт создан",
          payload: expect.objectContaining({
            intentId: "create_invoice_from_fulfillment",
            summary: "Счёт invoice-1 создан на сумму 1 200 ₽.",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path разносит платёж через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.payment.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "payment-1",
      companyId: "company-a",
    });
    (prismaProxyTyped.invoice.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "invoice-1",
      companyId: "company-a",
    });
    (prismaProxyTyped.paymentAllocation.create as jest.Mock).mockResolvedValueOnce({
      id: "allocation-1",
      paymentId: "payment-1",
      invoiceId: "invoice-1",
      allocatedAmount: "1200",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Разнеси платёж",
        clarificationResume: {
          windowId: "win-allocation-smoke",
          intentId: "allocate_payment",
          agentRole: "contracts_agent",
          collectedContext: {
            paymentId: "payment-1",
            invoiceId: "invoice-1",
            allocatedAmount: 1200,
          },
        },
        workspaceContext: {
          route: "/commerce/payments",
        },
        threadId: "thread-smoke-allocation",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Платёж payment-1 разнесён на счёт invoice-1");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Платёж разнесён",
          payload: expect.objectContaining({
            intentId: "allocate_payment",
            summary: "Платёж payment-1 разнесён на счёт invoice-1.",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path создаёт платёж через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.party.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: "party-payer",
        companyId: "company-a",
      })
      .mockResolvedValueOnce({
        id: "party-payee",
        companyId: "company-a",
      });
    (prismaProxyTyped.payment.create as jest.Mock).mockResolvedValueOnce({
      id: "payment-1",
      payerPartyId: "party-payer",
      payeePartyId: "party-payee",
      amount: "1200",
      currency: "RUB",
      paymentMethod: "WIRE",
      status: "PENDING",
      paidAt: new Date("2026-03-11T00:00:00.000Z"),
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Создай платёж",
        clarificationResume: {
          windowId: "win-payment-smoke",
          intentId: "create_payment",
          agentRole: "contracts_agent",
          collectedContext: {
            payerPartyId: "party-payer",
            payeePartyId: "party-payee",
            amount: 1200,
            currency: "RUB",
            paymentMethod: "WIRE",
          },
        },
        workspaceContext: {
          route: "/commerce/payments",
        },
        threadId: "thread-smoke-payment",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Платёж payment-1 создан");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Платёж создан",
          payload: expect.objectContaining({
            intentId: "create_payment",
            summary: "Платёж payment-1 создан.",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path подтверждает платёж через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.payment.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "payment-1",
      ledgerTxId: null,
    });
    (prismaProxyTyped.payment.update as jest.Mock).mockResolvedValueOnce({
      id: "payment-1",
      status: "CONFIRMED",
      ledgerTxId: "ledger-pay-payment-1",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Подтверди платёж",
        clarificationResume: {
          windowId: "win-payment-confirm-smoke",
          intentId: "confirm_payment",
          agentRole: "contracts_agent",
          collectedContext: {
            paymentId: "payment-1",
          },
        },
        workspaceContext: {
          route: "/commerce/payments",
        },
        threadId: "thread-smoke-payment-confirm",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Платёж payment-1 подтверждён");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Платёж подтверждён",
          payload: expect.objectContaining({
            intentId: "confirm_payment",
            summary: "Платёж payment-1 подтверждён.",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path проводит счёт через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.invoice.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "invoice-1",
      ledgerTxId: null,
    });
    (prismaProxyTyped.invoice.update as jest.Mock).mockResolvedValueOnce({
      id: "invoice-1",
      status: "POSTED",
      ledgerTxId: "ledger-inv-invoice-1",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Проведи счёт",
        clarificationResume: {
          windowId: "win-post-invoice-smoke",
          intentId: "post_invoice",
          agentRole: "contracts_agent",
          collectedContext: {
            invoiceId: "invoice-1",
          },
        },
        workspaceContext: {
          route: "/commerce/invoices",
        },
        threadId: "thread-smoke-post-invoice",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("Счёт invoice-1 проведён");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Счёт проведён",
          payload: expect.objectContaining({
            intentId: "post_invoice",
            summary: "Счёт invoice-1 проведён.",
          }),
        }),
      ]),
    );
  });

  it("POST /api/rai/chat resume-path показывает дебиторский остаток через contracts_agent", async () => {
    (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
      async ({
        where,
      }: {
        where: { agent_config_role_company_unique: { role: string; companyId: string | null } };
      }) => {
        const { role, companyId } = where.agent_config_role_company_unique;
        if (role === "contracts_agent" && companyId === "company-a") {
          return buildContractsAgentConfig("company-a");
        }
        return null;
      },
    );
    (prismaProxyTyped.invoice.findUnique as jest.Mock).mockResolvedValue({
      id: "invoice-1",
      grandTotal: 1200,
    });
    (prismaProxyTyped.paymentAllocation.findMany as jest.Mock).mockResolvedValue([
      { allocatedAmount: "200" },
      { allocatedAmount: "300" },
    ]);

    const response = await request(app.getHttpServer())
      .post("/api/rai/chat")
      .send({
        message: "Покажи дебиторку",
        clarificationResume: {
          windowId: "win-ar-balance-smoke",
          intentId: "review_ar_balance",
          agentRole: "contracts_agent",
          collectedContext: {
            invoiceId: "invoice-1",
          },
        },
        workspaceContext: {
          route: "/commerce/invoices",
        },
        threadId: "thread-smoke-ar-balance",
      })
      .expect(201);

    expect(response.body.agentRole).toBe("contracts_agent");
    expect(response.body.pendingClarification).toBeUndefined();
    expect(response.body.text).toContain("700");
    expect(response.body.workWindows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "structured_result",
          title: "Дебиторский остаток",
          payload: expect.objectContaining({
            intentId: "review_ar_balance",
            summary: "Остаток по счёту invoice-1: 700 ₽.",
          }),
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

  describe("HTTP e2e: planner path + control-tower audit (POST /api/rai/chat)", () => {
    let prevPlanner: string | undefined;

    beforeEach(() => {
      prevPlanner = process.env.RAI_PLANNER_RUNTIME_ENABLED;
      process.env.RAI_PLANNER_RUNTIME_ENABLED = "true";
      (prismaProxyTyped.aiAuditEntry.create as jest.Mock).mockResolvedValue({
        id: "audit-planner-http-e2e",
      });
    });

    afterEach(() => {
      if (prevPlanner === undefined) {
        delete process.env.RAI_PLANNER_RUNTIME_ENABLED;
      } else {
        process.env.RAI_PLANNER_RUNTIME_ENABLED = prevPlanner;
      }
    });

    it("resume tech_map_draft: ответ с executionSurface и audit metadata.controlTowerPlannerEnvelope", async () => {
      (prismaProxyTyped.agentConfiguration.findUnique as jest.Mock).mockImplementation(
        async ({
          where,
        }: {
          where: {
            agent_config_role_company_unique: {
              role: string;
              companyId: string | null;
            };
          };
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
                sections: [
                  "summary",
                  "deterministic_basis",
                  "assumptions",
                  "missing_data",
                  "evidence",
                ],
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
            activeEntityRefs: [{ kind: "field", id: "field-42" }],
            filters: {
              seasonId: "season-42",
            },
          },
          threadId: "thread-smoke-techmap",
        })
        .expect(201);

      expect(response.body.agentRole).toBe("agronomist");
      expect(response.body.executionSurface).toBeDefined();
      expect(Array.isArray(response.body.executionSurface?.branches)).toBe(
        true,
      );
      expect(response.body.executionSurface.branches.length).toBeGreaterThan(0);

      expect(prismaProxyTyped.aiAuditEntry.create).toHaveBeenCalled();
      const createArg = (prismaProxyTyped.aiAuditEntry.create as jest.Mock).mock
        .calls[0][0];
      const meta = createArg.data.metadata as Record<string, unknown>;
      expect(meta.controlTowerPlannerEnvelope).toEqual(
        expect.objectContaining({
          schemaVersion: "control_tower.planner_envelope.v1",
          traceId: expect.stringMatching(/^tr_/),
          companyId: "company-a",
          promotion: expect.objectContaining({ enabled: true }),
          plannerSignals: expect.objectContaining({
            telemetryPresent: true,
            branchCount: expect.any(Number),
          }),
        }),
      );
      expect(meta.controlTowerSubIntentGraphSnapshot).toEqual(
        expect.objectContaining({
          schemaVersion: "control_tower.sub_intent_graph.v1",
          graphId: expect.any(String),
          version: "v1",
          branches: expect.any(Array),
        }),
      );
      expect(meta.plannerBranchTelemetry).toEqual(
        expect.objectContaining({
          branches: expect.any(Array),
        }),
      );
    });
  });

});
