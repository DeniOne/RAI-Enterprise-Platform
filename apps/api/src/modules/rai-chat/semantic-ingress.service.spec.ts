import { SemanticIngressService } from "./semantic-ingress.service";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";

describe("SemanticIngressService", () => {
  const service = new SemanticIngressService();

  it("строит first-class ingress frame для proof-slice crm.register_counterparty", () => {
    const frame = service.buildFrame({
      request: {
        message: "Давай зарегим контрагента. ИНН 2636041493",
        workspaceContext: {
          route: "/parties",
        },
      } as any,
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.82,
        method: "regex",
        reason: "responsibility:crm:register_counterparty",
      },
      finalClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.82,
        method: "regex",
        reason: "responsibility:crm:register_counterparty",
      },
      finalRequestedToolCalls: [
        {
          name: RaiToolName.RegisterCounterparty,
          payload: {
            inn: "2636041493",
            jurisdictionCode: "RU",
            partyType: "LEGAL_ENTITY",
          },
        },
      ],
      semanticEvaluation: {
        promotedPrimary: false,
        sliceId: null,
        requestedToolCalls: [],
        classification: {
          targetRole: "crm_agent",
          intent: "register_counterparty",
          toolName: RaiToolName.RegisterCounterparty,
          confidence: 0.82,
          method: "semantic_router_shadow",
          reason: "crm_write_candidate",
        },
        semanticIntent: {
          domain: "crm",
          entity: "counterparty",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "crm_write_candidate",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [],
          eligibleFlows: [],
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
          legacyRouteKey: "crm_agent:register_counterparty",
          semanticRouteKey: "crm:counterparty:create",
        },
        versionInfo: {
          routerVersion: "semantic-router-v1",
          promptVersion: "semantic-router-prompt-v1",
          toolsetVersion: "toolset-v1",
          workspaceStateDigest: "digest",
        },
        latencyMs: 5,
        executionPath: "semantic_router_shadow",
        routingContext: {
          source: "shadow",
          promotedPrimary: false,
          enforceCapabilityGating: false,
          sliceId: null,
          semanticIntent: {
            domain: "crm",
            entity: "counterparty",
            action: "create",
            interactionMode: "write_candidate",
            mutationRisk: "side_effecting_write",
            filters: {},
            requiredContext: [],
            focusObject: null,
            dialogState: {
              activeFlow: null,
              pendingClarificationKeys: [],
              lastUserAction: null,
            },
            resolvability: "resolved",
            ambiguityType: "none",
            confidenceBand: "high",
            reason: "crm_write_candidate",
          },
          routeDecision: {
            decisionType: "execute",
            recommendedExecutionMode: "direct_execute",
            eligibleTools: [],
            eligibleFlows: [],
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
      } as any,
    });

    expect(frame).toEqual(
      expect.objectContaining({
        version: "v1",
        interactionMode: "task_request",
        requestShape: "single_intent",
        goal: "register_counterparty",
        operationAuthority: "direct_user_command",
        riskClass: "write_candidate",
        requiresConfirmation: false,
        confidenceBand: "high",
        proofSliceId: "crm.register_counterparty",
        requestedOperation: expect.objectContaining({
          ownerRole: "crm_agent",
          intent: "register_counterparty",
          toolName: RaiToolName.RegisterCounterparty,
          source: "legacy_contracts",
          decisionType: "execute",
        }),
      }),
    );
    expect(frame.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "inn",
          value: "2636041493",
        }),
      ]),
    );
    expect(frame.domainCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "crm",
          ownerRole: "crm_agent",
        }),
      ]),
    );
  });

  it("требует governed confirmation для register_counterparty без прямой пользовательской команды", () => {
    const frame = service.buildFrame({
      request: {
        message: "",
        toolCalls: [
          {
            name: RaiToolName.RegisterCounterparty,
            payload: {
              inn: "2636041493",
              jurisdictionCode: "RU",
              partyType: "LEGAL_ENTITY",
            },
          },
        ],
      } as any,
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.82,
        method: "tool_call_primary",
        reason: "explicit_tool",
      },
      finalClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.82,
        method: "tool_call_primary",
        reason: "explicit_tool",
      },
      finalRequestedToolCalls: [
        {
          name: RaiToolName.RegisterCounterparty,
          payload: {
            inn: "2636041493",
            jurisdictionCode: "RU",
            partyType: "LEGAL_ENTITY",
          },
        },
      ],
      semanticEvaluation: {
        promotedPrimary: false,
        sliceId: null,
        requestedToolCalls: [],
        classification: {
          targetRole: "crm_agent",
          intent: "register_counterparty",
          toolName: RaiToolName.RegisterCounterparty,
          confidence: 0.82,
          method: "semantic_router_shadow",
          reason: "crm_write_candidate",
        },
        semanticIntent: {
          domain: "crm",
          entity: "counterparty",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "crm_write_candidate",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [],
          eligibleFlows: [],
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
          legacyRouteKey: "crm_agent:register_counterparty",
          semanticRouteKey: "crm:counterparty:create",
        },
        versionInfo: {
          routerVersion: "semantic-router-v1",
          promptVersion: "semantic-router-prompt-v1",
          toolsetVersion: "toolset-v1",
          workspaceStateDigest: "digest",
        },
        latencyMs: 5,
        executionPath: "semantic_router_shadow",
        routingContext: {
          source: "shadow",
          promotedPrimary: false,
          enforceCapabilityGating: false,
          sliceId: null,
          semanticIntent: {
            domain: "crm",
            entity: "counterparty",
            action: "create",
            interactionMode: "write_candidate",
            mutationRisk: "side_effecting_write",
            filters: {},
            requiredContext: [],
            focusObject: null,
            dialogState: {
              activeFlow: null,
              pendingClarificationKeys: [],
              lastUserAction: null,
            },
            resolvability: "resolved",
            ambiguityType: "none",
            confidenceBand: "high",
            reason: "crm_write_candidate",
          },
          routeDecision: {
            decisionType: "execute",
            recommendedExecutionMode: "direct_execute",
            eligibleTools: [],
            eligibleFlows: [],
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
      } as any,
    });

    expect(frame).toEqual(
      expect.objectContaining({
        operationAuthority: "delegated_or_autonomous",
        requiresConfirmation: true,
        requestedOperation: expect.objectContaining({
          source: "explicit_tool_call",
        }),
      }),
    );
    expect(frame.explanation).toContain("требует governed confirmation");
  });
});
