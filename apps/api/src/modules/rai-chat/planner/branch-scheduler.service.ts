import { Injectable } from "@nestjs/common";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import type {
  ExecutionPlan,
  ExecutionPlanBranch,
  ExecutionSurfaceState,
  PlannerExecutionStrategy,
} from "../../../shared/rai-chat/execution-target-state.types";
import type { CompositeWorkflowPlan } from "../../../shared/rai-chat/composite-orchestration.types";
import { mapWritePolicyToMutationState } from "../../../shared/rai-chat/execution-target-state.bridge";
import {
  buildPlanBoundSurface,
  promoteSurfaceToPlanned,
} from "../../../shared/rai-chat/execution-surface-runtime";

@Injectable()
export class BranchSchedulerService {
  buildExecutionPlanFromIngress(
    frame: SemanticIngressFrame,
  ): ExecutionPlan | null {
    const graph = frame.subIntentGraph;
    if (!graph || graph.branches.length === 0) {
      return null;
    }
    const strategy = this.resolveStrategy(frame.compositePlan);
    const branches: ExecutionPlanBranch[] = graph.branches.map((b, i) => ({
      branchId: b.branchId,
      order: i,
      dependsOn: [...b.dependsOn],
      ownerRole: b.ownerRole,
      toolName: b.toolName,
      ...(b.payload ? { payload: { ...b.payload } } : {}),
      intent: b.intent,
    }));
    return {
      version: "v1",
      planId: `p_${graph.graphId}`,
      strategy,
      branches,
      sourceGraphId: graph.graphId,
    };
  }

  resolveStrategy(
    plan: CompositeWorkflowPlan | null | undefined,
  ): PlannerExecutionStrategy {
    if (!plan) {
      return "sequential";
    }
    const s = plan.executionStrategy;
    if (s === "blocking") {
      return "blocking_on_confirmation";
    }
    if (s === "parallel") {
      return "parallel";
    }
    return "sequential";
  }

  buildInitialSurface(
    plan: ExecutionPlan,
    frame: SemanticIngressFrame,
  ): ExecutionSurfaceState {
    const mutationState = mapWritePolicyToMutationState({
      decision: frame.writePolicy.decision,
      requiresConfirmation: frame.requiresConfirmation,
    });
    return promoteSurfaceToPlanned(
      buildPlanBoundSurface(plan, mutationState),
    );
  }

  /** Порядок исполнения с учётом dependsOn (детерминированный Kahn-подобный проход). */
  computeTopologicalScheduleOrder(plan: ExecutionPlan): string[] {
    const ids = plan.branches.map((b) => b.branchId);
    const done = new Set<string>();
    const order: string[] = [];
    const byId = new Map(plan.branches.map((b) => [b.branchId, b] as const));
    while (order.length < ids.length) {
      let progressed = false;
      for (const id of ids) {
        if (done.has(id)) {
          continue;
        }
        const b = byId.get(id);
        if (!b) {
          continue;
        }
        if (b.dependsOn.every((d) => done.has(d))) {
          order.push(id);
          done.add(id);
          progressed = true;
        }
      }
      if (!progressed) {
        return [...ids].sort(
          (a, c) => (byId.get(a)?.order ?? 0) - (byId.get(c)?.order ?? 0),
        );
      }
    }
    return order;
  }
}
