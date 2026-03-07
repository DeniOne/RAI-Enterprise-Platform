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
      { provide: TechMapService, useValue: {} },
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
      { provide: KpiService, useValue: {} },
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

  const prismaProxy = createPrismaProxy();
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
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/agents/config")
      .expect(200);

    expect(response.body.agents).toEqual([
      expect.objectContaining({
        role: "agronomist",
        runtime: expect.objectContaining({
          source: "tenant",
          bindingsSource: "persisted",
        }),
      }),
    ]);
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
});
