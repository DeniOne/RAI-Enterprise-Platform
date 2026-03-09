import { CanActivate, ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { ExplainabilityPanelController } from "./explainability-panel.controller";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { CostAnalyticsService } from "./cost-analytics.service";
import { TraceTopologyService } from "./trace-topology.service";
import { SafeReplayService } from "../rai-chat/safe-replay.service";
import { PerformanceMetricsService } from "../rai-chat/performance/performance-metrics.service";
import { AutonomyPolicyService } from "../rai-chat/autonomy-policy.service";
import { RuntimeGovernanceReadModelService } from "./runtime-governance-read-model.service";

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: "u-test", companyId: "company-a", role: "ADMIN" };
    return true;
  }
}

class TestRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe("ExplainabilityPanelController (HTTP)", () => {
  let app: INestApplication;

  const tenantContext = {
    getCompanyId: jest.fn(() => "company-a"),
  };
  const explainabilityPanel = {
    getTruthfulnessDashboard: jest.fn(),
    getQueuePressure: jest.fn(),
    getTraceTimeline: jest.fn(),
    getTraceForensics: jest.fn(),
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
  const performanceMetrics = {
    getAggregatedMetrics: jest.fn(),
  };
  const autonomyPolicy = {
    getCompanyAutonomyStatus: jest.fn(),
  };
  const runtimeGovernanceReadModel = {
    getSummary: jest.fn(),
    getAgents: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ExplainabilityPanelController],
      providers: [
        { provide: TenantContextService, useValue: tenantContext },
        { provide: ExplainabilityPanelService, useValue: explainabilityPanel },
        { provide: CostAnalyticsService, useValue: costAnalytics },
        { provide: TraceTopologyService, useValue: traceTopology },
        { provide: SafeReplayService, useValue: safeReplay },
        { provide: PerformanceMetricsService, useValue: performanceMetrics },
        { provide: AutonomyPolicyService, useValue: autonomyPolicy },
        {
          provide: RuntimeGovernanceReadModelService,
          useValue: runtimeGovernanceReadModel,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
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
  });

  it("GET /api/rai/explainability/runtime-governance/summary отдаёт governance summary", async () => {
    runtimeGovernanceReadModel.getSummary.mockResolvedValue({
      companyId: "company-a",
      queuePressure: {
        pressureState: "SATURATED",
        signalFresh: true,
        totalBacklog: 12,
        hottestQueue: "runtime_active_tool_calls",
        observedQueues: [],
      },
      topFallbackReasons: [{ fallbackReason: "BUDGET_DENIED", count: 3 }],
      recentIncidents: [],
      activeRecommendations: [],
      quality: {
        avgBsScorePct: 22,
        avgEvidenceCoveragePct: 78,
        qualityAlertCount: 1,
      },
      autonomy: {
        level: "advisory",
        avgBsScorePct: 22,
        knownTraceCount: 10,
        driver: null,
        activeQualityAlert: true,
      },
      hottestAgents: [],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/runtime-governance/summary?timeWindowMs=60000")
      .expect(200);

    expect(response.body.queuePressure.pressureState).toBe("SATURATED");
    expect(runtimeGovernanceReadModel.getSummary).toHaveBeenCalledWith(
      "company-a",
      60000,
    );
  });

  it("GET /api/rai/explainability/runtime-governance/agents отдаёт per-agent reliability", async () => {
    runtimeGovernanceReadModel.getAgents.mockResolvedValue([
      {
        agentRole: "crm_agent",
        executionCount: 4,
        successRatePct: 50,
        fallbackRatePct: 25,
        budgetDeniedRatePct: 25,
        budgetDegradedRatePct: 0,
        policyBlockRatePct: 0,
        needsMoreDataRatePct: 0,
        toolFailureRatePct: 0,
        avgLatencyMs: 150,
        p95LatencyMs: 200,
        avgBsScorePct: 12,
        avgEvidenceCoveragePct: 88,
        incidentCount: 1,
        lastRecommendation: "REVIEW_REQUIRED",
      },
    ]);

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/runtime-governance/agents")
      .expect(200);

    expect(response.body[0].agentRole).toBe("crm_agent");
    expect(runtimeGovernanceReadModel.getAgents).toHaveBeenCalledWith(
      "company-a",
      3600000,
    );
  });
});
