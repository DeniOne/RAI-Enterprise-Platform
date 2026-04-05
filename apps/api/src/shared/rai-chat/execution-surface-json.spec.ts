import type { ExecutionSurfaceState } from "./execution-target-state.types";
import {
  EXECUTION_BRANCH_LIFECYCLE_VALUES,
  MUTATION_CONFIRMATION_STATE_VALUES,
} from "./execution-branch-lifecycle";
import {
  parseExecutionSurfaceBranchLifecycle,
  parseMutationConfirmationState,
} from "./branch-runtime-telemetry";

describe("execution-surface JSON whitelist", () => {
  it("round-trip JSON сохраняет только канонические enum-строки", () => {
    const surface: ExecutionSurfaceState = {
      version: "v1",
      branches: [
        {
          branchId: "b1",
          lifecycle: "PLANNED",
          mutationState: "NOT_REQUIRED",
        },
      ],
    };
    const json = JSON.stringify(surface);
    const parsed = JSON.parse(json) as ExecutionSurfaceState;
    expect(parsed.branches[0].lifecycle).toBe("PLANNED");
    const lc = parseExecutionSurfaceBranchLifecycle(parsed.branches[0].lifecycle);
    const ms = parseMutationConfirmationState(parsed.branches[0].mutationState);
    expect(lc).toBe("PLANNED");
    expect(ms).toBe("NOT_REQUIRED");
  });

  it("произвольная строка lifecycle не проходит whitelist", () => {
    expect(parseExecutionSurfaceBranchLifecycle("INVALID")).toBeNull();
    expect(parseMutationConfirmationState("PENDING_X")).toBeNull();
  });

  it("все канонические lifecycle парсятся", () => {
    for (const v of EXECUTION_BRANCH_LIFECYCLE_VALUES) {
      expect(parseExecutionSurfaceBranchLifecycle(v)).toBe(v);
    }
    for (const v of MUTATION_CONFIRMATION_STATE_VALUES) {
      expect(parseMutationConfirmationState(v)).toBe(v);
    }
  });
});
