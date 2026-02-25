import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AdvisoryService } from "./advisory.service";

describe("AdvisoryService", () => {
  const prismaMock = {
    auditLog: {
      findMany: jest.fn(),
    },
  };
  const auditMock = {
    log: jest.fn(),
  };

  let service: AdvisoryService;

  beforeEach(() => {
    service = new AdvisoryService(prismaMock as any, auditMock as any);
    jest.clearAllMocks();
    prismaMock.auditLog.findMany.mockResolvedValue([]);
  });

  it("возвращает пусто, если pilot не включен", async () => {
    prismaMock.auditLog.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getPendingRecommendations("c1", "u1", 10);

    expect(result).toEqual([]);
  });

  it("применяет anti-spam policy (не более 2 одинаковых signal+recommendation)", async () => {
    prismaMock.auditLog.findMany.mockImplementation((args: any) => {
      const actions = args?.where?.action?.in ?? [];
      if (actions.includes("ADVISORY_ROLLOUT_CONFIG_UPDATED")) {
        return Promise.resolve([
          {
            action: "ADVISORY_ROLLOUT_CONFIG_UPDATED",
            createdAt: new Date("2026-02-08T10:12:30.000Z"),
            metadata: {
              companyId: "c1",
              stage: "S1",
              autoStopEnabled: true,
              traceId: "roll-1",
            },
          },
        ]);
      }
      if (actions.includes("ADVISORY_PILOT_ENABLED")) {
        return Promise.resolve([
          {
            action: "ADVISORY_PILOT_ENABLED",
            createdAt: new Date("2026-02-08T10:12:00.000Z"),
            metadata: { companyId: "c1", scope: "COMPANY", traceId: "pilot-1" },
          },
        ]);
      }
      if (actions.includes("SHADOW_ADVISORY_EVALUATED")) {
        return Promise.resolve([
          {
            action: "SHADOW_ADVISORY_EVALUATED",
            createdAt: new Date("2026-02-08T10:10:00.000Z"),
            metadata: {
              traceId: "t1",
              companyId: "c1",
              signalType: "VISION",
              recommendation: "REVIEW",
              confidence: 0.5,
              explainability: {
                traceId: "t1",
                confidence: 0.5,
                why: "a",
                factors: [],
              },
            },
          },
          {
            action: "SHADOW_ADVISORY_EVALUATED",
            createdAt: new Date("2026-02-08T10:09:00.000Z"),
            metadata: {
              traceId: "t2",
              companyId: "c1",
              signalType: "VISION",
              recommendation: "REVIEW",
              confidence: 0.5,
              explainability: {
                traceId: "t2",
                confidence: 0.5,
                why: "b",
                factors: [],
              },
            },
          },
          {
            action: "SHADOW_ADVISORY_EVALUATED",
            createdAt: new Date("2026-02-08T10:08:00.000Z"),
            metadata: {
              traceId: "t3",
              companyId: "c1",
              signalType: "VISION",
              recommendation: "REVIEW",
              confidence: 0.5,
              explainability: {
                traceId: "t3",
                confidence: 0.5,
                why: "c",
                factors: [],
              },
            },
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await service.getPendingRecommendations("c1", "u1", 10);

    expect(result).toHaveLength(2);
  });

  it("pilot status учитывает user-scope поверх company-scope", async () => {
    prismaMock.auditLog.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          action: "ADVISORY_PILOT_DISABLED",
          createdAt: new Date("2026-02-08T10:12:00.000Z"),
          metadata: {
            companyId: "c1",
            scope: "USER",
            targetUserId: "u-1",
            traceId: "t1",
          },
        },
        {
          action: "ADVISORY_PILOT_ENABLED",
          createdAt: new Date("2026-02-08T10:11:00.000Z"),
          metadata: { companyId: "c1", scope: "COMPANY", traceId: "t2" },
        },
      ]);

    const status = await service.getPilotStatus("c1", "u-1");

    expect(status.enabled).toBe(false);
    expect(status.scope).toBe("USER");
  });

  it("kill-switch отключает pilot независимо от флагов", async () => {
    prismaMock.auditLog.findMany.mockResolvedValueOnce([
      {
        action: "ADVISORY_KILL_SWITCH_ENABLED",
        createdAt: new Date(),
        metadata: { companyId: "c1", traceId: "ks-1" },
      },
    ]);

    const status = await service.getPilotStatus("c1", "u-1");

    expect(status.enabled).toBe(false);
  });

  it("enablePilot требует ADMIN или MANAGER", async () => {
    await expect(
      service.enablePilot({
        actorId: "u-1",
        actorRole: "USER",
        companyId: "c1",
        traceId: "trace-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("getPilotCohort возвращает последние состояния по user scope", async () => {
    prismaMock.auditLog.findMany.mockResolvedValueOnce([
      {
        action: "ADVISORY_PILOT_DISABLED",
        createdAt: new Date("2026-02-08T11:00:00.000Z"),
        metadata: {
          companyId: "c1",
          scope: "USER",
          targetUserId: "u-2",
          traceId: "t1",
        },
      },
      {
        action: "ADVISORY_PILOT_ENABLED",
        createdAt: new Date("2026-02-08T10:58:00.000Z"),
        metadata: {
          companyId: "c1",
          scope: "USER",
          targetUserId: "u-1",
          traceId: "t3",
        },
      },
    ]);

    const cohort = await service.getPilotCohort("c1");

    expect(cohort).toEqual([
      { userId: "u-1", enabled: true, updatedAt: "2026-02-08T10:58:00.000Z" },
      { userId: "u-2", enabled: false, updatedAt: "2026-02-08T11:00:00.000Z" },
    ]);
  });

  it("updateTuningThresholds логирует изменение", async () => {
    const thresholds = {
      confidenceReview: 0.5,
      blockScore: -0.4,
      allowScore: 0.4,
    };

    const result = await service.updateTuningThresholds({
      actorId: "u-admin",
      actorRole: "ADMIN",
      companyId: "c1",
      traceId: "tune-1",
      thresholds,
    });

    expect(result).toEqual(thresholds);
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ADVISORY_TUNING_UPDATED" }),
    );
  });

  it("getTuningThresholds возвращает дефолт при отсутствии записей", async () => {
    prismaMock.auditLog.findMany.mockResolvedValueOnce([]);

    const thresholds = await service.getTuningThresholds("c1");

    expect(thresholds).toEqual({
      confidenceReview: 0.45,
      blockScore: -0.35,
      allowScore: 0.35,
    });
  });

  it("getOpsMetrics считает базовые коэффициенты", async () => {
    prismaMock.auditLog.findMany.mockResolvedValueOnce([
      {
        action: "SHADOW_ADVISORY_EVALUATED",
        createdAt: new Date("2026-02-08T10:00:00.000Z"),
        metadata: { companyId: "c1", traceId: "t1" },
      },
      {
        action: "ADVISORY_ACCEPTED",
        createdAt: new Date("2026-02-08T10:10:00.000Z"),
        metadata: { companyId: "c1", traceId: "t1" },
      },
      {
        action: "ADVISORY_FEEDBACK_RECORDED",
        createdAt: new Date("2026-02-08T10:11:00.000Z"),
        metadata: { companyId: "c1", traceId: "t1", reason: "ok" },
      },
    ]);

    const metrics = await service.getOpsMetrics("c1", 24);

    expect(metrics.shadowEvaluated).toBe(1);
    expect(metrics.accepted).toBe(1);
    expect(metrics.acceptRate).toBe(1);
  });

  it("recordFeedback бросает NotFoundException если traceId не найден", async () => {
    prismaMock.auditLog.findMany.mockResolvedValueOnce([]);

    await expect(
      service.recordFeedback({
        traceId: "missing",
        companyId: "c1",
        userId: "u-1",
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rollout status по умолчанию S0", async () => {
    prismaMock.auditLog.findMany.mockResolvedValueOnce([]);
    const status = await service.getRolloutStatus("c1");
    expect(status.stage).toBe("S0");
    expect(status.percentage).toBe(0);
  });

  it("configureRollout логирует конфигурацию", async () => {
    const result = await service.configureRollout({
      actorId: "u-admin",
      actorRole: "ADMIN",
      companyId: "c1",
      traceId: "roll-cfg-1",
      stage: "S2",
      autoStopEnabled: true,
    });

    expect(result.stage).toBe("S2");
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ADVISORY_ROLLOUT_CONFIG_UPDATED" }),
    );
  });

  it("evaluateRolloutGate возвращает fail при плохих метриках и пишет auto-stop", async () => {
    prismaMock.auditLog.findMany
      .mockResolvedValueOnce([
        {
          action: "SHADOW_ADVISORY_EVALUATED",
          createdAt: new Date("2026-02-08T10:00:00.000Z"),
          metadata: { companyId: "c1", traceId: "t1" },
        },
      ])
      .mockResolvedValueOnce([
        {
          action: "ADVISORY_ROLLOUT_CONFIG_UPDATED",
          createdAt: new Date("2026-02-08T10:01:00.000Z"),
          metadata: { companyId: "c1", stage: "S2", autoStopEnabled: true },
        },
      ]);

    const result = await service.evaluateRolloutGate({
      actorId: "u-admin",
      actorRole: "ADMIN",
      companyId: "c1",
      traceId: "gate-1",
      stage: "S2",
      metrics: { errorRate: 0.06, p95LatencyMs: 3200, conversionRate: 0.05 },
    });

    expect(result.pass).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ADVISORY_ROLLOUT_AUTO_STOPPED" }),
    );
  });
});
