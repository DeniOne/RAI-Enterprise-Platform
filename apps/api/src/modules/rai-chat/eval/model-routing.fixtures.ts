import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import { buildSubIntentGraphFromSemanticFrame } from "../../../shared/rai-chat/sub-intent-graph.builder";
import {
  ConfidenceBand,
  DecisionType,
} from "../../../shared/rai-chat/semantic-routing.types";

/** Минимальный frame для регрессии маршрутизации планировщика (без сети, без LLM). */
export function buildMicroRoutingRegressionFrame(): SemanticIngressFrame {
  const base: SemanticIngressFrame = {
    version: "v1",
    interactionMode: "free_chat",
    requestShape: "single_intent",
    domainCandidates: [],
    goal: null,
    entities: [],
    requestedOperation: {
      ownerRole: "agronomist",
      intent: "x",
      toolName: null,
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
  };
  return {
    ...base,
    subIntentGraph: buildSubIntentGraphFromSemanticFrame(base),
  };
}
