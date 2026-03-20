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
import { AgentLifecycleReadModelService } from "./agent-lifecycle-read-model.service";
import { AgentLifecycleControlService } from "./agent-lifecycle-control.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { RedisService } from "../../shared/redis/redis.service";

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
    getRoutingDivergence: jest.fn(),
    captureRoutingCaseMemoryCandidate: jest.fn(),
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
  const agentLifecycleReadModel = {
    getSummary: jest.fn(),
    getAgents: jest.fn(),
    getHistory: jest.fn(),
  };
  const agentLifecycleControl = {
    setOverride: jest.fn(),
    clearOverride: jest.fn(),
  };
  const idempotencyInterceptor = {
    intercept: jest.fn((_: ExecutionContext, next: { handle: () => unknown }) =>
      next.handle(),
    ),
  };
  const redisService = {
    get: jest.fn(),
    del: jest.fn(),
    setNX: jest.fn(),
    set: jest.fn(),
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
        {
          provide: AgentLifecycleReadModelService,
          useValue: agentLifecycleReadModel,
        },
        {
          provide: AgentLifecycleControlService,
          useValue: agentLifecycleControl,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .overrideInterceptor(IdempotencyInterceptor)
      .useValue(idempotencyInterceptor)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("отдаёт routing divergence по tenant-scoped endpoint", async () => {
    explainabilityPanel.getRoutingDivergence.mockResolvedValue({
      companyId: "company-a",
      windowHours: 24,
      totalEvents: 5,
      mismatchedEvents: 2,
      divergenceRatePct: 40,
      semanticPrimaryCount: 1,
      topClusters: [],
      decisionBreakdown: [],
      collisionMatrix: [],
      agentBreakdown: [],
      failureClusters: [],
      caseMemoryCandidates: [],
      recentMismatches: [],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/routing/divergence")
      .query({ windowHours: 24, slice: "agro.techmaps.list-open-create" })
      .expect(200);

    expect(explainabilityPanel.getRoutingDivergence).toHaveBeenCalledWith({
      companyId: "company-a",
      windowHours: 24,
      slice: "agro.techmaps.list-open-create",
      decisionType: undefined,
      targetRole: undefined,
      onlyMismatches: false,
    });
    expect(response.body).toMatchObject({
      companyId: "company-a",
      totalEvents: 5,
      mismatchedEvents: 2,
    });
  });

  it("POST /api/rai/explainability/routing/case-memory-candidates/capture фиксирует candidate", async () => {
    explainabilityPanel.captureRoutingCaseMemoryCandidate.mockResolvedValue({
      status: "captured",
      candidateKey:
        "agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset",
      auditLogId: "audit-1",
      capturedAt: "2026-03-20T12:00:00.000Z",
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/explainability/routing/case-memory-candidates/capture")
      .set("Idempotency-Key", "routing-case-memory-candidate-capture:test")
      .send({
        key: "agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset",
        windowHours: 24,
        slice: "agro.techmaps.list-open-create",
        targetRole: "agronomist",
        note: "операторский захват",
      })
      .expect(201);

    expect(explainabilityPanel.captureRoutingCaseMemoryCandidate).toHaveBeenCalledWith({
      companyId: "company-a",
      userId: "u-test",
      key: "agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset",
      windowHours: 24,
      slice: "agro.techmaps.list-open-create",
      targetRole: "agronomist",
      note: "операторский захват",
    });
    expect(response.body).toMatchObject({
      status: "captured",
      auditLogId: "audit-1",
    });
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

  it("GET /api/rai/explainability/lifecycle/summary отдаёт lifecycle summary", async () => {
    agentLifecycleReadModel.getSummary.mockResolvedValue({
      companyId: "company-a",
      templateCatalogCount: 8,
      totalTrackedRoles: 9,
      stateCounts: {
        FUTURE_ROLE: 2,
        PROMOTION_CANDIDATE: 1,
        CANARY: 1,
        CANONICAL_ACTIVE: 4,
        FROZEN: 1,
        ROLLED_BACK: 0,
        RETIRED: 0,
      },
      activeCanaries: [],
      degradedCanaries: [],
      promotionCandidates: [],
      rolledBackRoles: [],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/lifecycle/summary")
      .expect(200);

    expect(response.body.totalTrackedRoles).toBe(9);
    expect(agentLifecycleReadModel.getSummary).toHaveBeenCalledWith("company-a");
  });

  it("GET /api/rai/explainability/lifecycle/agents отдаёт lifecycle table", async () => {
    agentLifecycleReadModel.getAgents.mockResolvedValue([
      {
        role: "contracts_agent",
        agentName: "ContractsAgent",
        ownerDomain: "commerce",
        class: "canonical",
        lifecycleState: "CANARY",
        runtimeActive: true,
        tenantAccessMode: "INHERITED",
        effectiveConfigId: "cfg-1",
        candidateVersion: "v2",
        latestChangeRequestId: "chg-1",
        changeRequestStatus: "CANARY_ACTIVE",
        canaryStatus: "ACTIVE",
        rollbackStatus: "NOT_REQUIRED",
        productionDecision: "PENDING",
        currentVersion: "v2",
        stableVersion: "cfg-1",
        previousStableVersion: null,
        versionDelta: "AHEAD_OF_STABLE",
        promotedAt: null,
        rolledBackAt: null,
        updatedAt: "2026-03-10T00:00:00.000Z",
        lifecycleOverride: null,
        lineage: [],
        notes: [],
      },
    ]);

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/lifecycle/agents")
      .expect(200);

    expect(response.body[0].role).toBe("contracts_agent");
    expect(agentLifecycleReadModel.getAgents).toHaveBeenCalledWith("company-a");
  });

  it("GET /api/rai/explainability/lifecycle/history отдаёт lifecycle history", async () => {
    agentLifecycleReadModel.getHistory.mockResolvedValue([
      {
        role: "crm_agent",
        state: "FROZEN",
        reason: "manual freeze",
        isActive: true,
        createdAt: "2026-03-10T00:00:00.000Z",
        updatedAt: "2026-03-10T00:00:00.000Z",
        clearedAt: null,
        createdByUserId: "u-1",
        clearedByUserId: null,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get("/api/rai/explainability/lifecycle/history?limit=5")
      .expect(200);

    expect(response.body[0].role).toBe("crm_agent");
    expect(agentLifecycleReadModel.getHistory).toHaveBeenCalledWith("company-a", 5);
  });

  it("POST /api/rai/explainability/lifecycle/override включает freeze/retire override", async () => {
    agentLifecycleControl.setOverride.mockResolvedValue(undefined);
    agentLifecycleReadModel.getAgents.mockResolvedValue([
      {
        role: "crm_agent",
        agentName: "CrmAgent",
        ownerDomain: "crm",
        class: "canonical",
        lifecycleState: "FROZEN",
        runtimeActive: false,
        tenantAccessMode: "DENIED",
        effectiveConfigId: "cfg-1",
        candidateVersion: null,
        latestChangeRequestId: null,
        changeRequestStatus: null,
        canaryStatus: null,
        rollbackStatus: null,
        productionDecision: null,
        currentVersion: "cfg-1",
        stableVersion: "cfg-1",
        previousStableVersion: null,
        versionDelta: "MATCHES_STABLE",
        promotedAt: null,
        rolledBackAt: null,
        updatedAt: null,
        lifecycleOverride: {
          state: "FROZEN",
          reason: "manual freeze",
          createdAt: "2026-03-10T00:00:00.000Z",
          createdByUserId: "u-test",
        },
        lineage: [],
        notes: ["manual_lifecycle_override"],
      },
    ]);

    const response = await request(app.getHttpServer())
      .post("/api/rai/explainability/lifecycle/override")
      .send({ role: "crm_agent", state: "FROZEN", reason: "manual freeze" })
      .expect(201);

    expect(response.body[0].lifecycleState).toBe("FROZEN");
    expect(agentLifecycleControl.setOverride).toHaveBeenCalledWith({
      companyId: "company-a",
      role: "crm_agent",
      state: "FROZEN",
      reason: "manual freeze",
      userId: undefined,
    });
  });

  it("POST /api/rai/explainability/lifecycle/override/clear снимает lifecycle override", async () => {
    agentLifecycleControl.clearOverride.mockResolvedValue(undefined);
    agentLifecycleReadModel.getAgents.mockResolvedValue([]);

    await request(app.getHttpServer())
      .post("/api/rai/explainability/lifecycle/override/clear")
      .send({ role: "crm_agent" })
      .expect(201);

    expect(agentLifecycleControl.clearOverride).toHaveBeenCalledWith({
      companyId: "company-a",
      role: "crm_agent",
      userId: undefined,
    });
  });
});
