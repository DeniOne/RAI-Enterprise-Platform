import { Test, TestingModule } from "@nestjs/testing";
import { AutonomyPolicyService, AutonomyLevel } from "../autonomy-policy.service";
import { RuntimeGovernanceAutomationService } from "./runtime-governance-automation.service";
import { RuntimeGovernanceFeatureFlagsService } from "./runtime-governance-feature-flags.service";
import { RuntimeGovernanceOverrideService } from "./runtime-governance-override.service";

describe("RuntimeGovernanceAutomationService", () => {
  let service: RuntimeGovernanceAutomationService;

  const autonomyPolicy = {
    getCompanyAutonomyStatus: jest.fn(),
  };
  const overrides = {
    setManualAutonomyOverride: jest.fn(),
  };
  const featureFlags = {
    getFlags: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuntimeGovernanceAutomationService,
        { provide: AutonomyPolicyService, useValue: autonomyPolicy },
        { provide: RuntimeGovernanceOverrideService, useValue: overrides },
        { provide: RuntimeGovernanceFeatureFlagsService, useValue: featureFlags },
      ],
    }).compile();

    service = module.get(RuntimeGovernanceAutomationService);
  });

  it("автоматически переводит в QUARANTINE при quarantine recommendation", async () => {
    featureFlags.getFlags.mockReturnValue({
      apiEnabled: true,
      uiEnabled: true,
      enforcementEnabled: true,
      autoQuarantineEnabled: true,
    });
    autonomyPolicy.getCompanyAutonomyStatus.mockResolvedValue({
      level: AutonomyLevel.AUTONOMOUS,
      avgBsScorePct: 10,
      knownTraceCount: 4,
      driver: "BS_AVG_AUTONOMOUS",
      activeQualityAlert: false,
      manualOverride: null,
    });
    overrides.setManualAutonomyOverride.mockResolvedValue(undefined);

    const result = await service.applyRecommendation("c-1", {
      type: "QUARANTINE_RECOMMENDED",
      reason: "repeated_bs_drift",
      agentRole: "crm_agent",
    });

    expect(result).toEqual({
      applied: true,
      level: "QUARANTINE",
      reason: "auto:repeated_bs_drift",
    });
    expect(overrides.setManualAutonomyOverride).toHaveBeenCalledWith({
      companyId: "c-1",
      level: "QUARANTINE",
      reason: "auto:repeated_bs_drift",
      userId: null,
    });
  });

  it("не применяет auto action при выключенном flag", async () => {
    featureFlags.getFlags.mockReturnValue({
      apiEnabled: true,
      uiEnabled: true,
      enforcementEnabled: true,
      autoQuarantineEnabled: false,
    });

    const result = await service.applyRecommendation("c-1", {
      type: "REVIEW_REQUIRED",
      reason: "bs_drift_threshold_exceeded",
    });

    expect(result).toEqual({ applied: false });
    expect(overrides.setManualAutonomyOverride).not.toHaveBeenCalled();
  });
});
