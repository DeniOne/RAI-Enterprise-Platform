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
    expect(frame.writePolicy).toEqual(
      expect.objectContaining({
        decision: "execute",
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

  it("нормализует составной CRM-scenario в composite workflow", () => {
    const frame = service.buildFrame({
      request: {
        message:
          "Давай зарегим контрагента, потом создай аккаунт и открой карточку.",
        workspaceContext: {
          route: "/parties",
        },
      } as any,
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.84,
        method: "regex",
        reason: "responsibility:crm:register_counterparty",
      },
      finalClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.84,
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
          confidence: 0.84,
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
        requestShape: "composite",
        goal: "регистрация контрагента, создание CRM-аккаунта и открытие карточки",
        operationAuthority: "direct_user_command",
        explanation: expect.stringContaining("Составной CRM-сценарий"),
        compositePlan: expect.objectContaining({
          leadOwnerAgent: "crm_agent",
          executionStrategy: "sequential",
        }),
      }),
    );
    expect(frame.compositePlan?.stages.map((stage) => stage.stageId)).toEqual([
      "register_counterparty",
      "create_crm_account",
      "review_account_workspace",
    ]);
  });

  it("выносит confirm policy отдельно от lexical signal для high-risk write", () => {
    const frame = service.buildFrame({
      request: {
        message: "Согласуй изменение критичной записи",
        workspaceContext: {
          route: "/crm",
        },
      } as any,
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "update_account_profile",
        toolName: null,
        confidence: 0.5,
        method: "regex",
        reason: "high_risk_write",
      },
      finalClassification: {
        targetRole: "crm_agent",
        intent: "update_account_profile",
        toolName: null,
        confidence: 0.5,
        method: "regex",
        reason: "high_risk_write",
      },
      finalRequestedToolCalls: [],
      semanticEvaluation: {
        promotedPrimary: true,
        sliceId: null,
        requestedToolCalls: [],
        classification: {
          targetRole: "crm_agent",
          intent: "update_account_profile",
          toolName: null,
          confidence: 0.5,
          method: "semantic_router_primary",
          reason: "high_risk_write",
        },
        semanticIntent: {
          domain: "crm",
          entity: "account",
          action: "update",
          interactionMode: "write_candidate",
          mutationRisk: "irreversible_write",
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
          confidenceBand: "medium",
          reason: "high_risk_write",
        },
        routeDecision: {
          decisionType: "confirm",
          recommendedExecutionMode: "ask_confirmation",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: true,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        candidateRoutes: [],
        divergence: {
          isMismatch: false,
          mismatchKinds: [],
          summary: "match",
          legacyRouteKey: "crm_agent:update_account_profile",
          semanticRouteKey: "crm:account:update",
        },
        versionInfo: {
          routerVersion: "semantic-router-v1",
          promptVersion: "semantic-router-prompt-v1",
          toolsetVersion: "toolset-v1",
          workspaceStateDigest: "digest",
        },
        latencyMs: 5,
        executionPath: "semantic_router_primary",
        routingContext: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: null,
          semanticIntent: {
            domain: "crm",
            entity: "account",
            action: "update",
            interactionMode: "write_candidate",
            mutationRisk: "irreversible_write",
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
            confidenceBand: "medium",
            reason: "high_risk_write",
          },
          routeDecision: {
            decisionType: "confirm",
            recommendedExecutionMode: "ask_confirmation",
            eligibleTools: [],
            eligibleFlows: [],
            requiredContextMissing: [],
            policyChecksRequired: [],
            needsConfirmation: true,
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

    expect(frame.writePolicy).toEqual(
      expect.objectContaining({
        decision: "confirm",
      }),
    );
    expect(frame.requiresConfirmation).toBe(true);
  });

  it("нормализует agro execution fact -> finance cost aggregation в аналитический composite workflow", () => {
    const frame = service.buildFrame({
      request: {
        message:
          "Собери agro execution fact -> finance cost aggregation по текущему сезону.",
        workspaceContext: {
          route: "/consulting/dashboard",
          filters: {
            seasonId: "season-2026",
            planId: "plan-2026",
          },
          activeEntityRefs: [{ kind: "field", id: "field-42" }],
        },
      } as any,
      legacyClassification: {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.82,
        method: "regex",
        reason: "responsibility:agro:compute_deviations",
      },
      finalClassification: {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.82,
        method: "semantic_router_shadow",
        reason: "responsibility:agro:compute_deviations",
      },
      finalRequestedToolCalls: [
        {
          name: RaiToolName.ComputeDeviations,
          payload: {
            scope: { seasonId: "season-2026", fieldId: "field-42" },
          },
        },
      ],
      semanticEvaluation: {
        promotedPrimary: false,
        sliceId: null,
        requestedToolCalls: [],
        classification: {
          targetRole: "agronomist",
          intent: "compute_deviations",
          toolName: RaiToolName.ComputeDeviations,
          confidence: 0.82,
          method: "semantic_router_shadow",
          reason: "responsibility:agro:compute_deviations",
        },
        semanticIntent: {
          domain: "agro",
          entity: "execution_fact",
          action: "read",
          interactionMode: "analysis",
          mutationRisk: "safe_read",
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
          reason: "agro_execution_fact",
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
          legacyRouteKey: "agronomist:compute_deviations",
          semanticRouteKey: "agro:execution_fact:read",
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
            domain: "agro",
            entity: "execution_fact",
            action: "read",
            interactionMode: "analysis",
            mutationRisk: "safe_read",
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
            reason: "agro_execution_fact",
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
        requestShape: "composite",
        goal: "агро-факт исполнения и агрегация финансовых затрат",
        explanation: expect.stringContaining("Составной аналитический сценарий"),
        compositePlan: expect.objectContaining({
          leadOwnerAgent: "agronomist",
          executionStrategy: "sequential",
          workflowId: "agro.execution_fact.finance.cost_aggregation",
        }),
      }),
    );
    expect(frame.compositePlan?.stages.map((stage) => stage.stageId)).toEqual([
      "agro_execution_fact",
      "finance_cost_aggregation",
    ]);
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
