import { buildBranchPlannerTelemetrySnapshot } from "./branch-runtime-telemetry";
import type { SemanticIngressFrame } from "./semantic-ingress.types";
import { DecisionType } from "./semantic-routing.types";
import { ConfidenceBand } from "./semantic-routing.types";

function minimalFrame(
  extra: Partial<SemanticIngressFrame> = {},
): SemanticIngressFrame {
  return {
    version: "v1",
    interactionMode: "free_chat",
    requestShape: "single_intent",
    domainCandidates: [],
    goal: null,
    entities: [],
    requestedOperation: {
      ownerRole: "agronomist",
      intent: "x",
      toolName: null,
      decisionType: DecisionType.Execute,
      source: "fallback_normalization",
    },
    operationAuthority: "delegated_or_autonomous",
    missingSlots: [],
    riskClass: "safe_read",
    requiresConfirmation: false,
    confidenceBand: ConfidenceBand.Medium,
    explanation: "",
    writePolicy: { decision: "execute", reason: "" },
    subIntentGraph: {
      version: "v1",
      graphId: "g_test",
      branches: [
        {
          branchId: "primary",
          ownerRole: "agronomist",
          intent: "x",
          toolName: null,
          kind: "informational",
          dependsOn: [],
        },
      ],
    },
    executionPlan: {
      version: "v1",
      planId: "p_g_test",
      strategy: "sequential",
      branches: [
        {
          branchId: "primary",
          order: 0,
          dependsOn: [],
          ownerRole: "agronomist",
          toolName: null,
          intent: "x",
        },
      ],
      sourceGraphId: "g_test",
    },
    executionSurface: {
      version: "v1",
      branches: [
        {
          branchId: "primary",
          lifecycle: "PLANNED",
          mutationState: "NOT_REQUIRED",
        },
      ],
    },
    compositePlan: {
      planId: "cp1",
      workflowId: "crm.test_flow",
      leadOwnerAgent: "crm_agent",
      executionStrategy: "sequential",
      summary: "test",
      stages: [],
    },
    ...extra,
  };
}

describe("branch-runtime-telemetry", () => {
  it("buildBranchPlannerTelemetrySnapshot содержит branchId, lifecycle, planId", () => {
    const snap = buildBranchPlannerTelemetrySnapshot(minimalFrame());
    expect(snap).not.toBeNull();
    expect(snap?.planId).toBe("p_g_test");
    expect(snap?.workflowId).toBe("crm.test_flow");
    expect(snap?.branches).toEqual([
      expect.objectContaining({
        branchId: "primary",
        lifecycle: "PLANNED",
        mutationState: "NOT_REQUIRED",
      }),
    ]);
  });

  it("возвращает null без плана и поверхности", () => {
    const f = minimalFrame();
    const bare: SemanticIngressFrame = {
      ...f,
      executionPlan: undefined,
      executionSurface: undefined,
    };
    expect(buildBranchPlannerTelemetrySnapshot(bare)).toBeNull();
  });

  it("buildBranchPlannerTelemetrySnapshot: maxConcurrentBranches из options", () => {
    const snap = buildBranchPlannerTelemetrySnapshot(minimalFrame(), {
      maxConcurrentBranches: 3,
    });
    expect(snap?.maxConcurrentBranches).toBe(3);
  });

  it("buildBranchPlannerTelemetrySnapshot: plannerPromotion из options", () => {
    const snap = buildBranchPlannerTelemetrySnapshot(minimalFrame(), {
      plannerPromotion: { enabled: true, mode: "full_rollout" },
    });
    expect(snap?.plannerPromotion).toEqual({
      enabled: true,
      mode: "full_rollout",
    });
  });

  it("buildBranchPlannerTelemetrySnapshot: deferral из plannerAdvanceMeta", () => {
    const f = minimalFrame();
    f.executionSurface = {
      ...f.executionSurface!,
      plannerAdvanceMeta: {
        concurrencyCap: 2,
        deferredRunnableBranchIds: ["primary"],
      },
    };
    const snap = buildBranchPlannerTelemetrySnapshot(f);
    expect(snap?.plannerConcurrencyCap).toBe(2);
    expect(snap?.plannerConcurrencyDeferredBranchIds).toEqual(["primary"]);
  });
});
