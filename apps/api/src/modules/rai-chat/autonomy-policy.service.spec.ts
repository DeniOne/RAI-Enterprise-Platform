import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  AutonomyLevel,
  AutonomyPolicyService,
} from "./autonomy-policy.service";

describe("AutonomyPolicyService", () => {
  let service: AutonomyPolicyService;

  const prisma = {
    traceSummary: {
      findMany: jest.fn(),
    },
    qualityAlert: {
      findFirst: jest.fn(),
    },
    autonomyOverride: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutonomyPolicyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AutonomyPolicyService);
  });

  it("BS% = 2% → AUTONOMOUS", async () => {
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { bsScorePct: 2 },
    ]);
    (prisma.autonomyOverride.findFirst as jest.Mock).mockResolvedValue(null);

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.AUTONOMOUS);
  });

  it("BS% = 15% → TOOL_FIRST", async () => {
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { bsScorePct: 15 },
    ]);
    (prisma.autonomyOverride.findFirst as jest.Mock).mockResolvedValue(null);

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.TOOL_FIRST);
  });

  it("BS% = 40% → QUARANTINE", async () => {
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { bsScorePct: 40 },
    ]);
    (prisma.autonomyOverride.findFirst as jest.Mock).mockResolvedValue(null);

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.QUARANTINE);
  });

  it("нет quality-данных → TOOL_FIRST и avg=null", async () => {
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.autonomyOverride.findFirst as jest.Mock).mockResolvedValue(null);

    const status = await service.getCompanyAutonomyStatus("c1");
    expect(status).toEqual({
      level: AutonomyLevel.TOOL_FIRST,
      avgBsScorePct: null,
      knownTraceCount: 0,
      driver: "NO_QUALITY_DATA",
      activeQualityAlert: false,
      manualOverride: null,
    });
  });

  it("active BS_DRIFT alert форсирует QUARANTINE даже без высокого avg BS%", async () => {
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue({ id: "qa-1" });
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([{ bsScorePct: 10 }]);
    (prisma.autonomyOverride.findFirst as jest.Mock).mockResolvedValue(null);

    const status = await service.getCompanyAutonomyStatus("c1");
    expect(status).toEqual({
      level: AutonomyLevel.QUARANTINE,
      avgBsScorePct: 10,
      knownTraceCount: 1,
      driver: "QUALITY_ALERT",
      activeQualityAlert: true,
      manualOverride: null,
    });
  });

  it("manual override имеет приоритет над quality сигналами", async () => {
    (prisma.qualityAlert.findFirst as jest.Mock).mockResolvedValue({ id: "qa-1" });
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([{ bsScorePct: 48 }]);
    (prisma.autonomyOverride.findFirst as jest.Mock).mockResolvedValue({
      level: AutonomyLevel.TOOL_FIRST,
      reason: "manual review window",
      createdAt: new Date("2026-03-09T15:00:00.000Z"),
      createdByUserId: "u-1",
    });

    const status = await service.getCompanyAutonomyStatus("c1");
    expect(status).toEqual({
      level: AutonomyLevel.TOOL_FIRST,
      avgBsScorePct: 48,
      knownTraceCount: 1,
      driver: "MANUAL_OVERRIDE",
      activeQualityAlert: true,
      manualOverride: {
        active: true,
        level: AutonomyLevel.TOOL_FIRST,
        reason: "manual review window",
        createdAt: "2026-03-09T15:00:00.000Z",
        createdByUserId: "u-1",
      },
    });
  });
});
