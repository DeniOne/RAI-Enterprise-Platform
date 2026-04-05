/**
 * Канонический жизненный цикл ветки исполнения и состояние мутации/подтверждения.
 * Переходы только через canTransition / applyExecutionBranchTransition.
 */

export const EXECUTION_BRANCH_LIFECYCLE_VALUES = [
  "CREATED",
  "PLANNED",
  "READY",
  "RUNNING",
  "BLOCKED_ON_CONFIRMATION",
  "RESUMED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type ExecutionBranchLifecycle =
  (typeof EXECUTION_BRANCH_LIFECYCLE_VALUES)[number];

export const MUTATION_CONFIRMATION_STATE_VALUES = [
  "NOT_REQUIRED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;

export type MutationConfirmationState =
  (typeof MUTATION_CONFIRMATION_STATE_VALUES)[number];

const TERMINAL: ReadonlySet<ExecutionBranchLifecycle> = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const ALLOWED_TO: Record<ExecutionBranchLifecycle, ExecutionBranchLifecycle[]> =
  {
    CREATED: ["PLANNED"],
    /** READY — нормальный старт; CANCELLED — ветка не будет исполняться (зависимость FAILED/CANCELLED). */
    PLANNED: ["READY", "CANCELLED"],
    READY: ["RUNNING"],
    RUNNING: [
      "COMPLETED",
      "FAILED",
      "CANCELLED",
      "BLOCKED_ON_CONFIRMATION",
    ],
    BLOCKED_ON_CONFIRMATION: ["RESUMED", "CANCELLED", "FAILED"],
    RESUMED: ["RUNNING", "COMPLETED", "FAILED"],
    COMPLETED: [],
    FAILED: [],
    CANCELLED: [],
  };

export function isTerminalExecutionBranch(
  state: ExecutionBranchLifecycle,
): boolean {
  return TERMINAL.has(state);
}

export function canTransitionExecutionBranch(
  from: ExecutionBranchLifecycle,
  to: ExecutionBranchLifecycle,
): boolean {
  return ALLOWED_TO[from].includes(to);
}

export function applyExecutionBranchTransition(
  from: ExecutionBranchLifecycle,
  to: ExecutionBranchLifecycle,
):
  | { ok: true; next: ExecutionBranchLifecycle }
  | { ok: false; reason: string } {
  if (isTerminalExecutionBranch(from)) {
    return {
      ok: false,
      reason: `терминальное состояние ${from}: исходящие переходы запрещены`,
    };
  }
  if (!canTransitionExecutionBranch(from, to)) {
    return {
      ok: false,
      reason: `переход ${from} -> ${to} не разрешён каноном`,
    };
  }
  return { ok: true, next: to };
}

export function isValidLifecycleMutationPair(
  lifecycle: ExecutionBranchLifecycle,
  mutation: MutationConfirmationState,
): boolean {
  if (lifecycle === "BLOCKED_ON_CONFIRMATION") {
    return mutation !== "NOT_REQUIRED";
  }
  if (mutation === "PENDING") {
    return lifecycle === "RUNNING" || lifecycle === "READY";
  }
  return true;
}
