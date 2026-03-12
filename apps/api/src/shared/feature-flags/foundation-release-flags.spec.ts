import {
  isFoundationGatedFeatureEnabled,
  isFoundationReleaseReady,
} from "./foundation-release-flags";

describe("foundation release flags", () => {
  it("blocks gated features in production by default", () => {
    const env = { NODE_ENV: "production" } as NodeJS.ProcessEnv;

    expect(isFoundationReleaseReady(env)).toBe(false);
    expect(
      isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED", env),
    ).toBe(false);
  });

  it("allows gated features outside production by default", () => {
    const env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;

    expect(isFoundationReleaseReady(env)).toBe(true);
    expect(
      isFoundationGatedFeatureEnabled("RAI_MEMORY_HINTS_ENABLED", env),
    ).toBe(true);
  });

  it("respects explicit foundation release override", () => {
    const env = {
      NODE_ENV: "production",
      RAI_FOUNDATION_RELEASE_READY: "true",
      RAI_CHIEF_AGRONOMIST_PANEL_ENABLED: "true",
    } as NodeJS.ProcessEnv;

    expect(isFoundationReleaseReady(env)).toBe(true);
    expect(
      isFoundationGatedFeatureEnabled(
        "RAI_CHIEF_AGRONOMIST_PANEL_ENABLED",
        env,
      ),
    ).toBe(true);
  });

  it("still respects per-feature disable when release is open", () => {
    const env = {
      NODE_ENV: "production",
      RAI_FOUNDATION_RELEASE_READY: "true",
      RAI_MEMORY_HINTS_ENABLED: "false",
    } as NodeJS.ProcessEnv;

    expect(
      isFoundationGatedFeatureEnabled("RAI_MEMORY_HINTS_ENABLED", env),
    ).toBe(false);
  });
});
