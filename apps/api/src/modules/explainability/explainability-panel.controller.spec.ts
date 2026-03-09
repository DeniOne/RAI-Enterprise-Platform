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
import { RuntimeGovernanceControlService } from "./runtime-governance-control.service";
import { RuntimeGovernanceDrilldownService } from "./runtime-governance-drilldown.service";

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
  const runtimeGovernanceControl = {
    setManualAutonomyOverride: jest.fn(),
    clearManualAutonomyOverride: jest.fn(),
  };
  const runtimeGovernanceDrilldowns = {
    getDrilldowns: jest.fn(),
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
        {
          provide: RuntimeGovernanceControlService,
          useValue: runtimeGovernanceControl,
        },
        {
          provide: RuntimeGovernanceDrilldownService,
          useValue: runtimeGovernanceDrilldowns,
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

  it("POST /api/rai/explainability/runtime-governance/autonomy/override включает manual override", async () => {
    runtimeGovernanceControl.setManualAutonomyOverride.mockResolvedValue({
      level: "QUARANTINE",
      avgBsScorePct: 18,
      knownTraceCount: 4,
      driver: "MANUAL_OVERRIDE",
      activeQualityAlert: false,
      manualOverride: {
        active: true,
        level: "QUARANTINE",
        reason: "manual operator decision",
        createdAt: "2026-03-09T15:30:00.000Z",
        createdByUserId: "u-test",
      },
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/explainability/runtime-governance/autonomy/override")
      .send({ level: "QUARANTINE", reason: "manual operator decision" })
      .expect(201);

    expect(response.body.driver).toBe("MANUAL_OVERRIDE");
    expect(runtimeGovernanceControl.setManualAutonomyOverride).toHaveBeenCalledWith({
      companyId: "company-a",
      level: "QUARANTINE",
      reason: "manual operator decision",
      userId: undefined,
    });
  });

  it("POST /api/rai/explainability/runtime-governance/autonomy/override/clear снимает manual override", async () => {
    runtimeGovernanceControl.clearManualAutonomyOverride.mockResolvedValue({
      level: "TOOL_FIRST",
      avgBsScorePct: 11,
      knownTraceCount: 6,
      driver: "BS_AVG_TOOL_FIRST",
      activeQualityAlert: false,
      manualOverride: null,
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/explainability/runtime-governance/autonomy/override/clear")
      .expect(201);

    expect(response.body.manualOverride).toBeNull();
    expect(runtimeGovernanceControl.clearManualAutonomyOverride).toHaveBeenCalledWith({
      companyId: "company-a",
      userId: undefined,
    });
  });

  it("GET /api/rai/explainability/runtime-governance/drilldowns отдаёт drilldowns", async () => {
    runtimeGovernanceDrilldowns.getDrilldowns.mockResolvedValue({
      flags: {
        apiEnabled: true,
        uiEnabled: true,
        enforcementEnabled: true,
        autoQuarantineEnabled: true,
      },
      fallbackHistory: [],
      qualityDriftHistory: [],
      budgetHotspots: [],
      queueSaturationTimeline: [],
      correlation: [],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/runtime-governance/drilldowns?timeWindowMs=120000&agentRole=crm_agent")
      .expect(200);

    expect(response.body.flags.apiEnabled).toBe(true);
    expect(runtimeGovernanceDrilldowns.getDrilldowns).toHaveBeenCalledWith(
      "company-a",
      120000,
      "crm_agent",
    );
  });
});
