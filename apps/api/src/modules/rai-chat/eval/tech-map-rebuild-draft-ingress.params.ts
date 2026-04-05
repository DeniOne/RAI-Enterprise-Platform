import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";
import type { SemanticIngressService } from "../semantic-ingress.service";

/**
 * Параметры `SemanticIngressService.buildFrame` для сценария rebuild tech map (execute).
 * Синхронизировано с `semantic-ingress.service.spec` («строит tech-map specialization frame для rebuild workflow»).
 */
export function techMapRebuildDraftIngressBuildFrameParams(): Parameters<
  SemanticIngressService["buildFrame"]
>[0] {
  const semanticEvaluation = {
    promotedPrimary: false,
    sliceId: "agro.techmaps.list-open-create",
    requestedToolCalls: [],
    classification: {
      targetRole: "agronomist",
      intent: "tech_map_draft",
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.85,
      method: "semantic_route_shadow",
      reason: "semantic_router:techmap_create_execute",
    },
    semanticIntent: {
      domain: "agro",
      entity: "techmap",
      action: "create",
      interactionMode: "write_candidate",
      mutationRisk: "side_effecting_write",
      filters: {},
      requiredContext: [],
      focusObject: {
        kind: "techmap",
        id: "techmap-77",
      },
      dialogState: {
        activeFlow: null,
        pendingClarificationKeys: [],
        lastUserAction: null,
      },
      resolvability: "resolved",
      ambiguityType: "none",
      confidenceBand: "high",
      reason: "semantic_router:techmap_create_execute",
    },
    routeDecision: {
      decisionType: "execute",
      recommendedExecutionMode: "direct_execute",
      eligibleTools: [RaiToolName.GenerateTechMapDraft],
      eligibleFlows: ["tech_map_draft"],
      requiredContextMissing: [],
      policyChecksRequired: [],
      needsConfirmation: false,
      needsClarification: false,
      abstainReason: null,
      policyBlockReason: null,
    },
    candidateRoutes: [],
    divergence: {
      isMismatch: false,
      mismatchKinds: [],
      summary: "match",
      baselineRouteKey: "agronomist:tech_map_draft",
      semanticRouteKey: "agro:techmap:create",
    },
    versionInfo: {
      routerVersion: "semantic-router-v1",
      promptVersion: "semantic-router-prompt-v1",
      toolsetVersion: "toolset-v1",
      workspaceStateDigest: "digest",
    },
    latencyMs: 5,
    executionPath: "semantic_route_shadow",
    routingContext: {
      source: "shadow",
      promotedPrimary: false,
      enforceCapabilityGating: false,
      sliceId: "agro.techmaps.list-open-create",
      semanticIntent: {
        domain: "agro",
        entity: "techmap",
        action: "create",
        interactionMode: "write_candidate",
        mutationRisk: "side_effecting_write",
        filters: {},
        requiredContext: [],
        focusObject: {
          kind: "techmap",
          id: "techmap-77",
        },
        dialogState: {
          activeFlow: null,
          pendingClarificationKeys: [],
          lastUserAction: null,
        },
        resolvability: "resolved",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "semantic_router:techmap_create_execute",
      },
      routeDecision: {
        decisionType: "execute",
        recommendedExecutionMode: "direct_execute",
        eligibleTools: [RaiToolName.GenerateTechMapDraft],
        eligibleFlows: ["tech_map_draft"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      },
      candidateRoutes: [],
    },
    llmUsed: false,
    llmError: null,
  };

  return {
    request: {
      message: "Пересобери техкарту по полю 12 на сезон 2026",
      workspaceContext: {
        route: "/consulting/techmaps",
        activeEntityRefs: [
          { kind: "field", id: "field-12" },
          { kind: "techmap", id: "techmap-77" },
        ],
        filters: {
          seasonId: "season-2026",
          cropCode: "rapeseed",
        },
        selectedRowSummary: {
          kind: "techmap",
          id: "techmap-77",
          title: "Техкарта 77",
          status: "draft",
        },
      },
    },
    baselineClassification: {
      targetRole: "agronomist",
      intent: "tech_map_draft",
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.85,
      method: "regex",
      reason: "responsibility:agronomy:tech_map_draft",
    },
    finalClassification: {
      targetRole: "agronomist",
      intent: "tech_map_draft",
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.85,
      method: "semantic_route_shadow",
      reason: "semantic_router:techmap_create_execute",
    },
    finalRequestedToolCalls: [
      {
        name: RaiToolName.GenerateTechMapDraft,
        payload: {
          fieldRef: "field-12",
          seasonRef: "season-2026",
          crop: "rapeseed",
        },
      },
    ],
    semanticEvaluation,
  } as Parameters<SemanticIngressService["buildFrame"]>[0];
}
