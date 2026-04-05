import {
  EXECUTION_BRANCH_LIFECYCLE_VALUES,
  applyExecutionBranchTransition,
  canTransitionExecutionBranch,
  isTerminalExecutionBranch,
  isValidLifecycleMutationPair,
  MUTATION_CONFIRMATION_STATE_VALUES,
} from "./execution-branch-lifecycle";

describe("execution-branch-lifecycle", () => {
  const allowedEdges: Array<[string, string]> = [
    ["CREATED", "PLANNED"],
    ["PLANNED", "READY"],
    ["PLANNED", "CANCELLED"],
    ["READY", "RUNNING"],
    ["RUNNING", "COMPLETED"],
    ["RUNNING", "FAILED"],
    ["RUNNING", "CANCELLED"],
    ["RUNNING", "BLOCKED_ON_CONFIRMATION"],
    ["BLOCKED_ON_CONFIRMATION", "RESUMED"],
    ["BLOCKED_ON_CONFIRMATION", "CANCELLED"],
    ["BLOCKED_ON_CONFIRMATION", "FAILED"],
    ["RESUMED", "RUNNING"],
    ["RESUMED", "COMPLETED"],
    ["RESUMED", "FAILED"],
  ];

  it("все заявленные разрешённые рёбра проходят canTransition и apply", () => {
    for (const [from, to] of allowedEdges) {
      expect(
        canTransitionExecutionBranch(
          from as (typeof EXECUTION_BRANCH_LIFECYCLE_VALUES)[number],
          to as (typeof EXECUTION_BRANCH_LIFECYCLE_VALUES)[number],
        ),
      ).toBe(true);
      const r = applyExecutionBranchTransition(
        from as (typeof EXECUTION_BRANCH_LIFECYCLE_VALUES)[number],
        to as (typeof EXECUTION_BRANCH_LIFECYCLE_VALUES)[number],
      );
      expect(r.ok).toBe(true);
    }
  });

  it("терминалы не имеют исходящих переходов", () => {
    const terms = EXECUTION_BRANCH_LIFECYCLE_VALUES.filter((s) =>
      isTerminalExecutionBranch(s),
    );
    for (const from of terms) {
      for (const to of EXECUTION_BRANCH_LIFECYCLE_VALUES) {
        expect(canTransitionExecutionBranch(from, to)).toBe(false);
        expect(applyExecutionBranchTransition(from, to).ok).toBe(false);
      }
    }
  });

  it("нелегальный переход COMPLETED -> RUNNING отклоняется", () => {
    expect(canTransitionExecutionBranch("COMPLETED", "RUNNING")).toBe(false);
    expect(applyExecutionBranchTransition("COMPLETED", "RUNNING").ok).toBe(
      false,
    );
  });

  it("BLOCKED_ON_CONFIRMATION не сочетается с NOT_REQUIRED", () => {
    expect(
      isValidLifecycleMutationPair("BLOCKED_ON_CONFIRMATION", "NOT_REQUIRED"),
    ).toBe(false);
    expect(
      isValidLifecycleMutationPair("BLOCKED_ON_CONFIRMATION", "PENDING"),
    ).toBe(true);
  });

  it("PENDING только при READY или RUNNING (вне blocked-ветки)", () => {
    expect(isValidLifecycleMutationPair("READY", "PENDING")).toBe(true);
    expect(isValidLifecycleMutationPair("RUNNING", "PENDING")).toBe(true);
    expect(isValidLifecycleMutationPair("CREATED", "PENDING")).toBe(false);
  });

  it("все значения enum покрыты в EXECUTION_BRANCH_LIFECYCLE_VALUES", () => {
    expect(EXECUTION_BRANCH_LIFECYCLE_VALUES.length).toBe(9);
    expect(MUTATION_CONFIRMATION_STATE_VALUES.length).toBe(5);
  });

  it("из CREATED разрешён только переход в PLANNED", () => {
    for (const to of EXECUTION_BRANCH_LIFECYCLE_VALUES) {
      if (to === "PLANNED") {
        expect(canTransitionExecutionBranch("CREATED", to)).toBe(true);
      } else {
        expect(canTransitionExecutionBranch("CREATED", to)).toBe(false);
      }
    }
  });

  it("из PLANNED разрешены только READY и CANCELLED", () => {
    for (const to of EXECUTION_BRANCH_LIFECYCLE_VALUES) {
      if (to === "READY" || to === "CANCELLED") {
        expect(canTransitionExecutionBranch("PLANNED", to)).toBe(true);
      } else {
        expect(canTransitionExecutionBranch("PLANNED", to)).toBe(false);
      }
    }
  });

  it("матрица mutation: BLOCKED_ON_CONFIRMATION допускает APPROVED/REJECTED/EXPIRED", () => {
    expect(
      isValidLifecycleMutationPair("BLOCKED_ON_CONFIRMATION", "APPROVED"),
    ).toBe(true);
    expect(
      isValidLifecycleMutationPair("BLOCKED_ON_CONFIRMATION", "REJECTED"),
    ).toBe(true);
    expect(
      isValidLifecycleMutationPair("BLOCKED_ON_CONFIRMATION", "EXPIRED"),
    ).toBe(true);
  });
});
