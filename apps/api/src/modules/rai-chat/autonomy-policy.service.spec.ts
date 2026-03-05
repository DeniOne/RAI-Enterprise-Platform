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
      aggregate: jest.fn(),
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
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValue({
      _avg: { bsScorePct: 2 },
    });

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.AUTONOMOUS);
  });

  it("BS% = 15% → TOOL_FIRST", async () => {
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValue({
      _avg: { bsScorePct: 15 },
    });

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.TOOL_FIRST);
  });

  it("BS% = 40% → QUARANTINE", async () => {
    (prisma.traceSummary.aggregate as jest.Mock).mockResolvedValue({
      _avg: { bsScorePct: 40 },
    });

    const level = await service.getCompanyAutonomyLevel("c1");
    expect(level).toBe(AutonomyLevel.QUARANTINE);
  });
});

