import type { SemanticIngressFrame } from "./semantic-ingress.types";
import type { SubIntentGraph } from "./execution-target-state.types";

export type SubIntentGraphAntiTunnelResult =
  | { ok: true }
  | { ok: false; caseId: string; detail: string };

/**
 * Жёсткие инварианты против «туннелирования» mixed-intent в одну ветку `primary`.
 * Синхронизировано с фикстурами `sub-intent-graph.builder.spec.ts` и eval-корпусом.
 */
export function validateSubIntentGraphAntiTunnel(
  frame: SemanticIngressFrame,
  graph: SubIntentGraph,
): SubIntentGraphAntiTunnelResult {
  if (frame.techMapFrame?.requiredActions?.includes("clarify")) {
    const ids = new Set(graph.branches.map((b) => b.branchId));
    if (graph.branches.length < 2 || !ids.has("tech_map_core") || !ids.has("tech_map_clarify")) {
      return {
        ok: false,
        caseId: "TECH_MAP_CLARIFY_DUAL_BRANCH",
        detail: `ожидались ветки tech_map_core и tech_map_clarify (≥2), получено branchIds=[${graph.branches.map((b) => b.branchId).join(",")}]`,
      };
    }
  }

  const explicit = frame.explicitPlannerToolCalls;
  if (explicit && explicit.length >= 2) {
    if (graph.branches.length !== explicit.length) {
      return {
        ok: false,
        caseId: "MULTI_EXPLICIT_TOOL_PARITY",
        detail: `explicitPlannerToolCalls=${explicit.length} веток=${graph.branches.length}`,
      };
    }
    for (let i = 0; i < explicit.length; i += 1) {
      if (graph.branches[i].toolName !== explicit[i].toolName) {
        return {
          ok: false,
          caseId: "MULTI_EXPLICIT_TOOL_PARITY",
          detail: `индекс ${i}: ожидался tool ${explicit[i].toolName}, в графе ${graph.branches[i].toolName}`,
        };
      }
    }
  }

  const cp = frame.compositePlan;
  if (cp && cp.stages.length > 0) {
    if (graph.branches.length !== cp.stages.length) {
      return {
        ok: false,
        caseId: "COMPOSITE_STAGE_GRAPH_PARITY",
        detail: `число стадий composite (${cp.stages.length}) ≠ числу веток графа (${graph.branches.length})`,
      };
    }
    const stageIds = new Set(cp.stages.map((s) => s.stageId));
    const branchIds = new Set(graph.branches.map((b) => b.branchId));
    for (const id of stageIds) {
      if (!branchIds.has(id)) {
        return {
          ok: false,
          caseId: "COMPOSITE_STAGE_GRAPH_PARITY",
          detail: `нет ветки для stageId=${id}`,
        };
      }
    }
    for (const id of branchIds) {
      if (!stageIds.has(id)) {
        return {
          ok: false,
          caseId: "COMPOSITE_STAGE_GRAPH_PARITY",
          detail: `лишняя ветка branchId=${id}, не из compositePlan.stages`,
        };
      }
    }
  }

  return { ok: true };
}
