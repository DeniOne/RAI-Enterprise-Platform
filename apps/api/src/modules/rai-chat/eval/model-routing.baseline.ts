import type { ExecutionPlan } from "../../../shared/rai-chat/execution-target-state.types";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import { BranchSchedulerService } from "../planner/branch-scheduler.service";

/**
 * Proxy «стоимости» планировщика без LLM: ветки + число рёбер dependsOn.
 * Регрессия: взрыв ветвления/графа ломает gate до похода в прод.
 */
export function structuralRoutingCost(plan: ExecutionPlan): number {
  return plan.branches.reduce((sum, b) => sum + 1 + b.dependsOn.length, 0);
}

/** Nearest-rank percentile, samples уже отсортированы по возрастанию. */
export function percentileNearestRank(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) {
    return 0;
  }
  const idx = Math.ceil(p * sortedAsc.length) - 1;
  const clamped = Math.max(0, Math.min(sortedAsc.length - 1, idx));
  return sortedAsc[clamped] ?? 0;
}

export function measurePlannerHotPathMs(
  svc: BranchSchedulerService,
  frame: SemanticIngressFrame,
): number {
  const t0 = performance.now();
  const plan = svc.buildExecutionPlanFromIngress(frame);
  if (plan) {
    svc.computeTopologicalScheduleOrder(plan);
  }
  return performance.now() - t0;
}

/** Верхняя граница p95 (мс) для локального hot-path; ослабить в CI: env. */
export function readModelRoutingBaselineP95MsMax(): number {
  const raw = process.env.RAI_MODEL_ROUTING_BASELINE_P95_MS_MAX;
  if (raw === undefined || raw === "") {
    return 300;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 300;
}
