import { InvalidTransitionError } from "./state-machine.interface";

export type FsmPolicyKey = "TASK" | "BUDGET";

type TransitionMatrix = Record<string, readonly string[]>;

const TASK_TRANSITION_POLICY: TransitionMatrix = {
  PENDING: ["ASSIGN", "START", "CANCEL"],
  IN_PROGRESS: ["ASSIGN", "COMPLETE", "CANCEL"],
  CANCELLED: ["REOPEN"],
};

const BUDGET_TRANSITION_POLICY: TransitionMatrix = {
  DRAFT: ["APPROVE"],
  APPROVED: ["ACTIVATE"],
  ACTIVE: ["EXHAUST", "BLOCK", "CLOSE"],
  EXHAUSTED: ["REPLENISH", "CLOSE"],
  BLOCKED: ["UNBLOCK", "CLOSE"],
};

export const FSM_TRANSITION_POLICIES: Record<FsmPolicyKey, TransitionMatrix> = {
  TASK: TASK_TRANSITION_POLICY,
  BUDGET: BUDGET_TRANSITION_POLICY,
};

export function isTransitionAllowed(
  policy: FsmPolicyKey,
  state: string,
  event: string,
): boolean {
  const matrix = FSM_TRANSITION_POLICIES[policy];
  const allowedEvents = matrix[state] || [];
  return allowedEvents.includes(event);
}

export function assertTransitionAllowed(
  policy: FsmPolicyKey,
  state: string,
  event: string,
): void {
  if (!isTransitionAllowed(policy, state, event)) {
    throw new InvalidTransitionError(state, event);
  }
}
