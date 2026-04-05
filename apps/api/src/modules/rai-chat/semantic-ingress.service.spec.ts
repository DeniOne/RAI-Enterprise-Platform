import { SemanticIngressService } from "./semantic-ingress.service";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";

describe("SemanticIngressService", () => {
  const service = new SemanticIngressService();
  const buildTechMapFrame = (params: {
    message: string;
    workspaceContext: any;
    clarificationResume?: boolean;
    semanticEvaluation?: any;
    finalClassification?: any;
    baselineClassification?: any;
    finalRequestedToolCalls?: any[];
  }) => {
    const baseSemanticEvaluation = {
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
        legacyRouteKey: "agronomist:tech_map_draft",
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

    const semanticEvaluation = {
      ...baseSemanticEvaluation,
      ...(params.semanticEvaluation ?? {}),
      classification: {
        ...baseSemanticEvaluation.classification,
        ...(params.semanticEvaluation?.classification ?? {}),
      },
      semanticIntent: {
        ...baseSemanticEvaluation.semanticIntent,
        ...(params.semanticEvaluation?.semanticIntent ?? {}),
      },
      routeDecision: {
        ...baseSemanticEvaluation.routeDecision,
        ...(params.semanticEvaluation?.routeDecision ?? {}),
      },
      candidateRoutes:
        params.semanticEvaluation?.candidateRoutes ?? baseSemanticEvaluation.candidateRoutes,
      divergence: {
        ...baseSemanticEvaluation.divergence,
        ...(params.semanticEvaluation?.divergence ?? {}),
      },
      versionInfo: {
        ...baseSemanticEvaluation.versionInfo,
        ...(params.semanticEvaluation?.versionInfo ?? {}),
      },
      routingContext: {
        ...baseSemanticEvaluation.routingContext,
        ...(params.semanticEvaluation?.routingContext ?? {}),
        semanticIntent: {
          ...baseSemanticEvaluation.routingContext.semanticIntent,
          ...(params.semanticEvaluation?.routingContext?.semanticIntent ?? {}),
        },
        routeDecision: {
          ...baseSemanticEvaluation.routingContext.routeDecision,
          ...(params.semanticEvaluation?.routingContext?.routeDecision ?? {}),
        },
        candidateRoutes:
          params.semanticEvaluation?.routingContext?.candidateRoutes ??
          baseSemanticEvaluation.routingContext.candidateRoutes,
      },
    };

    return service.buildFrame({
      request: {
        message: params.message,
        workspaceContext: params.workspaceContext,
        ...(params.clarificationResume ? { clarificationResume: true } : {}),
      } as any,
      baselineClassification:
        params.baselineClassification ??
        ({
          targetRole: "agronomist",
          intent: "tech_map_draft",
          toolName: RaiToolName.GenerateTechMapDraft,
          confidence: 0.85,
          method: "regex",
          reason: "responsibility:agronomy:tech_map_draft",
        } as any),
      finalClassification:
        params.finalClassification ??
        ({
          targetRole: "agronomist",
          intent: "tech_map_draft",
          toolName: RaiToolName.GenerateTechMapDraft,
          confidence: 0.85,
          method: "semantic_route_shadow",
          reason: "semantic_router:techmap_create_execute",
        } as any),
      finalRequestedToolCalls:
        params.finalRequestedToolCalls ??
        [
          {
            name: RaiToolName.GenerateTechMapDraft,
            payload: {
              fieldRef: "field-12",
              seasonRef: "season-2026",
              crop: "rapeseed",
            },
          },
        ],
      semanticEvaluation: semanticEvaluation as any,
    });
  };

  it("строит first-class ingress frame для proof-slice crm.register_counterparty", () => {
    const frame = service.buildFrame({
      request: {
        message: "Давай зарегим контрагента. ИНН 2636041493",
        workspaceContext: {
          route: "/parties",
        },
      } as any,
      baselineClassification: {
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
          method: "semantic_route_shadow",
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
        executionPath: "semantic_route_shadow",
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
          source: "fallback_normalization",
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

  it("строит tech-map specialization frame для rebuild workflow", () => {
    const frame = service.buildFrame({
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
      } as any,
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
      semanticEvaluation: {
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
          legacyRouteKey: "agronomist:tech_map_draft",
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
      } as any,
    });

    expect(frame).toEqual(
      expect.objectContaining({
        requestShape: "single_intent",
        goal: "tech_map_draft",
        operationAuthority: "unknown",
        writePolicy: expect.objectContaining({
          decision: "execute",
        }),
        techMapFrame: expect.objectContaining({
          workflowKind: "tech_map",
          userIntent: "rebuild_existing",
          workflowStageHint: "assemble",
          requestedArtifact: "workflow_draft",
          contextReadiness: "S3_DRAFT_READY",
          policyPosture: "open",
        }),
      }),
    );
    expect(frame.techMapFrame?.scope).toEqual(
      expect.objectContaining({
        fieldIds: ["field-12"],
        seasonId: "season-2026",
        cropCode: "rapeseed",
        existingTechMapId: "techmap-77",
      }),
    );
    expect(frame.techMapFrame?.requiredActions).toEqual(
      expect.arrayContaining(["execute"]),
    );
  });

  it("нормализует compare_variants в comparison report с variant count", () => {
    const frame = buildTechMapFrame({
      message: "Сравни 3 варианта техкарты по полю 12",
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
      semanticEvaluation: {
        routeDecision: {
          decisionType: "navigate",
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
        semanticIntent: {
          requiredContext: ["field", "season"],
          confidenceBand: "high",
        },
      },
    });

    expect(frame.techMapFrame).toEqual(
      expect.objectContaining({
        userIntent: "compare_variants",
        workflowStageHint: "compare",
        requestedArtifact: "comparison_report",
        contextReadiness: "S4_REVIEW_READY",
        policyPosture: "open",
        comparisonMode: expect.objectContaining({
          enabled: true,
          variantCount: 3,
        }),
      }),
    );
    expect(frame.techMapFrame?.requiredActions).toEqual(
      expect.arrayContaining(["execute"]),
    );
    expect(frame.techMapFrame?.resultConstraints).toEqual(
      expect.arrayContaining(["tech_map.baseline_context_consistent"]),
    );
  });

  it("нормализует review_draft в review packet с human_review", () => {
    const frame = buildTechMapFrame({
      message: "Проверь техкарту по полю 12 и объясни риски",
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
      semanticEvaluation: {
        routeDecision: {
          decisionType: "navigate",
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
        semanticIntent: {
          requiredContext: ["field", "season"],
          confidenceBand: "medium",
        },
      },
    });

    expect(frame.techMapFrame).toEqual(
      expect.objectContaining({
        userIntent: "review_draft",
        workflowStageHint: "review",
        requestedArtifact: "review_packet",
        contextReadiness: "S4_REVIEW_READY",
        policyPosture: "open",
      }),
    );
    expect(frame.techMapFrame?.requiredActions).toEqual(
      expect.arrayContaining(["execute", "human_review"]),
    );
  });

  it("нормализует approve_publish в publication packet с governed posture", () => {
    const frame = buildTechMapFrame({
      message: "Отправь техкарту на публикацию",
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
          status: "review",
        },
      },
      semanticEvaluation: {
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
        semanticIntent: {
          requiredContext: ["field", "season"],
          confidenceBand: "high",
        },
      },
    });

    expect(frame.techMapFrame).toEqual(
      expect.objectContaining({
        userIntent: "approve_publish",
        workflowStageHint: "publication",
        requestedArtifact: "publication_packet",
        contextReadiness: "S5_PUBLISHABLE",
        policyPosture: "governed",
      }),
    );
    expect(frame.techMapFrame?.requiredActions).toEqual(
      expect.arrayContaining(["confirm", "human_review"]),
    );
  });

  it("нормализует clarification resume и block explanation", () => {
    const resumeFrame = buildTechMapFrame({
      message: "Продолжай с того же места",
      clarificationResume: true,
      workspaceContext: {
        route: "/consulting/techmaps",
        activeEntityRefs: [
          { kind: "field", id: "field-12" },
          { kind: "techmap", id: "techmap-77" },
        ],
        filters: {
          seasonId: "season-2026",
        },
      },
      semanticEvaluation: {
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
        semanticIntent: {
          requiredContext: ["field"],
          confidenceBand: "high",
        },
      },
    });

    expect(resumeFrame.techMapFrame).toEqual(
      expect.objectContaining({
        userIntent: "resume_clarify",
        workflowStageHint: "clarify",
        requestedArtifact: "workflow_draft",
        policyPosture: "open",
      }),
    );
    expect(resumeFrame).toEqual(
      expect.objectContaining({
        interactionMode: "workflow_resume",
        requestShape: "clarification_resume",
        operationAuthority: "workflow_resume",
      }),
    );

    const blockFrame = buildTechMapFrame({
      message: "Почему техкарту заблокировали?",
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
          status: "blocked",
        },
      },
      semanticEvaluation: {
        routeDecision: {
          decisionType: "block",
          recommendedExecutionMode: "ask_confirmation",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: "policy_block",
        },
        semanticIntent: {
          requiredContext: ["field", "season"],
          confidenceBand: "medium",
        },
      },
    });

    expect(blockFrame.techMapFrame).toEqual(
      expect.objectContaining({
        userIntent: "explain_block",
        workflowStageHint: "review",
        requestedArtifact: "block_explanation",
        policyPosture: "blocked",
      }),
    );
    expect(blockFrame.techMapFrame?.requiredActions).toEqual(
      expect.arrayContaining(["human_review", "block"]),
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
      baselineClassification: {
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
          method: "semantic_route_shadow",
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
        executionPath: "semantic_route_shadow",
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
    expect(frame.compositePlan?.stages[1]?.payloadBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceStageId: "register_counterparty",
          sourcePath: "data.partyId",
          targetPath: "partyId",
          required: true,
        }),
      ]),
    );
    expect(frame.compositePlan?.stages[2]?.payloadBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceStageId: "create_crm_account",
          sourcePath: "data.accountId",
          targetPath: "accountId",
          required: true,
        }),
      ]),
    );
  });

  it("выносит confirm policy отдельно от lexical signal для high-risk write", () => {
    const frame = service.buildFrame({
      request: {
        message: "Согласуй изменение критичной записи",
        workspaceContext: {
          route: "/crm",
        },
      } as any,
      baselineClassification: {
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
          method: "semantic_route_primary",
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
        executionPath: "semantic_route_primary",
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
      baselineClassification: {
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
        method: "semantic_route_shadow",
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
          method: "semantic_route_shadow",
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
        executionPath: "semantic_route_shadow",
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
      baselineClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.82,
        method: "explicit_tool_path",
        reason: "explicit_tool",
      },
      finalClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.82,
        method: "explicit_tool_path",
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
          method: "semantic_route_shadow",
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
        executionPath: "semantic_route_shadow",
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

  it("explicitPlannerToolCalls: два tool call без composite и без TechMap → multi-branch SubIntentGraph", () => {
    const frame = service.buildFrame({
      request: { message: "два тула", workspaceContext: { route: "/consulting/fields" } } as any,
      baselineClassification: {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.8,
        method: "regex",
        reason: "x",
      },
      finalClassification: {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.8,
        method: "explicit_tool_path",
        reason: "x",
      },
      finalRequestedToolCalls: [
        { name: RaiToolName.ComputeDeviations, payload: {} },
        { name: RaiToolName.QueryKnowledge, payload: { query: "x" } },
      ],
      semanticEvaluation: {
        promotedPrimary: false,
        sliceId: null,
        requestedToolCalls: [],
        classification: {
          targetRole: "agronomist",
          intent: "compute_deviations",
          toolName: RaiToolName.ComputeDeviations,
          confidence: 0.8,
          method: "semantic_route_shadow",
          reason: "x",
        },
        semanticIntent: {
          domain: "unknown",
          entity: "unknown",
          action: "unknown",
          interactionMode: "unknown",
          mutationRisk: "unknown",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "missing",
          ambiguityType: "no_matching_route",
          confidenceBand: "low",
          reason: "mock",
        },
        routeDecision: {
          decisionType: "abstain",
          recommendedExecutionMode: "no_op",
          eligibleTools: [],
          eligibleFlows: [],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: "mock",
          policyBlockReason: null,
        },
        candidateRoutes: [],
        divergence: {
          isMismatch: false,
          mismatchKinds: [],
          summary: "match",
          legacyRouteKey: "legacy",
          semanticRouteKey: "semantic",
        },
        versionInfo: {
          routerVersion: "semantic-router-v1",
          promptVersion: "semantic-router-prompt-v1",
          toolsetVersion: "toolset",
          workspaceStateDigest: "digest",
        },
        latencyMs: 1,
        executionPath: "semantic_route_shadow",
        routingContext: {
          source: "shadow",
          promotedPrimary: false,
          enforceCapabilityGating: false,
          sliceId: null,
          semanticIntent: {
            domain: "unknown",
            entity: "unknown",
            action: "unknown",
            interactionMode: "unknown",
            mutationRisk: "unknown",
            filters: {},
            requiredContext: [],
            focusObject: null,
            dialogState: {
              activeFlow: null,
              pendingClarificationKeys: [],
              lastUserAction: null,
            },
            resolvability: "missing",
            ambiguityType: "no_matching_route",
            confidenceBand: "low",
            reason: "mock",
          },
          routeDecision: {
            decisionType: "abstain",
            recommendedExecutionMode: "no_op",
            eligibleTools: [],
            eligibleFlows: [],
            requiredContextMissing: [],
            policyChecksRequired: [],
            needsConfirmation: false,
            needsClarification: false,
            abstainReason: "mock",
            policyBlockReason: null,
          },
          candidateRoutes: [],
        },
        llmUsed: false,
        llmError: null,
      } as any,
    });

    expect(frame.explicitPlannerToolCalls).toHaveLength(2);
    expect(frame.subIntentGraph?.branches).toHaveLength(2);
    expect(frame.subIntentGraph?.branches.map((b) => b.toolName)).toEqual([
      RaiToolName.ComputeDeviations,
      RaiToolName.QueryKnowledge,
    ]);
    expect(frame.explicitPlannerToolCalls?.[0]?.payload).toEqual({});
    expect(frame.explicitPlannerToolCalls?.[1]?.payload).toEqual({ query: "x" });
    expect(frame.subIntentGraph?.branches[0]?.payload).toEqual({});
    expect(frame.subIntentGraph?.branches[1]?.payload).toEqual({ query: "x" });
  });
});
