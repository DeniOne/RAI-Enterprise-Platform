import type { RaiToolName } from "./rai-tools.types";
import type {
  ExecutionBranchLifecycle,
  MutationConfirmationState,
} from "./execution-branch-lifecycle";

export type SubIntentKind =
  | "informational"
  | "analytical"
  | "read_action"
  | "cross_domain"
  | "confirmation_gated"
  | "tech_map_core";

export interface SubIntentGraphBranch {
  branchId: string;
  ownerRole: string | null;
  intent: string | null;
  toolName: RaiToolName | null;
  payload?: Record<string, unknown>;
  kind: SubIntentKind;
  dependsOn: string[];
}

export interface SubIntentGraph {
  version: "v1";
  graphId: string;
  branches: SubIntentGraphBranch[];
}

export type PlannerExecutionStrategy =
  | "sequential"
  | "parallel"
  | "blocking_on_confirmation"
  | "mixed";

export interface ExecutionPlanBranch {
  branchId: string;
  order: number;
  dependsOn: string[];
  ownerRole: string | null;
  toolName: RaiToolName | null;
  payload?: Record<string, unknown>;
  intent: string | null;
}

export interface ExecutionPlan {
  version: "v1";
  planId: string;
  strategy: PlannerExecutionStrategy;
  branches: ExecutionPlanBranch[];
  sourceGraphId: string;
}

export interface ExecutionSurfaceBranchRow {
  branchId: string;
  lifecycle: ExecutionBranchLifecycle;
  mutationState: MutationConfirmationState;
  /** Связка с `PendingAction`, если ветка ушла в BLOCKED из-за riskPolicyBlocked. */
  pendingActionId?: string;
}

/** Снимок последнего `advanceRunnableRootsToRunning` (для explainability / audit). */
export interface PlannerAdvanceMetaV1 {
  concurrencyCap: number;
  /** Корни плана, готовые к старту, но оставшиеся PLANNED из-за лимита RUNNING. */
  deferredRunnableBranchIds: string[];
}

export interface ExecutionSurfaceState {
  version: "v1";
  branches: ExecutionSurfaceBranchRow[];
  plannerAdvanceMeta?: PlannerAdvanceMetaV1;
}

export type TargetPolicyDecision =
  | "execute"
  | "confirm"
  | "clarify"
  | "block";

/** Структурированный результат ветки (межагентный слой, не финальный prose). */
export interface ExecutionBranchResult {
  version: "v1";
  branchId: string;
  lifecycle: ExecutionBranchLifecycle;
  structuredPayload?: Record<string, unknown>;
  proseSummary?: string;
}

/** Пакет мутации поверх governed write-path (только после policy). */
export interface MutationPacket {
  version: "v1";
  packetId: string;
  branchId: string;
  toolName: RaiToolName | null;
  payload: Record<string, unknown>;
  /** true только после прохождения risk/policy-engine */
  policyApproved: boolean;
}

export interface ConfirmationRequest {
  version: "v1";
  requestId: string;
  branchId: string;
  mutationPacketId: string;
  state: MutationConfirmationState;
}
