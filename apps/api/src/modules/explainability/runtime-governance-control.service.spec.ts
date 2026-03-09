import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AutonomyLevel } from "../rai-chat/autonomy-policy.service";
import { RuntimeGovernanceOverrideService } from "../rai-chat/runtime-governance/runtime-governance-override.service";
import { RuntimeGovernanceControlService } from "./runtime-governance-control.service";

describe("RuntimeGovernanceControlService", () => {
  let service: RuntimeGovernanceControlService;

  const overrides = {
    setManualAutonomyOverride: jest.fn(),
    clearManualAutonomyOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuntimeGovernanceControlService,
        { provide: RuntimeGovernanceOverrideService, useValue: overrides },
      ],
    }).compile();

    service = module.get(RuntimeGovernanceControlService);
  });

  it("создаёт QUARANTINE override и пишет governance event", async () => {
    overrides.setManualAutonomyOverride.mockResolvedValue({
      level: AutonomyLevel.QUARANTINE,
      avgBsScorePct: 18,
      knownTraceCount: 5,
      driver: "MANUAL_OVERRIDE",
      activeQualityAlert: false,
      manualOverride: {
        active: true,
        level: AutonomyLevel.QUARANTINE,
        reason: "manual quarantine",
        createdAt: "2026-03-09T15:30:00.000Z",
        createdByUserId: "u-1",
      },
    });

    const result = await service.setManualAutonomyOverride({
      companyId: "c-1",
      level: "QUARANTINE",
      reason: "manual quarantine",
      userId: "u-1",
    });

    expect(result.driver).toBe("MANUAL_OVERRIDE");
    expect(overrides.setManualAutonomyOverride).toHaveBeenCalledWith({
      companyId: "c-1",
      level: "QUARANTINE",
      reason: "manual quarantine",
      userId: "u-1",
    });
  });

  it("ошибается при clear без активного override", async () => {
    overrides.clearManualAutonomyOverride.mockRejectedValue(
      new BadRequestException("no override"),
    );

    await expect(
      service.clearManualAutonomyOverride({
        companyId: "c-1",
        userId: "u-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
