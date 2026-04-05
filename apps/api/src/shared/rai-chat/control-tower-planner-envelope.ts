import type { SemanticIngressFrame } from "./semantic-ingress.types";
import type { PlannerPromotionDecision } from "./planner-promotion-policy";
import type { SubIntentGraph } from "./execution-target-state.types";

/**
 * Узкий стабильный снимок для control-tower / operator-plane (v1).
 * Детальные ветки — в `metadata.plannerBranchTelemetry` при наличии плана/поверхности.
 */
export function buildControlTowerPlannerEnvelopeV1(input: {
  traceId: string;
  companyId: string;
  promotion: PlannerPromotionDecision;
  frame: SemanticIngressFrame;
  plannerBranchTelemetry: Record<string, unknown> | null;
}): Record<string, unknown> {
  const g = input.frame.subIntentGraph;
  return {
    schemaVersion: "control_tower.planner_envelope.v1",
    traceId: input.traceId,
    companyId: input.companyId,
    promotion: input.promotion,
    plannerSignals: {
      graphId: g?.graphId ?? null,
      branchCount: g?.branches?.length ?? 0,
      hasExecutionPlan: Boolean(input.frame.executionPlan),
      hasExecutionSurface: Boolean(input.frame.executionSurface),
      telemetryPresent: input.plannerBranchTelemetry != null,
    },
  };
}

/**
 * Компактный graph-only снимок `SubIntentGraph` для audit / operator-plane без полного `semanticIngressFrame`.
 */
export function buildControlTowerSubIntentGraphSnapshotV1(
  graph: SubIntentGraph | null | undefined,
): Record<string, unknown> | null {
  if (!graph) {
    return null;
  }
  return {
    schemaVersion: "control_tower.sub_intent_graph.v1",
    graphId: graph.graphId,
    version: graph.version,
    branches: graph.branches.map((b) => ({
      branchId: b.branchId,
      ownerRole: b.ownerRole,
      intent: b.intent,
      toolName: b.toolName,
      kind: b.kind,
      dependsOn: [...b.dependsOn],
    })),
  };
}
