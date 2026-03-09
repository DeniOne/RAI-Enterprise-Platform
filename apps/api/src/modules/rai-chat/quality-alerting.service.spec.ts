import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  QualityAlertingService,
  QualityAlertingResult,
} from "./quality-alerting.service";
import { IncidentOpsService } from "./incident-ops.service";
import { SystemIncidentType } from "@rai/prisma-client";
import { RuntimeGovernanceEventService } from "./runtime-governance/runtime-governance-event.service";
import { RuntimeGovernanceRecommendationService } from "./runtime-governance/runtime-governance-recommendation.service";

describe("QualityAlertingService", () => {
  let service: QualityAlertingService;

  const prisma = {
    traceSummary: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
    },
    qualityAlert: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    aiAuditEntry: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;
  const incidentOps = {
    logIncident: jest.fn(),
  };
  const governanceEvents = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const recommendationService = {
    handleQualityAlertCreated: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityAlertingService,
        { provide: PrismaService, useValue: prisma },
        { provide: IncidentOpsService, useValue: incidentOps },
        { provide: RuntimeGovernanceEventService, useValue: governanceEvents },
        { provide: RuntimeGovernanceRecommendationService, useValue: recommendationService },
      ],
    }).compile();

    service = module.get(QualityAlertingService);
  });

  it("BS% стабилен (10% → 11%) — алерт не создаётся", async () => {
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { bsScorePct: 11 },
    });
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { bsScorePct: 10 },
    });
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.qualityAlert.count as jest.Mock).mockResolvedValue(0);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const result = (await service.evaluateBsDrift({
      companyId: "c1",
      now: new Date("2026-03-05T12:00:00Z"),
    })) as QualityAlertingResult;

    expect(result.alertCreated).toBe(false);
    expect(prisma.qualityAlert.create).not.toHaveBeenCalled();
  });

  it("BS% резко вырос (10% → 45%) — создаётся HIGH алерт", async () => {
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { bsScorePct: 45 },
    });
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { bsScorePct: 10 },
    });
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.qualityAlert.count as jest.Mock).mockResolvedValue(1);
    (prisma.qualityAlert.create as jest.Mock).mockResolvedValue({
      id: "qa1",
    });
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue({
      traceId: "tr-hot",
      bsScorePct: 51,
    });

    const result = (await service.evaluateBsDrift({
      companyId: "c1",
      now: new Date("2026-03-05T12:00:00Z"),
    })) as QualityAlertingResult;

    expect(result.alertCreated).toBe(true);
    expect(prisma.qualityAlert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "c1",
        alertType: "BS_DRIFT",
        severity: "HIGH",
      }),
    });
    expect(incidentOps.logIncident).toHaveBeenCalledWith({
      companyId: "c1",
      traceId: "tr-hot",
      incidentType: SystemIncidentType.UNKNOWN,
      severity: "HIGH",
      details: expect.objectContaining({
        subtype: "QUALITY_BS_DRIFT",
        recentAvgBsPct: 45,
        baselineAvgBsPct: 10,
        deltaPct: 35,
        hottestTraceId: "tr-hot",
        hottestTraceBsPct: 51,
      }),
    });
    expect(governanceEvents.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "QUALITY_DRIFT_DETECTED",
      }),
    );
    expect(recommendationService.handleQualityAlertCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        traceId: "tr-hot",
        recentAvgBsPct: 45,
        baselineAvgBsPct: 10,
      }),
    );
  });

  it("Cooldown: если алерт уже есть сегодня — второй не создаём", async () => {
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { bsScorePct: 45 },
    });
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { bsScorePct: 10 },
    });
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue({
      id: "existing",
    });
    (prisma.qualityAlert.count as jest.Mock).mockResolvedValue(1);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue(null);

    const result = (await service.evaluateBsDrift({
      companyId: "c1",
      now: new Date("2026-03-05T12:00:00Z"),
    })) as QualityAlertingResult;

    expect(result.alertCreated).toBe(false);
    expect(prisma.qualityAlert.create).not.toHaveBeenCalled();
    expect(incidentOps.logIncident).not.toHaveBeenCalled();
  });
});
