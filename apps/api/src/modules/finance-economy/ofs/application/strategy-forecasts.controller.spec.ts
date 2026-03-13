import { CanActivate, ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { StrategyForecastsController } from "./strategy-forecasts.controller";
import { DecisionIntelligenceService } from "./decision-intelligence.service";
import { JwtAuthGuard } from "../../../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../../../shared/auth/roles.guard";
import { IdempotencyInterceptor } from "../../../../shared/idempotency/idempotency.interceptor";

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: "u-test", companyId: "c-test", role: "ADMIN" };
    return true;
  }
}

class TestRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe("StrategyForecastsController (HTTP)", () => {
  let app: INestApplication;

  const decisionService = {
    runStrategyForecast: jest.fn(),
    listSavedScenarios: jest.fn(),
    saveScenario: jest.fn(),
    deleteScenario: jest.fn(),
    listRecentRuns: jest.fn(),
    recordOutcomeFeedback: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StrategyForecastsController],
      providers: [
        {
          provide: DecisionIntelligenceService,
          useValue: decisionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .overrideInterceptor(IdempotencyInterceptor)
      .useValue({
        intercept: (_context: unknown, next: { handle: () => unknown }) => next.handle(),
      })
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
  });

  it("GET /api/ofs/strategy/forecasts/history returns recent run history", async () => {
    decisionService.listRecentRuns.mockResolvedValue({
      items: [
        {
          id: "run-1",
          traceId: "di_1",
          scopeLevel: "company",
          seasonId: "season-1",
          horizonDays: 90,
          domains: ["finance"],
          degraded: false,
          riskTier: "medium",
          recommendedAction: "Keep baseline",
          scenarioName: null,
          createdByUserId: "u-test",
          createdAt: "2026-03-13T00:00:00.000Z",
          evaluation: {
            status: "pending",
          },
        },
      ],
      total: 1,
      limit: 12,
      offset: 0,
      hasMore: false,
    });

    const response = await request(app.getHttpServer())
      .get("/api/ofs/strategy/forecasts/history")
      .query({
        limit: "5",
        offset: "2",
        riskTier: "high",
        degraded: "true",
        seasonId: "season-2",
      })
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].traceId).toBe("di_1");
    expect(decisionService.listRecentRuns).toHaveBeenCalledWith("c-test", {
      limit: 5,
      offset: 2,
      riskTier: "high",
      degraded: true,
      seasonId: "season-2",
    });
  });

  it("POST /api/ofs/strategy/forecasts/history/:runId/feedback records realized outcomes", async () => {
    decisionService.recordOutcomeFeedback.mockResolvedValue({
      id: "run-1",
      traceId: "di_1",
      scopeLevel: "company",
      seasonId: "season-1",
      horizonDays: 90,
      domains: ["finance", "risk"],
      degraded: false,
      riskTier: "medium",
      recommendedAction: "Keep baseline",
      scenarioName: "Working scenario",
      createdByUserId: "u-test",
      createdAt: "2026-03-13T00:00:00.000Z",
      evaluation: {
        status: "feedback_recorded",
        revenueErrorPct: 3.1,
      },
    });

    const response = await request(app.getHttpServer())
      .post("/api/ofs/strategy/forecasts/history/run-1/feedback")
      .send({
        actualRevenue: 1001000,
        actualMargin: 290000,
      })
      .expect(201);

    expect(response.body.evaluation.status).toBe("feedback_recorded");
    expect(decisionService.recordOutcomeFeedback).toHaveBeenCalledWith(
      "c-test",
      "run-1",
      { actualRevenue: 1001000, actualMargin: 290000 },
      "u-test",
    );
  });

  it("GET /api/ofs/strategy/forecasts/history validates query params", async () => {
    await request(app.getHttpServer())
      .get("/api/ofs/strategy/forecasts/history")
      .query({ riskTier: "critical" })
      .expect(400);

    expect(decisionService.listRecentRuns).not.toHaveBeenCalled();
  });
});
