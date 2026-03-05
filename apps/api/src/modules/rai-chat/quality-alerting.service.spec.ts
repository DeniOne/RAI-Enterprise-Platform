import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  QualityAlertingService,
  QualityAlertingResult,
} from "./quality-alerting.service";

describe("QualityAlertingService", () => {
  let service: QualityAlertingService;

  const prisma = {
    traceSummary: {
      aggregate: jest.fn(),
    },
    qualityAlert: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityAlertingService,
        { provide: PrismaService, useValue: prisma },
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
    (prisma.qualityAlert.create as jest.Mock).mockResolvedValue({
      id: "qa1",
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

    const result = (await service.evaluateBsDrift({
      companyId: "c1",
      now: new Date("2026-03-05T12:00:00Z"),
    })) as QualityAlertingResult;

    expect(result.alertCreated).toBe(false);
    expect(prisma.qualityAlert.create).not.toHaveBeenCalled();
  });
});

