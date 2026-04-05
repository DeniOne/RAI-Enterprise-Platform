import { buildSubIntentGraphFromSemanticFrame } from "./sub-intent-graph.builder";
import { validateSubIntentGraphAntiTunnel } from "./sub-intent-graph.mixed-intent-invariants";
import { ConfidenceBand, DecisionType } from "./semantic-routing.types";
import type { SemanticIngressFrame } from "./semantic-ingress.types";
import { RaiToolName } from "./rai-tools.types";

function baseFrame(
  partial: Partial<SemanticIngressFrame>,
): SemanticIngressFrame {
  return {
    version: "v1",
    interactionMode: "free_chat",
    requestShape: "single_intent",
    domainCandidates: [],
    goal: null,
    entities: [],
    requestedOperation: {
      ownerRole: "agronomist",
      intent: "test_intent",
      toolName: RaiToolName.WorkspaceSnapshot,
      payload: { route: "/x" },
      decisionType: DecisionType.Execute,
      source: "fallback_normalization",
    },
    operationAuthority: "delegated_or_autonomous",
    missingSlots: [],
    riskClass: "safe_read",
    requiresConfirmation: false,
    confidenceBand: ConfidenceBand.Medium,
    explanation: "",
    writePolicy: { decision: "execute", reason: "" },
    ...partial,
  } as SemanticIngressFrame;
}

describe("sub-intent-graph.builder", () => {
  it("детерминированный graphId для одинакового входа", () => {
    const f = baseFrame({});
    const a = buildSubIntentGraphFromSemanticFrame(f);
    const b = buildSubIntentGraphFromSemanticFrame(f);
    expect(a.graphId).toBe(b.graphId);
    expect(a.branches.length).toBe(1);
    expect(a.branches[0].branchId).toBe("primary");
    expect(a.branches[0].payload).toEqual({ route: "/x" });
  });

  it("TechMap + clarify даёт две ветки (anti-tunnel)", () => {
    const f = baseFrame({
      techMapFrame: {
        workflowKind: "tech_map",
        userIntent: "create_new",
        workflowStageHint: "intake",
        requestedArtifact: "workflow_draft",
        scope: { fieldIds: [] },
        contextReadiness: "S1_SCOPED",
        requiredActions: ["clarify", "execute"],
        policyPosture: "governed",
        policyConstraints: [],
        resultConstraints: [],
      },
    });
    const g = buildSubIntentGraphFromSemanticFrame(f);
    expect(g.branches.length).toBe(2);
    expect(g.branches.map((x) => x.branchId).sort()).toEqual(
      ["tech_map_clarify", "tech_map_core"].sort(),
    );
    expect(g.branches.find((x) => x.branchId === "tech_map_clarify")?.dependsOn).toEqual([
      "tech_map_core",
    ]);
    expect(validateSubIntentGraphAntiTunnel(f, g)).toEqual({ ok: true });
  });

  it("explicitPlannerToolCalls ≥2: ветка на каждый тул (multi-tool без composite)", () => {
    const f = baseFrame({
      requestShape: "composite",
      explicitPlannerToolCalls: [
        {
          toolName: RaiToolName.ComputeDeviations,
          ownerRole: "agronomist",
          intent: "compute_deviations",
          payload: { scope: { seasonId: "s1" } },
        },
        {
          toolName: RaiToolName.QueryKnowledge,
          ownerRole: "knowledge",
          intent: "query_knowledge",
          payload: { query: "x" },
        },
      ],
    });
    const g = buildSubIntentGraphFromSemanticFrame(f);
    expect(g.branches).toHaveLength(2);
    expect(g.branches.map((b) => b.toolName)).toEqual([
      RaiToolName.ComputeDeviations,
      RaiToolName.QueryKnowledge,
    ]);
    expect(g.branches[0].payload).toEqual({ scope: { seasonId: "s1" } });
    expect(g.branches[1].payload).toEqual({ query: "x" });
    expect(g.graphId.startsWith("g_multi_")).toBe(true);
    expect(validateSubIntentGraphAntiTunnel(f, g)).toEqual({ ok: true });
  });
});
