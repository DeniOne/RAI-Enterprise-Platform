import type { RaiToolName } from "./rai-tools.types";
import {
  applyExecutionBranchTransition,
  type ExecutionBranchLifecycle,
  type MutationConfirmationState,
} from "./execution-branch-lifecycle";
import type {
  ExecutionPlan,
  ExecutionSurfaceBranchRow,
  ExecutionSurfaceState,
} from "./execution-target-state.types";

function extractPendingActionIdFromToolResult(result: unknown): string | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  const r = result as Record<string, unknown>;
  if (r.riskPolicyBlocked !== true) return undefined;
  return typeof r.actionId === "string" && r.actionId.length > 0
    ? r.actionId
    : undefined;
}

function transitionLifecycle(
  lifecycle: ExecutionBranchLifecycle,
  to: ExecutionBranchLifecycle,
): ExecutionBranchLifecycle {
  const r = applyExecutionBranchTransition(lifecycle, to);
  if (r.ok) {
    return r.next;
  }
  throw new Error(
    `execution-surface-runtime: ${(r as { ok: false; reason: string }).reason}`,
  );
}

/** Ветки в плане: все в CREATED + одна мутация из ingress. */
export function buildPlanBoundSurface(
  plan: ExecutionPlan,
  mutationState: MutationConfirmationState,
): ExecutionSurfaceState {
  return {
    version: "v1",
    branches: plan.branches.map((b) => ({
      branchId: b.branchId,
      lifecycle: "CREATED" as const,
      mutationState,
    })),
  };
}

/** CREATED → PLANNED для каждой строки (привязка к ExecutionPlan). */
export function promoteSurfaceToPlanned(
  surface: ExecutionSurfaceState,
): ExecutionSurfaceState {
  return {
    version: "v1",
    branches: surface.branches.map((row) => ({
      ...row,
      lifecycle: transitionLifecycle(row.lifecycle, "PLANNED"),
    })),
  };
}

/**
 * Для старта ветки B все `dependsOn` должны быть **успешно** завершены.
 * FAILED / CANCELLED у зависимости не считаются «выполненными» и не открывают downstream
 * (иначе sequential composite после срыва средней стадии ошибочно поднимал бы хвост).
 */
const DEPENDENCY_SATISFIED: ReadonlySet<ExecutionBranchLifecycle> = new Set([
  "COMPLETED",
]);

export interface AdvanceRunnableRootsOptions {
  /** Ограничение числа веток в RUNNING одновременно (governance / branch budget). */
  maxConcurrentRunning?: number;
}

/**
 * Корни плана (все dependsOn в COMPLETED) переводятся PLANNED → READY → RUNNING.
 * При заданном `maxConcurrentRunning` лишние корни остаются в PLANNED (отложенный старт).
 */
export function advanceRunnableRootsToRunning(
  surface: ExecutionSurfaceState,
  plan: ExecutionPlan,
  options?: AdvanceRunnableRootsOptions,
): ExecutionSurfaceState {
  const rowById = new Map(
    surface.branches.map((r) => [r.branchId, { ...r } as ExecutionSurfaceBranchRow]),
  );

  const runnableIds = plan.branches
    .filter((pb) =>
      pb.dependsOn.every((depId) => {
        const dep = rowById.get(depId);
        return dep !== undefined && DEPENDENCY_SATISFIED.has(dep.lifecycle);
      }),
    )
    .map((b) => b.branchId);

  const cap = options?.maxConcurrentRunning;
  const runningCount = surface.branches.filter((b) => b.lifecycle === "RUNNING").length;
  const capFinite =
    cap !== undefined && Number.isFinite(cap) && cap >= 1 ? Math.floor(cap) : null;
  let slots =
    capFinite === null ? Number.POSITIVE_INFINITY : Math.max(0, capFinite - runningCount);

  const deferredRunnableBranchIds: string[] = [];
  for (const id of runnableIds) {
    const row = rowById.get(id);
    if (!row || row.lifecycle !== "PLANNED") {
      continue;
    }
    if (slots <= 0) {
      deferredRunnableBranchIds.push(id);
      continue;
    }
    let life = transitionLifecycle(row.lifecycle, "READY");
    life = transitionLifecycle(life, "RUNNING");
    row.lifecycle = life;
    slots -= 1;
  }

  const branches = surface.branches.map((b) => rowById.get(b.branchId) ?? b);
  const out: ExecutionSurfaceState = { version: "v1", branches };
  if (capFinite !== null) {
    out.plannerAdvanceMeta = {
      concurrencyCap: capFinite,
      deferredRunnableBranchIds,
    };
  }
  return out;
}

const TERMINAL_LIFECYCLES: ReadonlySet<ExecutionBranchLifecycle> = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

/** Все ветки в терминале — срез плана для thread можно не продолжать (новый запуск с чистого листа). */
export function isPlannerSliceFullyTerminal(
  surface: ExecutionSurfaceState,
): boolean {
  return (
    surface.branches.length > 0 &&
    surface.branches.every((b) => TERMINAL_LIFECYCLES.has(b.lifecycle))
  );
}

/**
 * Подтверждение мутации с клиента: BLOCKED_ON_CONFIRMATION + PENDING → RESUMED + APPROVED → RUNNING.
 * Если у строки есть `pendingActionId`, снимаем блок только при совпадении с `approvedPendingActionId`.
 */
export function applyPlannerMutationApprovalToSurface(
  surface: ExecutionSurfaceState,
  approvedPendingActionId?: string,
): ExecutionSurfaceState {
  const rowById = new Map(
    surface.branches.map((r) => [r.branchId, { ...r } as ExecutionSurfaceBranchRow]),
  );

  for (const row of rowById.values()) {
    if (
      row.lifecycle === "BLOCKED_ON_CONFIRMATION" &&
      row.mutationState === "PENDING"
    ) {
      if (row.pendingActionId) {
        if (
          !approvedPendingActionId ||
          row.pendingActionId !== approvedPendingActionId
        ) {
          continue;
        }
      }
      let life = transitionLifecycle(row.lifecycle, "RESUMED");
      row.lifecycle = life;
      row.mutationState = "APPROVED";
      life = transitionLifecycle(row.lifecycle, "RUNNING");
      row.lifecycle = life;
      delete row.pendingActionId;
    }
  }

  return withPreservedPlannerMeta(surface, surface.branches.map((b) => rowById.get(b.branchId) ?? b));
}

function withPreservedPlannerMeta(
  surface: ExecutionSurfaceState,
  branches: ExecutionSurfaceBranchRow[],
): ExecutionSurfaceState {
  const out: ExecutionSurfaceState = { version: "v1", branches };
  if (surface.plannerAdvanceMeta) {
    out.plannerAdvanceMeta = surface.plannerAdvanceMeta;
  }
  return out;
}

function toolResultRiskBlocked(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as Record<string, unknown>).riskPolicyBlocked === true
  );
}

const BLOCKS_DOWNSTREAM: ReadonlySet<ExecutionBranchLifecycle> = new Set([
  "FAILED",
  "CANCELLED",
]);

/**
 * Ветки в PLANNED, у которых в `dependsOn` есть FAILED или CANCELLED, → CANCELLED
 * (транзитивно). Иначе хвост цепочки остаётся PLANNED и срез никогда не терминален.
 */
export function propagateCancelledForBlockedDependencies(
  surface: ExecutionSurfaceState,
  plan: ExecutionPlan,
): ExecutionSurfaceState {
  const rowById = new Map(
    surface.branches.map((r) => [r.branchId, { ...r } as ExecutionSurfaceBranchRow]),
  );

  let changed = true;
  while (changed) {
    changed = false;
    for (const pb of plan.branches) {
      const row = rowById.get(pb.branchId);
      if (!row || row.lifecycle !== "PLANNED") {
        continue;
      }
      const blocked = pb.dependsOn.some((depId) => {
        const dep = rowById.get(depId);
        return dep !== undefined && BLOCKS_DOWNSTREAM.has(dep.lifecycle);
      });
      if (!blocked) {
        continue;
      }
      row.lifecycle = transitionLifecycle(row.lifecycle, "CANCELLED");
      changed = true;
    }
  }

  return withPreservedPlannerMeta(
    surface,
    surface.branches.map((b) => rowById.get(b.branchId) ?? b),
  );
}

/**
 * Завершение для веток в RUNNING после одного прохода runtime.
 * NEEDS_MORE_DATA — оставляем RUNNING (ожидание добора / clarification).
 */
export function finalizeSurfaceFromExecution(
  surface: ExecutionSurfaceState,
  executedTools: Array<{ name: RaiToolName; result: unknown }>,
  agentStatus: string | null | undefined,
  plan?: ExecutionPlan | null,
): ExecutionSurfaceState {
  const runningIds = surface.branches
    .filter((r) => r.lifecycle === "RUNNING")
    .map((r) => r.branchId);
  return finalizeBranchesOnSurface(
    surface,
    runningIds,
    executedTools,
    agentStatus,
    plan,
  );
}

export function finalizeNamedBranchFromExecution(
  surface: ExecutionSurfaceState,
  branchId: string,
  executedTools: Array<{ name: RaiToolName; result: unknown }>,
  agentStatus: string | null | undefined,
  plan?: ExecutionPlan | null,
): ExecutionSurfaceState {
  return finalizeBranchesOnSurface(
    surface,
    [branchId],
    executedTools,
    agentStatus,
    plan,
  );
}

function finalizeBranchesOnSurface(
  surface: ExecutionSurfaceState,
  branchIds: string[],
  executedTools: Array<{ name: RaiToolName; result: unknown }>,
  agentStatus: string | null | undefined,
  plan?: ExecutionPlan | null,
): ExecutionSurfaceState {
  const rowById = new Map(
    surface.branches.map((r) => [r.branchId, { ...r } as ExecutionSurfaceBranchRow]),
  );
  const targetIds = branchIds.filter(
    (branchId) => rowById.get(branchId)?.lifecycle === "RUNNING",
  );
  if (targetIds.length === 0) {
    return plan
      ? propagateCancelledForBlockedDependencies(surface, plan)
      : surface;
  }

  const planByBranchId = plan
    ? new Map(plan.branches.map((b) => [b.branchId, b]))
    : null;
  const anyRisk = executedTools.some((t) => toolResultRiskBlocked(t.result));
  const firstBlockedTool = executedTools.find((t) => toolResultRiskBlocked(t.result));
  const firstPendingId = firstBlockedTool
    ? extractPendingActionIdFromToolResult(firstBlockedTool.result)
    : undefined;

  for (const id of targetIds) {
    const row = rowById.get(id);
    if (!row) {
      continue;
    }

    let riskForThisBranch = false;
    let pendingId: string | undefined;

    if (planByBranchId) {
      const pb = planByBranchId.get(id);
      const toolName = pb?.toolName;
      if (toolName) {
        const hit = executedTools.find(
          (t) => t.name === toolName && toolResultRiskBlocked(t.result),
        );
        if (hit) {
          riskForThisBranch = true;
          pendingId = extractPendingActionIdFromToolResult(hit.result);
        }
      } else if (anyRisk) {
        riskForThisBranch = true;
        pendingId = firstPendingId;
      }
    } else if (anyRisk) {
      riskForThisBranch = true;
      pendingId = firstPendingId;
    }

    if (riskForThisBranch) {
      row.lifecycle = transitionLifecycle(row.lifecycle, "BLOCKED_ON_CONFIRMATION");
      row.mutationState = "PENDING";
      if (pendingId) {
        row.pendingActionId = pendingId;
      }
      continue;
    }
    if (agentStatus === "NEEDS_MORE_DATA") {
      continue;
    }
    if (agentStatus === "FAILED" || agentStatus === "RATE_LIMITED") {
      row.lifecycle = transitionLifecycle(row.lifecycle, "FAILED");
      continue;
    }
    row.lifecycle = transitionLifecycle(row.lifecycle, "COMPLETED");
  }

  const merged = withPreservedPlannerMeta(
    surface,
    surface.branches.map((b) => rowById.get(b.branchId) ?? b),
  );
  return plan ? propagateCancelledForBlockedDependencies(merged, plan) : merged;
}
