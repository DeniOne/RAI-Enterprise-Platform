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
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { bsScorePct: 2 },
    ]);

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.AUTONOMOUS);
  });

  it("BS% = 15% → TOOL_FIRST", async () => {
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { bsScorePct: 15 },
    ]);

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.TOOL_FIRST);
  });

  it("BS% = 40% → QUARANTINE", async () => {
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([
      { bsScorePct: 40 },
    ]);

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.QUARANTINE);
  });

  it("нет quality-данных → TOOL_FIRST и avg=null", async () => {
    (prisma.traceSummary.findMany as jest.Mock).mockResolvedValue([]);

    const status = await service.getCompanyAutonomyStatus("c1");
    expect(status).toEqual({
      level: AutonomyLevel.TOOL_FIRST,
      avgBsScorePct: null,
      knownTraceCount: 0,
    });
  });
});

