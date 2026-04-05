import {
  EXECUTION_BRANCH_LIFECYCLE_VALUES,
  MUTATION_CONFIRMATION_STATE_VALUES,
} from "./execution-branch-lifecycle";

/**
 * Контракт: строки в API/DTO для веток не расходятся с каноническими tuple-типами.
 */
describe("execution-surface DTO enum parity", () => {
  it("ExecutionBranchLifecycle совпадает с ожидаемым набором строк", () => {
    expect(new Set(EXECUTION_BRANCH_LIFECYCLE_VALUES)).toEqual(
      new Set([
        "CREATED",
        "PLANNED",
        "READY",
        "RUNNING",
        "BLOCKED_ON_CONFIRMATION",
        "RESUMED",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ]),
    );
  });

  it("MutationConfirmationState совпадает с ожидаемым набором строк", () => {
    expect(new Set(MUTATION_CONFIRMATION_STATE_VALUES)).toEqual(
      new Set([
        "NOT_REQUIRED",
        "PENDING",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
      ]),
    );
  });
});
