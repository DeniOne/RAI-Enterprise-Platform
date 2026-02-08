import { CanActivate, ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { AdvisoryController } from "./advisory.controller";
import { AdvisoryService } from "./advisory.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: "u-test", companyId: "c-test", role: "ADMIN" };
    return true;
  }
}

describe("AdvisoryController (HTTP)", () => {
  let app: INestApplication;

  const advisoryServiceMock = {
    getPendingRecommendations: jest.fn(),
    getPilotStatus: jest.fn(),
    getPilotCohort: jest.fn(),
    enablePilot: jest.fn(),
    disablePilot: jest.fn(),
    addPilotUser: jest.fn(),
    removePilotUser: jest.fn(),
    getTuningThresholds: jest.fn(),
    updateTuningThresholds: jest.fn(),
    getOpsMetrics: jest.fn(),
    getKillSwitchStatus: jest.fn(),
    getRolloutStatus: jest.fn(),
    configureRollout: jest.fn(),
    evaluateRolloutGate: jest.fn(),
    promoteRolloutStage: jest.fn(),
    rollbackRolloutStage: jest.fn(),
    enableKillSwitch: jest.fn(),
    disableKillSwitch: jest.fn(),
    acceptRecommendation: jest.fn(),
    rejectRecommendation: jest.fn(),
    recordFeedback: jest.fn(),
    getFeedback: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdvisoryController],
      providers: [{ provide: AdvisoryService, useValue: advisoryServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
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
  });

  it("GET /api/advisory/pilot/status", async () => {
    advisoryServiceMock.getPilotStatus.mockResolvedValue({ enabled: true, scope: "COMPANY", companyId: "c-test" });

    const response = await request(app.getHttpServer()).get("/api/advisory/pilot/status").expect(200);

    expect(response.body.enabled).toBe(true);
  });

  it("GET /api/advisory/pilot/cohort", async () => {
    advisoryServiceMock.getPilotCohort.mockResolvedValue([{ userId: "u-1", enabled: true, updatedAt: "2026-02-08T00:00:00.000Z" }]);

    const response = await request(app.getHttpServer()).get("/api/advisory/pilot/cohort").expect(200);

    expect(response.body).toHaveLength(1);
  });

  it("POST /api/advisory/tuning/thresholds", async () => {
    advisoryServiceMock.updateTuningThresholds.mockResolvedValue({ confidenceReview: 0.5, blockScore: -0.4, allowScore: 0.4 });

    const response = await request(app.getHttpServer())
      .post("/api/advisory/tuning/thresholds")
      .send({ traceId: "t1", thresholds: { confidenceReview: 0.5, blockScore: -0.4, allowScore: 0.4 } })
      .expect(201);

    expect(response.body.allowScore).toBe(0.4);
  });

  it("GET /api/advisory/ops/metrics", async () => {
    advisoryServiceMock.getOpsMetrics.mockResolvedValue({ windowHours: 24, shadowEvaluated: 10, accepted: 5, rejected: 3, feedbackRecorded: 2, acceptRate: 0.5, rejectRate: 0.3, feedbackRate: 0.2, decisionLagAvgMinutes: 7.5 });

    const response = await request(app.getHttpServer()).get("/api/advisory/ops/metrics?windowHours=24").expect(200);

    expect(response.body.shadowEvaluated).toBe(10);
  });

  it("POST /api/advisory/incident/kill-switch/enable", async () => {
    advisoryServiceMock.enableKillSwitch.mockResolvedValue({ status: "ENABLED" });

    const response = await request(app.getHttpServer())
      .post("/api/advisory/incident/kill-switch/enable")
      .send({ traceId: "ks-1", reason: "incident" })
      .expect(201);

    expect(response.body.status).toBe("ENABLED");
  });

  it("GET /api/advisory/rollout/status", async () => {
    advisoryServiceMock.getRolloutStatus.mockResolvedValue({ stage: "S2", percentage: 25, autoStopEnabled: true });

    const response = await request(app.getHttpServer()).get("/api/advisory/rollout/status").expect(200);

    expect(response.body.stage).toBe("S2");
  });

  it("POST /api/advisory/rollout/config", async () => {
    advisoryServiceMock.configureRollout.mockResolvedValue({ stage: "S1", percentage: 10, autoStopEnabled: true });

    const response = await request(app.getHttpServer())
      .post("/api/advisory/rollout/config")
      .send({ traceId: "r1", stage: "S1", autoStopEnabled: true })
      .expect(201);

    expect(response.body.percentage).toBe(10);
  });

  it("POST /api/advisory/recommendations/:traceId/accept", async () => {
    advisoryServiceMock.acceptRecommendation.mockResolvedValue({ traceId: "t-accept", status: "ACCEPTED" });

    const response = await request(app.getHttpServer())
      .post("/api/advisory/recommendations/t-accept/accept")
      .expect(201);

    expect(response.body.status).toBe("ACCEPTED");
  });
});
