import { buildSubIntentGraphFromSemanticFrame } from "../../../shared/rai-chat/sub-intent-graph.builder";
import { validateSubIntentGraphAntiTunnel } from "../../../shared/rai-chat/sub-intent-graph.mixed-intent-invariants";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import { DecisionType } from "../../../shared/rai-chat/semantic-routing.types";
import { ConfidenceBand } from "../../../shared/rai-chat/semantic-routing.types";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";

function base(
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
      intent: "query_knowledge",
      toolName: RaiToolName.QueryKnowledge,
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

describe("SubIntentGraph eval-корпус (фиксированные кейсы)", () => {
  it("informational-only: одна ветка primary", () => {
    const f = base({ riskClass: "safe_read", requestShape: "single_intent" });
    const g = buildSubIntentGraphFromSemanticFrame(f);
    expect(g.branches).toHaveLength(1);
    expect(g.branches[0].kind).toBe("informational");
    expect(validateSubIntentGraphAntiTunnel(f, g)).toEqual({ ok: true });
  });

  it("read+action hint: write_candidate даёт read_action", () => {
    const f = base({ riskClass: "write_candidate" });
    const g = buildSubIntentGraphFromSemanticFrame(f);
    expect(g.branches[0].kind).toBe("read_action");
    expect(validateSubIntentGraphAntiTunnel(f, g)).toEqual({ ok: true });
  });

  it("cross-domain stub: requestShape composite без compositePlan", () => {
    const f = base({ requestShape: "composite" });
    const g = buildSubIntentGraphFromSemanticFrame(f);
    expect(g.branches[0].kind).toBe("cross_domain");
    expect(validateSubIntentGraphAntiTunnel(f, g)).toEqual({ ok: true });
  });

  it("explicitPlannerToolCalls: два тула — две ветки и инвариант", () => {
    const f = base({
      requestShape: "composite",
      explicitPlannerToolCalls: [
        {
          toolName: RaiToolName.ComputeDeviations,
          ownerRole: "agronomist",
          intent: "compute_deviations",
        },
        {
          toolName: RaiToolName.QueryKnowledge,
          ownerRole: "knowledge",
          intent: "query_knowledge",
        },
      ],
    });
    const g = buildSubIntentGraphFromSemanticFrame(f);
    expect(g.branches).toHaveLength(2);
    expect(validateSubIntentGraphAntiTunnel(f, g)).toEqual({ ok: true });
  });
});
