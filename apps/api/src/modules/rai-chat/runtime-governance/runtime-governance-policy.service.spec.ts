import { RuntimeGovernancePolicyService } from "./runtime-governance-policy.service";

describe("RuntimeGovernancePolicyService", () => {
  let service: RuntimeGovernancePolicyService;

  beforeEach(() => {
    service = new RuntimeGovernancePolicyService();
  });

  it("returns role-aware policy for canonical agents", () => {
    const crm = service.getRolePolicy("crm_agent");

    expect(crm.role).toBe("crm_agent");
    expect(crm.concurrency.deadlineMs).toBe(25_000);
    expect(crm.thresholds.evidenceCoverageMinPct).toBe(75);
  });

  it("resolves fallback mode from role policy", () => {
    expect(
      service.resolveFallbackMode("front_office_agent", "NO_INTENT_OWNER"),
    ).toBe("ROUTE_FALLBACK");
  });

  it("falls back to defaults for unknown role", () => {
    const fallback = service.getRolePolicy("unknown-role");

    expect(fallback.role).toBe("knowledge");
    expect(fallback.concurrency.deadlineMs).toBe(30_000);
  });

  it("merges governed runtime overrides into the effective role policy", () => {
    const overridden = service.getRolePolicy("crm_agent", {
      concurrencyEnvelope: {
        maxParallelToolCalls: 2,
        maxParallelGroups: 1,
      },
      truthfulnessThresholds: {
        bsReviewThresholdPct: 18,
      },
      fallbackPolicy: {
        TOOL_FAILURE: "MANUAL_HUMAN_REQUIRED",
      },
    });

    expect(overridden.concurrency.maxParallelToolCalls).toBe(2);
    expect(overridden.concurrency.maxParallelGroups).toBe(1);
    expect(overridden.thresholds.bsReviewThresholdPct).toBe(18);
    expect(overridden.fallbackModeByReason.TOOL_FAILURE).toBe(
      "MANUAL_HUMAN_REQUIRED",
    );
  });
});
