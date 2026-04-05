import {
  branchVerdictToLifecycleHint,
  compositeWorkflowStageStatusToLifecycle,
  mapWritePolicyToMutationState,
} from "./execution-target-state.bridge";

describe("execution-target-state.bridge", () => {
  it("composite planned -> PLANNED, completed -> COMPLETED, blocked -> BLOCKED_ON_CONFIRMATION", () => {
    expect(compositeWorkflowStageStatusToLifecycle("planned")).toBe("PLANNED");
    expect(compositeWorkflowStageStatusToLifecycle("completed")).toBe(
      "COMPLETED",
    );
    expect(compositeWorkflowStageStatusToLifecycle("failed")).toBe("FAILED");
    expect(compositeWorkflowStageStatusToLifecycle("blocked")).toBe(
      "BLOCKED_ON_CONFIRMATION",
    );
  });

  it("mapWritePolicyToMutationState: confirm и requiresConfirmation -> PENDING", () => {
    expect(
      mapWritePolicyToMutationState({
        decision: "confirm",
        requiresConfirmation: false,
      }),
    ).toBe("PENDING");
    expect(
      mapWritePolicyToMutationState({
        decision: "execute",
        requiresConfirmation: true,
      }),
    ).toBe("PENDING");
  });

  it("mapWritePolicyToMutationState: block -> REJECTED", () => {
    expect(
      mapWritePolicyToMutationState({
        decision: "block",
        requiresConfirmation: false,
      }),
    ).toBe("REJECTED");
  });

  it("branchVerdictToLifecycleHint даёт подсказку для трассировки", () => {
    expect(branchVerdictToLifecycleHint("VERIFIED")).toBe("COMPLETED");
    expect(branchVerdictToLifecycleHint("REJECTED")).toBe("FAILED");
  });
});
