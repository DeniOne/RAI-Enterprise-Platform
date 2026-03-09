import { RuntimeGovernanceFeatureFlagsService } from "./runtime-governance-feature-flags.service";

describe("RuntimeGovernanceFeatureFlagsService", () => {
  const previousEnv = {
    api: process.env.RAI_RUNTIME_GOVERNANCE_API,
    ui: process.env.RAI_RUNTIME_GOVERNANCE_UI,
    enforcement: process.env.RAI_RUNTIME_GOVERNANCE_ENFORCEMENT,
    autoQuarantine: process.env.RAI_RUNTIME_GOVERNANCE_AUTO_QUARANTINE,
  };

  afterEach(() => {
    process.env.RAI_RUNTIME_GOVERNANCE_API = previousEnv.api;
    process.env.RAI_RUNTIME_GOVERNANCE_UI = previousEnv.ui;
    process.env.RAI_RUNTIME_GOVERNANCE_ENFORCEMENT = previousEnv.enforcement;
    process.env.RAI_RUNTIME_GOVERNANCE_AUTO_QUARANTINE =
      previousEnv.autoQuarantine;
  });

  it("читает env flags и применяет defaults", () => {
    process.env.RAI_RUNTIME_GOVERNANCE_API = "true";
    process.env.RAI_RUNTIME_GOVERNANCE_UI = "false";
    process.env.RAI_RUNTIME_GOVERNANCE_ENFORCEMENT = "true";
    process.env.RAI_RUNTIME_GOVERNANCE_AUTO_QUARANTINE = "false";

    const service = new RuntimeGovernanceFeatureFlagsService();
    expect(service.getFlags()).toEqual({
      apiEnabled: true,
      uiEnabled: false,
      enforcementEnabled: true,
      autoQuarantineEnabled: false,
    });
  });
});
