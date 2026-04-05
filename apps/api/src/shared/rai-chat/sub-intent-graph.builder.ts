import type { SemanticIngressFrame } from "./semantic-ingress.types";
import type {
  SubIntentGraph,
  SubIntentGraphBranch,
} from "./execution-target-state.types";

function stableGraphId(frame: SemanticIngressFrame): string {
  const multi = frame.explicitPlannerToolCalls;
  if (multi && multi.length >= 2) {
    const key = multi.map((t) => t.toolName).join("+");
    return `g_multi_${String(key).replace(/[^a-zA-Z0-9_+]/g, "_")}`;
  }
  const base =
    frame.compositePlan?.planId ??
    frame.proofSliceId ??
    frame.requestedOperation.intent ??
    "single";
  const tm = frame.techMapFrame?.userIntent ?? "";
  return `g_${String(base).replace(/\s+/g, "_")}_${tm || "na"}`;
}

export function buildSubIntentGraphFromSemanticFrame(
  frame: SemanticIngressFrame,
): SubIntentGraph {
  const branches: SubIntentGraphBranch[] = [];

  if (frame.compositePlan && frame.compositePlan.stages.length > 0) {
    for (const stage of frame.compositePlan.stages) {
      branches.push({
        branchId: stage.stageId,
        ownerRole: stage.agentRole,
        intent: stage.intent,
        toolName: stage.toolName,
        ...(stage.payload ? { payload: { ...stage.payload } } : {}),
        kind: frame.compositePlan.workflowId.startsWith("crm.")
          ? "cross_domain"
          : "analytical",
        dependsOn: [...stage.dependsOn],
      });
    }
    return {
      version: "v1",
      graphId: stableGraphId(frame),
      branches,
    };
  }

  if (frame.explicitPlannerToolCalls && frame.explicitPlannerToolCalls.length >= 2) {
    const primaryKind: SubIntentGraphBranch["kind"] =
      frame.riskClass === "write_candidate" || frame.riskClass === "high_risk_write"
        ? "read_action"
        : frame.requestShape === "composite"
          ? "cross_domain"
          : "informational";
    for (let i = 0; i < frame.explicitPlannerToolCalls.length; i += 1) {
      const row = frame.explicitPlannerToolCalls[i];
      branches.push({
        branchId: `explicit_${i}_${row.toolName}`,
        ownerRole: row.ownerRole,
        intent: row.intent,
        toolName: row.toolName,
        payload: { ...row.payload },
        kind: primaryKind,
        dependsOn: [],
      });
    }
    return {
      version: "v1",
      graphId: stableGraphId(frame),
      branches,
    };
  }

  if (frame.techMapFrame) {
    branches.push({
      branchId: "tech_map_core",
      ownerRole: frame.requestedOperation.ownerRole,
      intent: frame.techMapFrame.userIntent,
      toolName: frame.requestedOperation.toolName,
      ...(frame.requestedOperation.payload
        ? { payload: { ...frame.requestedOperation.payload } }
        : {}),
      kind: "tech_map_core",
      dependsOn: [],
    });
    if (frame.techMapFrame.requiredActions.includes("clarify")) {
      branches.push({
        branchId: "tech_map_clarify",
        ownerRole: frame.requestedOperation.ownerRole,
        intent: "clarify_context",
        toolName: null,
        kind: "informational",
        dependsOn: ["tech_map_core"],
      });
    }
    return {
      version: "v1",
      graphId: stableGraphId(frame),
      branches,
    };
  }

  const primaryKind: SubIntentGraphBranch["kind"] =
    frame.riskClass === "write_candidate" ||
    frame.riskClass === "high_risk_write"
      ? "read_action"
      : frame.requestShape === "composite"
        ? "cross_domain"
        : "informational";

  branches.push({
    branchId: "primary",
    ownerRole: frame.requestedOperation.ownerRole,
    intent: frame.requestedOperation.intent,
    toolName: frame.requestedOperation.toolName,
    ...(frame.requestedOperation.payload
      ? { payload: { ...frame.requestedOperation.payload } }
      : {}),
    kind: primaryKind,
    dependsOn: [],
  });

  return {
    version: "v1",
    graphId: stableGraphId(frame),
    branches,
  };
}
