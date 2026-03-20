import { Injectable, Logger } from "@nestjs/common";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { WorkspaceContextDto } from "../../../shared/rai-chat/rai-chat.dto";
import { RaiToolCallDto } from "../../../shared/rai-chat/rai-chat.dto";
import { IntentClassification } from "../../../shared/rai-chat/intent-router.types";
import { buildRoutingVersionInfo } from "../../../shared/rai-chat/routing-versioning";
import {
  extractContractReviewQuery,
  extractCrmWorkspaceQuery,
  extractInnFromMessage,
} from "../../../shared/rai-chat/execution-adapter-heuristics";
import {
  AmbiguityType,
  ConfidenceBand,
  DecisionType,
  InteractionMode,
  MutationRisk,
  RecommendedExecutionMode,
  Resolvability,
  RouteDecision,
  RoutingAction,
  RoutingCaseMemoryRetrievedCase,
  RoutingCandidate,
  RoutingDivergence,
  RoutingDomain,
  RoutingEntity,
  SemanticIntent,
  SemanticRoutingEvaluation,
  SemanticRoutingRequest,
  SemanticRoutingContext,
} from "../../../shared/rai-chat/semantic-routing.types";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";
import { RoutingCaseMemoryService } from "./routing-case-memory.service";

const TECHMAP_SLICE_ID = "agro.techmaps.list-open-create";
const DEVIATION_SLICE_ID = "agro.deviations.review";
const PLAN_FACT_SLICE_ID = "finance.plan-fact.read";
const SCENARIO_SLICE_ID = "finance.scenario.analysis";
const RISK_ASSESSMENT_SLICE_ID = "finance.risk.analysis";
const CRM_WORKSPACE_SLICE_ID = "crm.account.workspace-review";
const CRM_INN_LOOKUP_SLICE_ID = "crm.counterparty.lookup";
const CONTRACTS_SLICE_ID = "contracts.registry-review";
const CONTRACTS_AR_BALANCE_SLICE_ID = "contracts.ar-balance.review";
const KNOWLEDGE_SLICE_ID = "knowledge.base.query";

@Injectable()
export class SemanticRouterService {
  private readonly logger = new Logger(SemanticRouterService.name);

  constructor(
    private readonly openRouterGateway: OpenRouterGatewayService,
    private readonly routingCaseMemory: RoutingCaseMemoryService,
  ) {}

  async evaluate(
    request: SemanticRoutingRequest,
  ): Promise<SemanticRoutingEvaluation> {
    const startedAt = Date.now();
    const candidateToolNames = this.collectToolIdentifiers(request);
    const versionInfo = buildRoutingVersionInfo({
      toolIdentifiers: candidateToolNames,
      workspaceContext: request.workspaceContext,
    });

    const deterministicBase = this.buildDeterministicEvaluation(request);
    const retrievedCaseMemory = await this.routingCaseMemory
      .retrieveRelevantCases({
        companyId: request.companyId,
        message: request.message,
        workspaceContext: request.workspaceContext,
        legacyClassification: request.legacyClassification,
        semanticIntent: deterministicBase.semanticIntent,
        routeDecision: deterministicBase.routeDecision,
        sliceId: deterministicBase.sliceId,
      })
      .catch((error) => {
        this.logger.warn(
          `semantic_router case_memory_failed traceId=${request.traceId} err=${String(
            (error as Error)?.message ?? error,
          )}`,
        );
        return [] as RoutingCaseMemoryRetrievedCase[];
      });
    const deterministic = this.applyCaseMemory(
      deterministicBase,
      retrievedCaseMemory,
      request,
    );
    let llmUsed = false;
    let llmError: string | null = null;
    const llmResult = await this.tryRefineWithLlm(request, deterministic).catch(
      (error) => {
        llmError = String((error as Error)?.message ?? error);
        this.logger.warn(
          `semantic_router llm_refine_failed traceId=${request.traceId} err=${llmError}`,
        );
        return null;
      },
    );
    llmUsed = llmResult !== null;
    const chosen = llmResult ?? deterministic;
    const latencyMs = Date.now() - startedAt;
    return {
      ...chosen,
      versionInfo,
      latencyMs,
      llmUsed,
      llmError,
    };
  }

  private buildDeterministicEvaluation(
    request: SemanticRoutingRequest,
  ): Omit<
    SemanticRoutingEvaluation,
    "versionInfo" | "latencyMs" | "llmUsed" | "llmError"
  > {
    const normalized = request.message.toLowerCase();
    const workspace = request.workspaceContext;
    const sliceId = this.resolveSliceId(request.message, workspace);
    const fieldRef = this.resolveFieldRef(workspace);
    const seasonRef = this.resolveSeasonRef(workspace);
    const focusObject = this.extractFocusObject(workspace);

    let semanticIntent: SemanticIntent;
    let routeDecision: RouteDecision;
    let candidateRoutes: RoutingCandidate[];
    let classification: IntentClassification;
    let requestedToolCalls: RaiToolCallDto[];
    let promotedPrimary = false;

    if (this.isKnowledgeSlice(request.message, workspace)) {
      const knowledgeQuery = request.message.trim();
      semanticIntent = {
        domain: RoutingDomain.Knowledge,
        entity: RoutingEntity.Knowledge,
        action: RoutingAction.Search,
        interactionMode: InteractionMode.ReadOnly,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractKnowledgeFilters(workspace, knowledgeQuery),
        requiredContext: [],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability: Resolvability.Resolved,
        ambiguityType: AmbiguityType.None,
        confidenceBand: ConfidenceBand.High,
        reason: "deterministic:knowledge_query",
      };
      routeDecision = {
        decisionType: DecisionType.Execute,
        recommendedExecutionMode: RecommendedExecutionMode.DirectExecute,
        eligibleTools: [RaiToolName.QueryKnowledge],
        eligibleFlows: ["query_knowledge"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "query_knowledge",
          label: "Найти в базе знаний",
          targetRole: "knowledge",
          intent: "query_knowledge",
          toolName: RaiToolName.QueryKnowledge,
          decisionType: DecisionType.Execute,
          score: 1,
          reason: "knowledge_workspace_query",
        },
      ];
      classification = {
        targetRole: "knowledge",
        intent: "query_knowledge",
        toolName: RaiToolName.QueryKnowledge,
        confidence: 0.92,
        method: "semantic_router_shadow",
        reason: "semantic_router:query_knowledge_execute",
      };
      requestedToolCalls = [
        {
          name: RaiToolName.QueryKnowledge,
          payload: {
            query: knowledgeQuery,
          },
        },
      ];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === KNOWLEDGE_SLICE_ID,
      );
    } else if (this.isReadOnlyTechMapQuery(normalized)) {
      semanticIntent = {
        domain: RoutingDomain.Agro,
        entity: RoutingEntity.Techmap,
        action: RoutingAction.List,
        interactionMode: InteractionMode.Navigation,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractTechmapFilters(normalized, workspace),
        requiredContext: [],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          focusObject?.kind === "techmap"
            ? Resolvability.Resolved
            : Resolvability.Partial,
        ambiguityType: AmbiguityType.None,
        confidenceBand: ConfidenceBand.High,
        reason: "deterministic:read_only_techmaps",
      };
      routeDecision = {
        decisionType: DecisionType.Navigate,
        recommendedExecutionMode: RecommendedExecutionMode.OpenRoute,
        eligibleTools: [],
        eligibleFlows: ["techmaps_registry"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "open_techmaps_registry",
          label: "Открыть реестр техкарт",
          targetRole: "agronomist",
          intent: "open_techmaps_registry",
          toolName: null,
          decisionType: DecisionType.Navigate,
          score: 1,
          reason: "read_only_signal",
        },
        {
          id: "tech_map_draft",
          label: "Подготовить техкарту",
          targetRole: "agronomist",
          intent: "tech_map_draft",
          toolName: RaiToolName.GenerateTechMapDraft,
          decisionType: DecisionType.Clarify,
          score: 0.1,
          reason: "same_entity_lower_priority",
        },
      ];
      classification = {
        targetRole: "agronomist",
        intent: "open_techmaps_registry",
        toolName: null,
        confidence: 0.94,
        method: "semantic_router_shadow",
        reason: "semantic_router:read_only_techmaps",
      };
      requestedToolCalls = [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === TECHMAP_SLICE_ID,
      );
    } else if (this.isCreateTechMapQuery(normalized)) {
      const requiredContextMissing = [
        ...(fieldRef ? [] : ["fieldRef"]),
        ...(seasonRef ? [] : ["seasonRef"]),
      ];
      semanticIntent = {
        domain: RoutingDomain.Agro,
        entity: RoutingEntity.Techmap,
        action: RoutingAction.Create,
        interactionMode: InteractionMode.WriteCandidate,
        mutationRisk: MutationRisk.SideEffectingWrite,
        filters: this.extractTechmapFilters(normalized, workspace),
        requiredContext: ["fieldRef", "seasonRef"],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          requiredContextMissing.length === 0
            ? Resolvability.Resolved
            : Resolvability.Missing,
        ambiguityType:
          requiredContextMissing.length === 0
            ? AmbiguityType.None
            : AmbiguityType.MissingContext,
        confidenceBand:
          requiredContextMissing.length === 0
            ? ConfidenceBand.High
            : ConfidenceBand.Medium,
        reason: "deterministic:techmap_create",
      };
      routeDecision = {
        decisionType:
          requiredContextMissing.length === 0
            ? DecisionType.Execute
            : DecisionType.Clarify,
        recommendedExecutionMode:
          requiredContextMissing.length === 0
            ? RecommendedExecutionMode.DirectExecute
            : RecommendedExecutionMode.AskClarification,
        eligibleTools: [RaiToolName.GenerateTechMapDraft],
        eligibleFlows: ["tech_map_draft"],
        requiredContextMissing,
        policyChecksRequired: ["agronomist_write_guard"],
        needsConfirmation: false,
        needsClarification: requiredContextMissing.length > 0,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "tech_map_draft",
          label: "Подготовить техкарту",
          targetRole: "agronomist",
          intent: "tech_map_draft",
          toolName: RaiToolName.GenerateTechMapDraft,
          decisionType: routeDecision.decisionType,
          score: requiredContextMissing.length === 0 ? 1 : 0.85,
          reason:
            requiredContextMissing.length === 0
              ? "create_signal_with_context"
              : "create_signal_missing_context",
        },
        {
          id: "open_techmaps_registry",
          label: "Открыть реестр техкарт",
          targetRole: "agronomist",
          intent: "open_techmaps_registry",
          toolName: null,
          decisionType: DecisionType.Navigate,
          score: 0.15,
          reason: "same_entity_secondary_read_path",
        },
      ];
      classification = {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: RaiToolName.GenerateTechMapDraft,
        confidence: requiredContextMissing.length === 0 ? 0.92 : 0.83,
        method: "semantic_router_shadow",
        reason:
          requiredContextMissing.length === 0
            ? "semantic_router:techmap_create_execute"
            : "semantic_router:techmap_create_clarify",
      };
      requestedToolCalls =
        requiredContextMissing.length === 0
          ? [
              {
                name: RaiToolName.GenerateTechMapDraft,
                payload: {
                  fieldRef,
                  seasonRef,
                  crop: this.resolveCrop(normalized),
                },
              },
            ]
          : [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === TECHMAP_SLICE_ID,
      );
    } else if (/отклон|deviation/i.test(normalized)) {
      const hasDeviationScope = Boolean(
        focusObject ||
        fieldRef ||
        seasonRef ||
        workspace?.route?.includes("/deviations"),
      );
      semanticIntent = {
        domain: RoutingDomain.Agro,
        entity: RoutingEntity.Deviation,
        action: RoutingAction.Analyze,
        interactionMode: InteractionMode.Analysis,
        mutationRisk: MutationRisk.SafeRead,
        filters: workspace?.filters ?? {},
        requiredContext: [],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability: hasDeviationScope
          ? Resolvability.Partial
          : Resolvability.Resolved,
        ambiguityType: AmbiguityType.None,
        confidenceBand: ConfidenceBand.High,
        reason: "deterministic:deviation_analysis",
      };
      routeDecision = {
        decisionType: DecisionType.Execute,
        recommendedExecutionMode: RecommendedExecutionMode.DirectExecute,
        eligibleTools: [RaiToolName.ComputeDeviations],
        eligibleFlows: ["deviation_review"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "compute_deviations",
          label: "Показать отклонения",
          targetRole: "agronomist",
          intent: "compute_deviations",
          toolName: RaiToolName.ComputeDeviations,
          decisionType: DecisionType.Execute,
          score: 1,
          reason: "deviation_signal",
        },
      ];
      classification = {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.88,
        method: "semantic_router_shadow",
        reason: "semantic_router:compute_deviations",
      };
      requestedToolCalls = [
        {
          name: RaiToolName.ComputeDeviations,
          payload: {
            scope: {
              ...(fieldRef ? { fieldId: fieldRef } : {}),
              ...(seasonRef ? { seasonId: seasonRef } : {}),
            },
          },
        },
      ];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === DEVIATION_SLICE_ID,
      );
    } else if (this.isScenarioQuery(normalized, workspace)) {
      const planId = this.resolvePlanId(workspace);
      semanticIntent = {
        domain: RoutingDomain.Finance,
        entity: RoutingEntity.Scenario,
        action: RoutingAction.Analyze,
        interactionMode: InteractionMode.Analysis,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractFinanceScopeFilters(workspace, planId, seasonRef),
        requiredContext: [],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          planId || seasonRef ? Resolvability.Resolved : Resolvability.Partial,
        ambiguityType: AmbiguityType.None,
        confidenceBand:
          planId || seasonRef ? ConfidenceBand.High : ConfidenceBand.Medium,
        reason: "deterministic:scenario_analysis",
      };
      routeDecision = {
        decisionType: DecisionType.Execute,
        recommendedExecutionMode: RecommendedExecutionMode.DirectExecute,
        eligibleTools: [RaiToolName.SimulateScenario],
        eligibleFlows: ["simulate_scenario"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "simulate_scenario",
          label: "Смоделировать сценарий",
          targetRole: "economist",
          intent: "simulate_scenario",
          toolName: RaiToolName.SimulateScenario,
          decisionType: DecisionType.Execute,
          score: planId || seasonRef ? 1 : 0.84,
          reason:
            planId || seasonRef
              ? "scenario_signal_with_context"
              : "scenario_signal_without_context",
        },
      ];
      classification = {
        targetRole: "economist",
        intent: "simulate_scenario",
        toolName: RaiToolName.SimulateScenario,
        confidence: planId || seasonRef ? 0.9 : 0.78,
        method: "semantic_router_shadow",
        reason: "semantic_router:simulate_scenario",
      };
      requestedToolCalls = [
        {
          name: RaiToolName.SimulateScenario,
          payload: {
            scope: {
              ...(planId ? { planId } : {}),
              ...(seasonRef ? { seasonId: seasonRef } : {}),
            },
          },
        },
      ];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === SCENARIO_SLICE_ID,
      );
    } else if (this.isRiskAssessmentQuery(normalized, workspace)) {
      const planId = this.resolvePlanId(workspace);
      semanticIntent = {
        domain: RoutingDomain.Finance,
        entity: RoutingEntity.RiskAssessment,
        action: RoutingAction.Analyze,
        interactionMode: InteractionMode.Analysis,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractFinanceScopeFilters(workspace, planId, seasonRef),
        requiredContext: [],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          planId || seasonRef ? Resolvability.Resolved : Resolvability.Partial,
        ambiguityType: AmbiguityType.None,
        confidenceBand:
          planId || seasonRef ? ConfidenceBand.High : ConfidenceBand.Medium,
        reason: "deterministic:risk_assessment",
      };
      routeDecision = {
        decisionType: DecisionType.Execute,
        recommendedExecutionMode: RecommendedExecutionMode.DirectExecute,
        eligibleTools: [RaiToolName.ComputeRiskAssessment],
        eligibleFlows: ["compute_risk_assessment"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "compute_risk_assessment",
          label: "Оценить риск",
          targetRole: "economist",
          intent: "compute_risk_assessment",
          toolName: RaiToolName.ComputeRiskAssessment,
          decisionType: DecisionType.Execute,
          score: planId || seasonRef ? 1 : 0.82,
          reason:
            planId || seasonRef
              ? "risk_signal_with_context"
              : "risk_signal_without_context",
        },
      ];
      classification = {
        targetRole: "economist",
        intent: "compute_risk_assessment",
        toolName: RaiToolName.ComputeRiskAssessment,
        confidence: planId || seasonRef ? 0.89 : 0.76,
        method: "semantic_router_shadow",
        reason: "semantic_router:compute_risk_assessment",
      };
      requestedToolCalls = [
        {
          name: RaiToolName.ComputeRiskAssessment,
          payload: {
            scope: {
              ...(planId ? { planId } : {}),
              ...(seasonRef ? { seasonId: seasonRef } : {}),
            },
          },
        },
      ];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion &&
          sliceId === RISK_ASSESSMENT_SLICE_ID,
      );
    } else if (this.isPlanFactQuery(normalized, workspace)) {
      const planId = this.resolvePlanId(workspace);
      const requiredContextMissing = planId || seasonRef ? [] : ["seasonId"];
      semanticIntent = {
        domain: RoutingDomain.Finance,
        entity: RoutingEntity.PlanFact,
        action: RoutingAction.Analyze,
        interactionMode: InteractionMode.Analysis,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractFinanceScopeFilters(workspace, planId, seasonRef),
        requiredContext:
          requiredContextMissing.length === 0 ? [] : ["seasonId"],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          requiredContextMissing.length === 0
            ? Resolvability.Resolved
            : Resolvability.Missing,
        ambiguityType:
          requiredContextMissing.length === 0
            ? AmbiguityType.None
            : AmbiguityType.MissingContext,
        confidenceBand:
          requiredContextMissing.length === 0
            ? ConfidenceBand.High
            : ConfidenceBand.Medium,
        reason: "deterministic:plan_fact_read",
      };
      routeDecision = {
        decisionType:
          requiredContextMissing.length === 0
            ? DecisionType.Execute
            : DecisionType.Clarify,
        recommendedExecutionMode:
          requiredContextMissing.length === 0
            ? RecommendedExecutionMode.DirectExecute
            : RecommendedExecutionMode.AskClarification,
        eligibleTools: [RaiToolName.ComputePlanFact],
        eligibleFlows: ["compute_plan_fact"],
        requiredContextMissing,
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: requiredContextMissing.length > 0,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "compute_plan_fact",
          label: "Показать план-факт",
          targetRole: "economist",
          intent: "compute_plan_fact",
          toolName: RaiToolName.ComputePlanFact,
          decisionType: routeDecision.decisionType,
          score: requiredContextMissing.length === 0 ? 1 : 0.82,
          reason:
            requiredContextMissing.length === 0
              ? "plan_fact_signal_with_context"
              : "plan_fact_signal_missing_context",
        },
      ];
      classification = {
        targetRole: "economist",
        intent: "compute_plan_fact",
        toolName: RaiToolName.ComputePlanFact,
        confidence: requiredContextMissing.length === 0 ? 0.91 : 0.79,
        method: "semantic_router_shadow",
        reason:
          requiredContextMissing.length === 0
            ? "semantic_router:compute_plan_fact_execute"
            : "semantic_router:compute_plan_fact_clarify",
      };
      requestedToolCalls =
        requiredContextMissing.length === 0
          ? [
              {
                name: RaiToolName.ComputePlanFact,
                payload: {
                  scope: {
                    ...(planId ? { planId } : {}),
                    ...(seasonRef ? { seasonId: seasonRef } : {}),
                  },
                },
              },
            ]
          : [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === PLAN_FACT_SLICE_ID,
      );
    } else if (this.isCrmInnLookupSlice(request.message, workspace)) {
      const inn = this.resolveCrmInnFromMessage(request.message);
      const requiredContextMissing = inn ? [] : ["inn"];
      semanticIntent = {
        domain: RoutingDomain.Crm,
        entity: RoutingEntity.Counterparty,
        action: RoutingAction.Search,
        interactionMode: InteractionMode.ReadOnly,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractCrmInnLookupFilters(workspace, inn),
        requiredContext: requiredContextMissing.length === 0 ? [] : ["inn"],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          requiredContextMissing.length === 0
            ? Resolvability.Resolved
            : Resolvability.Missing,
        ambiguityType:
          requiredContextMissing.length === 0
            ? AmbiguityType.None
            : AmbiguityType.MissingContext,
        confidenceBand:
          requiredContextMissing.length === 0
            ? ConfidenceBand.High
            : ConfidenceBand.Medium,
        reason:
          requiredContextMissing.length === 0
            ? "deterministic:crm_lookup_by_inn"
            : "deterministic:crm_lookup_by_inn_clarify",
      };
      routeDecision = {
        decisionType:
          requiredContextMissing.length === 0
            ? DecisionType.Execute
            : DecisionType.Clarify,
        recommendedExecutionMode:
          requiredContextMissing.length === 0
            ? RecommendedExecutionMode.DirectExecute
            : RecommendedExecutionMode.AskClarification,
        eligibleTools: [RaiToolName.LookupCounterpartyByInn],
        eligibleFlows: ["lookup_counterparty_by_inn"],
        requiredContextMissing,
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: requiredContextMissing.length > 0,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "lookup_counterparty_by_inn",
          label: "Проверить контрагента по ИНН",
          targetRole: "crm_agent",
          intent: "lookup_counterparty_by_inn",
          toolName: RaiToolName.LookupCounterpartyByInn,
          decisionType: routeDecision.decisionType,
          score: requiredContextMissing.length === 0 ? 1 : 0.82,
          reason:
            requiredContextMissing.length === 0
              ? "crm_inn_lookup_with_context"
              : "crm_inn_lookup_missing_context",
        },
      ];
      classification = {
        targetRole: "crm_agent",
        intent: "lookup_counterparty_by_inn",
        toolName: RaiToolName.LookupCounterpartyByInn,
        confidence: requiredContextMissing.length === 0 ? 0.89 : 0.74,
        method: "semantic_router_shadow",
        reason:
          requiredContextMissing.length === 0
            ? "semantic_router:lookup_counterparty_by_inn_execute"
            : "semantic_router:lookup_counterparty_by_inn_clarify",
      };
      requestedToolCalls =
        requiredContextMissing.length === 0
          ? [
              {
                name: RaiToolName.LookupCounterpartyByInn,
                payload: {
                  inn,
                },
              },
            ]
          : [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === CRM_INN_LOOKUP_SLICE_ID,
      );
    } else if (this.isCrmWorkspaceReviewQuery(request.message, workspace)) {
      const accountId = this.resolveCrmWorkspaceAccountId(workspace);
      const workspaceQuery = accountId
        ? undefined
        : extractCrmWorkspaceQuery(request.message);
      const requiredContextMissing =
        accountId || workspaceQuery ? [] : ["accountId"];
      semanticIntent = {
        domain: RoutingDomain.Crm,
        entity: RoutingEntity.Account,
        action: RoutingAction.Open,
        interactionMode: InteractionMode.Analysis,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractCrmWorkspaceFilters(
          workspace,
          accountId,
          workspaceQuery,
        ),
        requiredContext:
          requiredContextMissing.length === 0 ? [] : ["accountId"],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          requiredContextMissing.length === 0
            ? Resolvability.Resolved
            : Resolvability.Missing,
        ambiguityType:
          requiredContextMissing.length === 0
            ? AmbiguityType.None
            : AmbiguityType.MissingContext,
        confidenceBand:
          requiredContextMissing.length === 0
            ? ConfidenceBand.High
            : ConfidenceBand.Medium,
        reason:
          requiredContextMissing.length === 0
            ? "deterministic:crm_workspace_review"
            : "deterministic:crm_workspace_clarify",
      };
      routeDecision = {
        decisionType:
          requiredContextMissing.length === 0
            ? DecisionType.Execute
            : DecisionType.Clarify,
        recommendedExecutionMode:
          requiredContextMissing.length === 0
            ? RecommendedExecutionMode.DirectExecute
            : RecommendedExecutionMode.AskClarification,
        eligibleTools: [RaiToolName.GetCrmAccountWorkspace],
        eligibleFlows: ["review_account_workspace"],
        requiredContextMissing,
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: requiredContextMissing.length > 0,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "review_account_workspace",
          label: "Открыть карточку контрагента",
          targetRole: "crm_agent",
          intent: "review_account_workspace",
          toolName: RaiToolName.GetCrmAccountWorkspace,
          decisionType: routeDecision.decisionType,
          score: requiredContextMissing.length === 0 ? 1 : 0.81,
          reason:
            requiredContextMissing.length === 0
              ? "crm_workspace_signal_with_target"
              : "crm_workspace_signal_missing_target",
        },
      ];
      classification = {
        targetRole: "crm_agent",
        intent: "review_account_workspace",
        toolName: RaiToolName.GetCrmAccountWorkspace,
        confidence: requiredContextMissing.length === 0 ? 0.88 : 0.73,
        method: "semantic_router_shadow",
        reason:
          requiredContextMissing.length === 0
            ? "semantic_router:review_account_workspace_execute"
            : "semantic_router:review_account_workspace_clarify",
      };
      requestedToolCalls =
        requiredContextMissing.length === 0
          ? [
              {
                name: RaiToolName.GetCrmAccountWorkspace,
                payload: {
                  ...(accountId ? { accountId } : {}),
                  ...(workspaceQuery ? { query: workspaceQuery } : {}),
                },
              },
            ]
          : [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === CRM_WORKSPACE_SLICE_ID,
      );
    } else if (this.isContractsArBalanceSlice(request.message, workspace)) {
      const invoiceId = this.resolveInvoiceId(workspace, request.message);
      const requiredContextMissing = invoiceId ? [] : ["invoiceId"];
      semanticIntent = {
        domain: RoutingDomain.Contracts,
        entity: RoutingEntity.Contract,
        action: RoutingAction.Analyze,
        interactionMode: InteractionMode.ReadOnly,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractContractsArBalanceFilters(workspace, invoiceId),
        requiredContext:
          requiredContextMissing.length === 0 ? [] : ["invoiceId"],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          requiredContextMissing.length === 0
            ? Resolvability.Resolved
            : Resolvability.Missing,
        ambiguityType:
          requiredContextMissing.length === 0
            ? AmbiguityType.None
            : AmbiguityType.MissingContext,
        confidenceBand:
          requiredContextMissing.length === 0
            ? ConfidenceBand.High
            : ConfidenceBand.Medium,
        reason:
          requiredContextMissing.length === 0
            ? "deterministic:contracts_ar_balance"
            : "deterministic:contracts_ar_balance_clarify",
      };
      routeDecision = {
        decisionType:
          requiredContextMissing.length === 0
            ? DecisionType.Execute
            : DecisionType.Clarify,
        recommendedExecutionMode:
          requiredContextMissing.length === 0
            ? RecommendedExecutionMode.DirectExecute
            : RecommendedExecutionMode.AskClarification,
        eligibleTools: [RaiToolName.GetArBalance],
        eligibleFlows: ["review_ar_balance"],
        requiredContextMissing,
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: requiredContextMissing.length > 0,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: "review_ar_balance",
          label: "Показать дебиторский остаток",
          targetRole: "contracts_agent",
          intent: "review_ar_balance",
          toolName: RaiToolName.GetArBalance,
          decisionType: routeDecision.decisionType,
          score: requiredContextMissing.length === 0 ? 1 : 0.81,
          reason:
            requiredContextMissing.length === 0
              ? "contracts_ar_balance_with_invoice"
              : "contracts_ar_balance_missing_invoice",
        },
      ];
      classification = {
        targetRole: "contracts_agent",
        intent: "review_ar_balance",
        toolName: RaiToolName.GetArBalance,
        confidence: requiredContextMissing.length === 0 ? 0.9 : 0.74,
        method: "semantic_router_shadow",
        reason:
          requiredContextMissing.length === 0
            ? "semantic_router:review_ar_balance_execute"
            : "semantic_router:review_ar_balance_clarify",
      };
      requestedToolCalls =
        requiredContextMissing.length === 0
          ? [
              {
                name: RaiToolName.GetArBalance,
                payload: {
                  invoiceId,
                },
              },
            ]
          : [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion &&
          sliceId === CONTRACTS_AR_BALANCE_SLICE_ID,
      );
    } else if (this.isContractsSlice(request.message, workspace)) {
      const contractId = this.resolveContractId(workspace);
      const contractQuery = contractId
        ? undefined
        : this.resolveContractReviewQuery(request.message);
      const isListQuery = this.isContractsListQuery(request.message);
      const requiredContextMissing =
        isListQuery || contractId || contractQuery ? [] : ["contractId"];
      const intent = isListQuery
        ? "list_commerce_contracts"
        : "review_commerce_contract";
      const toolName = isListQuery
        ? RaiToolName.ListCommerceContracts
        : RaiToolName.GetCommerceContract;

      semanticIntent = {
        domain: RoutingDomain.Contracts,
        entity: RoutingEntity.Contract,
        action: isListQuery ? RoutingAction.List : RoutingAction.Open,
        interactionMode: InteractionMode.ReadOnly,
        mutationRisk: MutationRisk.SafeRead,
        filters: this.extractContractsFilters(
          workspace,
          contractId,
          contractQuery,
        ),
        requiredContext:
          requiredContextMissing.length === 0 ? [] : ["contractId"],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability:
          requiredContextMissing.length === 0
            ? Resolvability.Resolved
            : Resolvability.Missing,
        ambiguityType:
          requiredContextMissing.length === 0
            ? AmbiguityType.None
            : AmbiguityType.MissingContext,
        confidenceBand:
          requiredContextMissing.length === 0
            ? ConfidenceBand.High
            : ConfidenceBand.Medium,
        reason: isListQuery
          ? "deterministic:contracts_list"
          : requiredContextMissing.length === 0
            ? "deterministic:contracts_review"
            : "deterministic:contracts_review_clarify",
      };
      routeDecision = {
        decisionType:
          requiredContextMissing.length === 0
            ? DecisionType.Execute
            : DecisionType.Clarify,
        recommendedExecutionMode:
          requiredContextMissing.length === 0
            ? RecommendedExecutionMode.DirectExecute
            : RecommendedExecutionMode.AskClarification,
        eligibleTools: [toolName],
        eligibleFlows: [intent],
        requiredContextMissing,
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: requiredContextMissing.length > 0,
        abstainReason: null,
        policyBlockReason: null,
      };
      candidateRoutes = [
        {
          id: intent,
          label: isListQuery
            ? "Показать реестр договоров"
            : "Открыть карточку договора",
          targetRole: "contracts_agent",
          intent,
          toolName,
          decisionType: routeDecision.decisionType,
          score: requiredContextMissing.length === 0 ? 1 : 0.8,
          reason: isListQuery
            ? "contracts_registry_read_signal"
            : requiredContextMissing.length === 0
              ? "contracts_review_signal_with_target"
              : "contracts_review_signal_missing_target",
        },
      ];
      classification = {
        targetRole: "contracts_agent",
        intent,
        toolName,
        confidence: requiredContextMissing.length === 0 ? 0.89 : 0.74,
        method: "semantic_router_shadow",
        reason:
          requiredContextMissing.length === 0
            ? `semantic_router:${intent}_execute`
            : `semantic_router:${intent}_clarify`,
      };
      requestedToolCalls =
        requiredContextMissing.length === 0
          ? [
              {
                name: toolName,
                payload: isListQuery
                  ? { limit: 20 }
                  : {
                      ...(contractId ? { contractId } : {}),
                      ...(contractQuery ? { query: contractQuery } : {}),
                    },
              },
            ]
          : [];
      promotedPrimary = Boolean(
        request.allowPrimaryPromotion && sliceId === CONTRACTS_SLICE_ID,
      );
    } else {
      semanticIntent = {
        domain: this.mapDomainFromLegacy(request.legacyClassification),
        entity: RoutingEntity.Unknown,
        action: RoutingAction.Unknown,
        interactionMode: InteractionMode.Unknown,
        mutationRisk: MutationRisk.Unknown,
        filters: workspace?.filters ?? {},
        requiredContext: [],
        focusObject,
        dialogState: this.buildDialogState(request.message, workspace),
        resolvability: Resolvability.Missing,
        ambiguityType: AmbiguityType.NoMatchingRoute,
        confidenceBand: ConfidenceBand.Low,
        reason: "deterministic:no_matching_route",
      };
      routeDecision = {
        decisionType: DecisionType.Abstain,
        recommendedExecutionMode: RecommendedExecutionMode.NoOp,
        eligibleTools: [],
        eligibleFlows: [],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: true,
        abstainReason: "no_matching_route",
        policyBlockReason: null,
      };
      candidateRoutes = this.buildLegacyCandidates(
        request.legacyClassification,
      );
      classification = {
        ...request.legacyClassification,
        method: "semantic_router_shadow",
      };
      requestedToolCalls = request.requestedToolCalls;
    }

    const divergence = this.buildDivergence(
      request.legacyClassification,
      semanticIntent,
      routeDecision,
    );
    const routingContext: SemanticRoutingContext = {
      source: promotedPrimary ? "primary" : "shadow",
      promotedPrimary,
      enforceCapabilityGating: promotedPrimary,
      sliceId,
      semanticIntent,
      routeDecision,
      candidateRoutes,
      retrievedCaseMemory: [],
    };

    return {
      semanticIntent,
      routeDecision,
      candidateRoutes,
      divergence,
      sliceId,
      promotedPrimary,
      executionPath: promotedPrimary
        ? "semantic_router_primary"
        : "semantic_router_shadow",
      requestedToolCalls,
      classification: promotedPrimary
        ? { ...classification, method: "semantic_router_primary" }
        : classification,
      routingContext,
      retrievedCaseMemory: [],
    };
  }

  private async tryRefineWithLlm(
    request: SemanticRoutingRequest,
    deterministic: Omit<
      SemanticRoutingEvaluation,
      "versionInfo" | "latencyMs" | "llmUsed" | "llmError"
    >,
  ): Promise<Omit<
    SemanticRoutingEvaluation,
    "versionInfo" | "latencyMs" | "llmUsed" | "llmError"
  > | null> {
    if (process.env.RAI_SEMANTIC_ROUTER_LLM_ENABLED !== "true") {
      return null;
    }

    const llm = await this.openRouterGateway.generate({
      traceId: request.traceId,
      agentRole: "knowledge",
      model: process.env.RAI_SEMANTIC_ROUTER_MODEL ?? "openai/gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: [
            "Ты semantic router для RAI.",
            "Верни только JSON без markdown.",
            "Поля: domain, entity, action, decisionType, recommendedExecutionMode, confidenceBand, reason.",
            "Разрешённые значения:",
            "domain: agro, finance, knowledge, crm, contracts, front_office, monitoring, unknown",
            "entity: techmap, plan_fact, scenario, risk_assessment, account, field, season, deviation, contract, counterparty, knowledge, unknown",
            "action: list, open, create, update, delete, analyze, search, unknown",
            "decisionType: execute, navigate, clarify, confirm, block, abstain",
            "recommendedExecutionMode: direct_execute, open_route, ask_clarification, ask_confirmation, deny, dry_run, no_op",
            "confidenceBand: high, medium, low",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            message: request.message,
            workspaceRoute: request.workspaceContext?.route ?? null,
            selectedRowSummary: request.workspaceContext?.selectedRowSummary
              ? {
                  kind: request.workspaceContext.selectedRowSummary.kind,
                  id: request.workspaceContext.selectedRowSummary.id,
                  status:
                    request.workspaceContext.selectedRowSummary.status ?? null,
                }
              : null,
            legacy: {
              targetRole: request.legacyClassification.targetRole,
              intent: request.legacyClassification.intent,
              toolName: request.legacyClassification.toolName,
            },
            caseMemoryHints:
              deterministic.retrievedCaseMemory?.map((item) => ({
                key: item.key,
                sliceId: item.sliceId,
                targetRole: item.targetRole,
                decisionType: item.decisionType,
                entity: item.semanticIntent.entity,
                action: item.semanticIntent.action,
                mutationRisk: item.semanticIntent.mutationRisk,
                similarityScore: item.similarityScore,
                lifecycleStatus: item.lifecycleStatus,
                sampleQuery: item.sampleQuery,
              })) ?? [],
          }),
        },
      ],
      temperature: 0,
      maxTokens: 300,
      responseFormat: "text",
      timeoutMs: 5_000,
    });

    const parsed = this.parseLlmPayload(llm.outputText);
    if (!parsed) {
      return null;
    }

    const semanticIntent: SemanticIntent = {
      ...deterministic.semanticIntent,
      domain: parsed.domain,
      entity: parsed.entity,
      action: parsed.action,
      confidenceBand: parsed.confidenceBand,
      reason: `llm_refined:${parsed.reason}`,
    };
    const routeDecision: RouteDecision = {
      ...deterministic.routeDecision,
      decisionType: parsed.decisionType,
      recommendedExecutionMode: parsed.recommendedExecutionMode,
    };
    const candidateRoutes = deterministic.candidateRoutes.map(
      (candidate, index) =>
        index === 0
          ? {
              ...candidate,
              decisionType: routeDecision.decisionType,
              reason: `llm_refined:${parsed.reason}`,
            }
          : candidate,
    );
    const divergence = this.buildDivergence(
      request.legacyClassification,
      semanticIntent,
      routeDecision,
    );
    return {
      ...deterministic,
      semanticIntent,
      routeDecision,
      candidateRoutes,
      divergence,
      routingContext: {
        ...deterministic.routingContext,
        semanticIntent,
        routeDecision,
        candidateRoutes,
      },
      retrievedCaseMemory: deterministic.retrievedCaseMemory,
    };
  }

  private applyCaseMemory(
    deterministic: Omit<
      SemanticRoutingEvaluation,
      "versionInfo" | "latencyMs" | "llmUsed" | "llmError"
    >,
    retrievedCaseMemory: RoutingCaseMemoryRetrievedCase[],
    request: SemanticRoutingRequest,
  ): Omit<
    SemanticRoutingEvaluation,
    "versionInfo" | "latencyMs" | "llmUsed" | "llmError"
  > {
    if (retrievedCaseMemory.length === 0) {
      return deterministic;
    }

    let semanticIntent = deterministic.semanticIntent;
    let routeDecision = deterministic.routeDecision;
    let candidateRoutes = deterministic.candidateRoutes;
    let classification = deterministic.classification;
    let requestedToolCalls = deterministic.requestedToolCalls;
    let sliceId = deterministic.sliceId ?? null;
    let promotedPrimary = deterministic.promotedPrimary;

    const topCase = retrievedCaseMemory[0];
    const alignedWithDeterministic =
      topCase.semanticIntent.entity === deterministic.semanticIntent.entity &&
      topCase.semanticIntent.action === deterministic.semanticIntent.action &&
      topCase.routeDecision.decisionType ===
        deterministic.routeDecision.decisionType;

    if (alignedWithDeterministic && topCase.similarityScore >= 0.7) {
      semanticIntent = {
        ...semanticIntent,
        confidenceBand: ConfidenceBand.High,
        reason: `${semanticIntent.reason};case_memory_aligned:${topCase.key}`,
      };
      classification = {
        ...classification,
        reason: `${classification.reason};case_memory_aligned`,
      };
      candidateRoutes = candidateRoutes.map((candidate, index) =>
        index === 0
          ? {
              ...candidate,
              score: Math.max(candidate.score, topCase.similarityScore),
              reason: `${candidate.reason};case_memory`,
            }
          : candidate,
      );
    } else if (
      deterministic.routeDecision.decisionType === DecisionType.Abstain &&
      topCase.similarityScore >= 0.82 &&
      topCase.semanticIntent.mutationRisk === MutationRisk.SafeRead &&
      [DecisionType.Navigate, DecisionType.Clarify].includes(
        topCase.routeDecision.decisionType,
      )
    ) {
      semanticIntent = {
        ...topCase.semanticIntent,
        focusObject: deterministic.semanticIntent.focusObject,
        dialogState: deterministic.semanticIntent.dialogState,
        reason: `case_memory_safe_override:${topCase.key}`,
      };
      routeDecision = {
        ...topCase.routeDecision,
      };
      candidateRoutes = this.buildCaseMemoryCandidates(topCase);
      classification = {
        targetRole: topCase.targetRole,
        intent: this.resolveIntentFromCaseMemory(topCase),
        toolName: topCase.routeDecision.eligibleTools[0] ?? null,
        confidence: Number(topCase.similarityScore.toFixed(2)),
        method: "semantic_router_shadow",
        reason: `semantic_router:case_memory_safe_override`,
      };
      requestedToolCalls = [];
      sliceId = sliceId ?? topCase.sliceId ?? null;
      promotedPrimary = Boolean(request.allowPrimaryPromotion && sliceId);
    }

    return {
      ...deterministic,
      semanticIntent,
      routeDecision,
      candidateRoutes,
      classification: promotedPrimary
        ? { ...classification, method: "semantic_router_primary" }
        : classification,
      requestedToolCalls,
      sliceId,
      promotedPrimary,
      executionPath: promotedPrimary
        ? "semantic_router_primary"
        : "semantic_router_shadow",
      routingContext: {
        source: promotedPrimary ? "primary" : "shadow",
        promotedPrimary,
        enforceCapabilityGating: promotedPrimary,
        sliceId,
        semanticIntent,
        routeDecision,
        candidateRoutes,
        retrievedCaseMemory,
      },
      retrievedCaseMemory,
      divergence: this.buildDivergence(
        request.legacyClassification,
        semanticIntent,
        routeDecision,
      ),
    };
  }

  private parseLlmPayload(outputText: string): {
    domain: RoutingDomain;
    entity: RoutingEntity;
    action: RoutingAction;
    decisionType: DecisionType;
    recommendedExecutionMode: RecommendedExecutionMode;
    confidenceBand: ConfidenceBand;
    reason: string;
  } | null {
    try {
      const parsed = JSON.parse(outputText) as Record<string, unknown>;
      const domain = this.pickEnumValue(RoutingDomain, parsed.domain);
      const entity = this.pickEnumValue(RoutingEntity, parsed.entity);
      const action = this.pickEnumValue(RoutingAction, parsed.action);
      const decisionType = this.pickEnumValue(
        DecisionType,
        parsed.decisionType,
      );
      const recommendedExecutionMode = this.pickEnumValue(
        RecommendedExecutionMode,
        parsed.recommendedExecutionMode,
      );
      const confidenceBand = this.pickEnumValue(
        ConfidenceBand,
        parsed.confidenceBand,
      );
      const reason =
        typeof parsed.reason === "string" && parsed.reason.trim().length > 0
          ? parsed.reason.trim()
          : "llm_semantic_router";
      if (
        !domain ||
        !entity ||
        !action ||
        !decisionType ||
        !recommendedExecutionMode ||
        !confidenceBand
      ) {
        return null;
      }
      return {
        domain,
        entity,
        action,
        decisionType,
        recommendedExecutionMode,
        confidenceBand,
        reason,
      };
    } catch {
      return null;
    }
  }

  private pickEnumValue<T extends Record<string, string>>(
    enumObject: T,
    value: unknown,
  ): T[keyof T] | null {
    if (typeof value !== "string") {
      return null;
    }
    const normalized = value.trim();
    return (Object.values(enumObject) as string[]).includes(normalized)
      ? (normalized as T[keyof T])
      : null;
  }

  private collectToolIdentifiers(request: SemanticRoutingRequest): string[] {
    const toolNames = request.requestedToolCalls.map((call) => call.name);
    if (request.legacyClassification.toolName) {
      toolNames.push(request.legacyClassification.toolName);
    }
    const sliceId = this.resolveSliceId(
      request.message,
      request.workspaceContext,
    );
    if (sliceId === TECHMAP_SLICE_ID) {
      toolNames.push(RaiToolName.GenerateTechMapDraft);
    }
    if (sliceId === DEVIATION_SLICE_ID) {
      toolNames.push(RaiToolName.ComputeDeviations);
    }
    if (sliceId === PLAN_FACT_SLICE_ID) {
      toolNames.push(RaiToolName.ComputePlanFact);
    }
    if (sliceId === SCENARIO_SLICE_ID) {
      toolNames.push(RaiToolName.SimulateScenario);
    }
    if (sliceId === RISK_ASSESSMENT_SLICE_ID) {
      toolNames.push(RaiToolName.ComputeRiskAssessment);
    }
    if (sliceId === CRM_WORKSPACE_SLICE_ID) {
      toolNames.push(RaiToolName.GetCrmAccountWorkspace);
    }
    if (sliceId === CRM_INN_LOOKUP_SLICE_ID) {
      toolNames.push(RaiToolName.LookupCounterpartyByInn);
    }
    if (sliceId === CONTRACTS_SLICE_ID) {
      toolNames.push(
        RaiToolName.ListCommerceContracts,
        RaiToolName.GetCommerceContract,
      );
    }
    if (sliceId === CONTRACTS_AR_BALANCE_SLICE_ID) {
      toolNames.push(RaiToolName.GetArBalance);
    }
    if (sliceId === KNOWLEDGE_SLICE_ID) {
      toolNames.push(RaiToolName.QueryKnowledge);
    }
    return toolNames;
  }

  private buildDivergence(
    legacyClassification: IntentClassification,
    semanticIntent: SemanticIntent,
    routeDecision: RouteDecision,
  ): RoutingDivergence {
    const mismatchKinds: string[] = [];
    const legacyRouteKey = [
      legacyClassification.targetRole ?? "none",
      legacyClassification.intent ?? "none",
      legacyClassification.toolName ?? "none",
    ].join(":");
    const semanticRouteKey = [
      semanticIntent.domain,
      semanticIntent.entity,
      semanticIntent.action,
      routeDecision.decisionType,
      routeDecision.eligibleTools.join("|") || "none",
    ].join(":");

    if (legacyClassification.targetRole !== null) {
      if (
        legacyClassification.targetRole === "agronomist" &&
        semanticIntent.domain !== RoutingDomain.Agro
      ) {
        mismatchKinds.push("domain");
      }
      if (
        legacyClassification.targetRole !== "agronomist" &&
        semanticIntent.domain === RoutingDomain.Agro
      ) {
        mismatchKinds.push("target_role");
      }
    }

    if (
      legacyClassification.toolName === RaiToolName.GenerateTechMapDraft &&
      routeDecision.decisionType === DecisionType.Navigate
    ) {
      mismatchKinds.push("legacy_write_vs_semantic_read");
    }
    if (
      legacyClassification.toolName !== null &&
      routeDecision.eligibleTools.length > 0 &&
      !routeDecision.eligibleTools.includes(legacyClassification.toolName)
    ) {
      mismatchKinds.push("tool_name");
    }
    if (
      legacyClassification.toolName === null &&
      routeDecision.eligibleTools.length > 0 &&
      routeDecision.decisionType === DecisionType.Execute
    ) {
      mismatchKinds.push("legacy_missing_tool");
    }
    if (
      routeDecision.decisionType === DecisionType.Abstain &&
      legacyClassification.toolName
    ) {
      mismatchKinds.push("abstain_vs_execute");
    }

    return {
      isMismatch: mismatchKinds.length > 0,
      mismatchKinds,
      summary: mismatchKinds.length > 0 ? mismatchKinds.join(",") : "match",
      legacyRouteKey,
      semanticRouteKey,
    };
  }

  private buildLegacyCandidates(
    legacyClassification: IntentClassification,
  ): RoutingCandidate[] {
    return [
      {
        id: legacyClassification.intent ?? "legacy_unknown",
        label: legacyClassification.intent ?? "legacy_unknown",
        targetRole: legacyClassification.targetRole,
        intent: legacyClassification.intent,
        toolName: legacyClassification.toolName,
        decisionType: legacyClassification.toolName
          ? DecisionType.Execute
          : DecisionType.Abstain,
        score: Math.max(legacyClassification.confidence, 0.1),
        reason: legacyClassification.reason,
      },
    ];
  }

  private buildCaseMemoryCandidates(
    caseMemory: RoutingCaseMemoryRetrievedCase,
  ): RoutingCandidate[] {
    return [
      {
        id: `case_memory:${caseMemory.key}`,
        label: this.resolveCaseMemoryCandidateLabel(caseMemory),
        targetRole: caseMemory.targetRole,
        intent: this.resolveIntentFromCaseMemory(caseMemory),
        toolName: caseMemory.routeDecision.eligibleTools[0] ?? null,
        decisionType: caseMemory.routeDecision.decisionType,
        score: caseMemory.similarityScore,
        reason: `case_memory:${caseMemory.lifecycleStatus}`,
      },
    ];
  }

  private resolveIntentFromCaseMemory(
    caseMemory: RoutingCaseMemoryRetrievedCase,
  ): string | null {
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Techmap &&
      caseMemory.semanticIntent.action === RoutingAction.List &&
      caseMemory.routeDecision.decisionType === DecisionType.Navigate
    ) {
      return "open_techmaps_registry";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Techmap &&
      caseMemory.semanticIntent.action === RoutingAction.Create
    ) {
      return "tech_map_draft";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Deviation &&
      caseMemory.semanticIntent.action === RoutingAction.Analyze &&
      caseMemory.routeDecision.decisionType === DecisionType.Execute
    ) {
      return "compute_deviations";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Scenario &&
      caseMemory.semanticIntent.action === RoutingAction.Analyze
    ) {
      return "simulate_scenario";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.RiskAssessment &&
      caseMemory.semanticIntent.action === RoutingAction.Analyze
    ) {
      return "compute_risk_assessment";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Account &&
      caseMemory.semanticIntent.action === RoutingAction.Open
    ) {
      return "review_account_workspace";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Counterparty &&
      caseMemory.semanticIntent.action === RoutingAction.Search
    ) {
      return "lookup_counterparty_by_inn";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.PlanFact &&
      caseMemory.semanticIntent.action === RoutingAction.Analyze
    ) {
      return "compute_plan_fact";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Contract &&
      caseMemory.semanticIntent.action === RoutingAction.Analyze
    ) {
      return "review_ar_balance";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Contract &&
      caseMemory.semanticIntent.action === RoutingAction.List
    ) {
      return "list_commerce_contracts";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Contract &&
      caseMemory.semanticIntent.action === RoutingAction.Open
    ) {
      return "review_commerce_contract";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Knowledge &&
      caseMemory.semanticIntent.action === RoutingAction.Search
    ) {
      return "query_knowledge";
    }
    return null;
  }

  private resolveCaseMemoryCandidateLabel(
    caseMemory: RoutingCaseMemoryRetrievedCase,
  ): string {
    if (
      caseMemory.routeDecision.decisionType === DecisionType.Navigate &&
      caseMemory.semanticIntent.entity === RoutingEntity.Techmap
    ) {
      return "Открыть реестр техкарт";
    }
    if (
      caseMemory.routeDecision.decisionType === DecisionType.Execute &&
      caseMemory.semanticIntent.entity === RoutingEntity.Deviation
    ) {
      return "Показать отклонения";
    }
    if (
      caseMemory.routeDecision.decisionType === DecisionType.Execute &&
      caseMemory.semanticIntent.entity === RoutingEntity.Scenario
    ) {
      return "Смоделировать сценарий";
    }
    if (
      caseMemory.routeDecision.decisionType === DecisionType.Execute &&
      caseMemory.semanticIntent.entity === RoutingEntity.RiskAssessment
    ) {
      return "Оценить риск";
    }
    if (
      caseMemory.semanticIntent.entity === RoutingEntity.Account &&
      caseMemory.routeDecision.decisionType === DecisionType.Execute
    ) {
      return "Открыть карточку контрагента";
    }
    if (caseMemory.semanticIntent.entity === RoutingEntity.Counterparty) {
      return "Проверить контрагента по ИНН";
    }
    if (caseMemory.semanticIntent.entity === RoutingEntity.PlanFact) {
      return caseMemory.routeDecision.decisionType === DecisionType.Clarify
        ? "Уточнить контекст для план-факта"
        : "Показать план-факт";
    }
    if (caseMemory.semanticIntent.entity === RoutingEntity.Contract) {
      if (caseMemory.semanticIntent.action === RoutingAction.Analyze) {
        return caseMemory.routeDecision.decisionType === DecisionType.Clarify
          ? "Уточнить счёт для дебиторки"
          : "Показать дебиторский остаток";
      }
      return caseMemory.semanticIntent.action === RoutingAction.List
        ? "Показать реестр договоров"
        : caseMemory.routeDecision.decisionType === DecisionType.Clarify
          ? "Уточнить договор"
          : "Открыть карточку договора";
    }
    if (caseMemory.semanticIntent.entity === RoutingEntity.Knowledge) {
      return "Найти в базе знаний";
    }
    return "Маршрут из памяти кейсов";
  }

  private buildDialogState(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): SemanticIntent["dialogState"] {
    return {
      activeFlow: workspaceContext?.route?.includes("/consulting/techmaps/new")
        ? "tech_map_draft"
        : workspaceContext?.route?.includes("/consulting/deviations")
          ? "deviation_review"
          : this.isScenarioQuery(message, workspaceContext)
            ? "simulate_scenario"
              : this.isRiskAssessmentQuery(message, workspaceContext)
                ? "compute_risk_assessment"
              : this.isContractsArBalanceSlice(message, workspaceContext)
                ? "review_ar_balance"
              : this.isCrmInnLookupSlice(message, workspaceContext)
                ? "lookup_counterparty_by_inn"
              : this.isKnowledgeSlice(message, workspaceContext)
                ? "query_knowledge"
              : this.isCrmWorkspaceReviewQuery(message, workspaceContext)
                ? "review_account_workspace"
                : this.isContractsWorkspaceRoute(workspaceContext) &&
                    this.isContractsListQuery(message)
                  ? "list_commerce_contracts"
                  : this.isContractsSlice(message, workspaceContext)
                    ? "review_commerce_contract"
                  : workspaceContext?.route?.includes("/consulting/yield")
                    ? "compute_plan_fact"
                    : null,
      pendingClarificationKeys: [],
      lastUserAction: workspaceContext?.lastUserAction ?? null,
    };
  }

  private resolveSliceId(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): string | null {
    if (this.isDeviationSlice(workspaceContext)) {
      return DEVIATION_SLICE_ID;
    }
    if (this.isCrmInnLookupSlice(message, workspaceContext)) {
      return CRM_INN_LOOKUP_SLICE_ID;
    }
    if (this.isKnowledgeSlice(message, workspaceContext)) {
      return KNOWLEDGE_SLICE_ID;
    }
    if (this.isScenarioSlice(message, workspaceContext)) {
      return SCENARIO_SLICE_ID;
    }
    if (this.isRiskAssessmentSlice(message, workspaceContext)) {
      return RISK_ASSESSMENT_SLICE_ID;
    }
    if (this.isCrmWorkspaceSlice(message, workspaceContext)) {
      return CRM_WORKSPACE_SLICE_ID;
    }
    if (this.isContractsArBalanceSlice(message, workspaceContext)) {
      return CONTRACTS_AR_BALANCE_SLICE_ID;
    }
    if (this.isContractsSlice(message, workspaceContext)) {
      return CONTRACTS_SLICE_ID;
    }
    if (this.isPlanFactSlice(message, workspaceContext)) {
      return PLAN_FACT_SLICE_ID;
    }
    if (this.isTechmapSlice(message, workspaceContext)) {
      return TECHMAP_SLICE_ID;
    }
    return null;
  }

  private extractFocusObject(
    workspaceContext?: WorkspaceContextDto,
  ): SemanticIntent["focusObject"] {
    if (workspaceContext?.selectedRowSummary) {
      return {
        kind: workspaceContext.selectedRowSummary.kind,
        id: workspaceContext.selectedRowSummary.id,
      };
    }
    const ref = workspaceContext?.activeEntityRefs?.[0];
    if (!ref) {
      return null;
    }
    return {
      kind: ref.kind,
      id: ref.id,
    };
  }

  private isTechmapSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    const normalized = message.toLowerCase();
    if (/(техкарт|techmap)/i.test(normalized)) {
      return true;
    }
    const route = workspaceContext?.route?.toLowerCase() ?? "";
    if (route.includes("/consulting/techmaps")) {
      return true;
    }
    return (workspaceContext?.activeEntityRefs ?? []).some(
      (item) => item.kind === "techmap" || item.kind === "field",
    );
  }

  private isKnowledgeSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isKnowledgeWorkspaceRoute(workspaceContext) &&
      this.isKnowledgeQuery(message)
    );
  }

  private isDeviationSlice(workspaceContext?: WorkspaceContextDto): boolean {
    const route = workspaceContext?.route?.toLowerCase() ?? "";
    if (route.includes("/consulting/deviations")) {
      return true;
    }
    if (workspaceContext?.selectedRowSummary?.kind === "deviation") {
      return true;
    }
    return false;
  }

  private isPlanFactSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    if (!this.isFinanceWorkspace(workspaceContext)) {
      return false;
    }
    return this.isPlanFactQuery(message, workspaceContext);
  }

  private isScenarioSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isFinanceWorkspace(workspaceContext) &&
      this.isScenarioQuery(message, workspaceContext)
    );
  }

  private isRiskAssessmentSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isFinanceWorkspace(workspaceContext) &&
      this.isRiskAssessmentQuery(message, workspaceContext)
    );
  }

  private isCrmWorkspaceSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isCrmWorkspaceRoute(workspaceContext) &&
      this.isCrmWorkspaceReviewQuery(message, workspaceContext)
    );
  }

  private isCrmInnLookupSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isCrmWorkspaceRoute(workspaceContext) &&
      this.isCrmInnLookupQuery(message)
    );
  }

  private isContractsSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isContractsWorkspaceRoute(workspaceContext) &&
      this.isContractsReadOnlyQuery(message, workspaceContext)
    );
  }

  private isContractsArBalanceSlice(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isContractsWorkspaceRoute(workspaceContext) &&
      this.isContractsArBalanceQuery(message)
    );
  }

  private isContractsReadOnlyQuery(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    return (
      this.isContractsListQuery(message) ||
      this.isContractsReviewQuery(message, workspaceContext)
    );
  }

  private isContractsArBalanceQuery(message: string): boolean {
    if (
      /(созд(ай|ать)|оформи|заключи|добавь|обнови|измени|удали|разнес|подтверд|провед|опубликуй|сформир|оплат)/i.test(
        message,
      )
    ) {
      return false;
    }
    return /(дебитор|дебиторк|ar\s*balance|остаток.*счет|задолжен)/i.test(
      message,
    );
  }

  private isContractsListQuery(message: string): boolean {
    if (this.hasContractsWriteSignal(message)) {
      return false;
    }
    return (
      /(договор|контракт)/i.test(message) &&
      /(реестр|список|перечень|все\s+(?:договор|контракт)|договоры|контракты|какие\s+(?:договоры|контракты))/i.test(
        message,
      )
    );
  }

  private isContractsReviewQuery(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    if (this.hasContractsWriteSignal(message) || this.isContractsListQuery(message)) {
      return false;
    }
    if (!/(договор|контракт)/i.test(message)) {
      return false;
    }
    return (
      Boolean(this.resolveContractId(workspaceContext)) ||
      Boolean(this.resolveContractReviewQuery(message)) ||
      /(карточк|открой|подробн|детал|номер|№)/i.test(message)
    );
  }

  private isContractsWorkspaceRoute(workspaceContext?: WorkspaceContextDto): boolean {
    const route = workspaceContext?.route?.toLowerCase() ?? "";
    return route.includes("/commerce/contracts");
  }

  private hasContractsWriteSignal(message: string): boolean {
    return (
      /(созд(ай|ать)|оформи|заключи|добавь|обнови|измени|удали|разнес|подтверд|провед|опубликуй|сформир)/i.test(
        message,
      ) ||
      /счет|инвойс|invoice|оплат|платеж|обязательств|исполнени|отгрузк|shipment/i.test(
        message,
      )
    );
  }

  private isReadOnlyTechMapQuery(message: string): boolean {
    const hasTechmap = /(техкарт|techmap)/i.test(message);
    const hasCreateSignal =
      /(созд(ай|ать)|сдела(й|ть)|состав(ь|ить)|подготов(ь|ить)|сгенерируй|черновик|draft)/i.test(
        message,
      );
    const hasReadSignal =
      /(покаж|спис|все|какие|посмотр|найд|открой|где|выведи|реестр|активн|архив|заморож|создан)/i.test(
        message,
      );
    return hasTechmap && hasReadSignal && !hasCreateSignal;
  }

  private isCreateTechMapQuery(message: string): boolean {
    return (
      /(техкарт|techmap)/i.test(message) &&
      /(созд(ай|ать)|сдела(й|ть)|состав(ь|ить)|подготов(ь|ить)|сгенерируй|черновик|draft)/i.test(
        message,
      )
    );
  }

  private isPlanFactQuery(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    const normalized = message.toLowerCase();
    if (/(сценар|прогноз|risk|риск)/i.test(normalized)) {
      return false;
    }

    if (/(план[- ]?факт|планфакт|plan[- ]?fact|plan fact)/i.test(normalized)) {
      return true;
    }

    if (!this.isFinanceWorkspace(workspaceContext)) {
      return false;
    }

    return /(kpi|урожай|маржин|ebitda|roi|сравн|факт|план)/i.test(normalized);
  }

  private isScenarioQuery(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    if (!/(сценар|scenario|what if|что если)/i.test(message)) {
      return false;
    }
    return (
      this.isFinanceWorkspace(workspaceContext) ||
      this.hasFinanceMessageSignal(message)
    );
  }

  private isRiskAssessmentQuery(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    if (this.isScenarioQuery(message, workspaceContext)) {
      return false;
    }
    if (/(болез|патоген|погод)/i.test(message)) {
      return false;
    }
    if (!/(риск|risk)/i.test(message)) {
      return false;
    }
    return (
      this.isFinanceWorkspace(workspaceContext) ||
      this.hasFinanceMessageSignal(message)
    );
  }

  private isFinanceWorkspace(workspaceContext?: WorkspaceContextDto): boolean {
    const route = workspaceContext?.route?.toLowerCase() ?? "";
    return (
      route.includes("/consulting/yield") ||
      route.includes("/finance") ||
      workspaceContext?.selectedRowSummary?.kind === "yield"
    );
  }

  private isKnowledgeWorkspaceRoute(
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    const route = workspaceContext?.route?.toLowerCase() ?? "";
    return route === "/knowledge" || route.startsWith("/knowledge/");
  }

  private isKnowledgeQuery(message: string): boolean {
    const normalized = message.trim().toLowerCase();
    if (normalized.length < 3) {
      return false;
    }
    if (/^(привет|здравствуй|добрый\s+день|спасибо|ок|понял|угу)$/i.test(normalized)) {
      return false;
    }
    return true;
  }

  private isCrmWorkspaceReviewQuery(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): boolean {
    if (this.isCrmInnLookupQuery(message)) {
      return false;
    }
    if (
      /(обнови|измени|удали|создай|добавь|зарегистр|оформи|логируй|зафиксируй)/i.test(
        message,
      )
    ) {
      return false;
    }
    const hasSpecificReadSignal =
      /(профил|контакты|директор|гендир|руководител|как\s+зовут|кто\s+(?:директор|гендир|руководител))/i.test(
        message,
      );
    const hasGenericCardSignal = /(карточк|workspace)/i.test(message);
    const hasWorkspaceEntitySignal =
      /(контрагент|клиент|аккаунт)/i.test(message);
    const hasReadSignal =
      hasSpecificReadSignal ||
      (this.isCrmWorkspaceRoute(workspaceContext) &&
        (hasGenericCardSignal || hasWorkspaceEntitySignal));
    if (!hasReadSignal) {
      return false;
    }
    return (
      Boolean(this.resolveCrmWorkspaceAccountId(workspaceContext)) ||
      Boolean(extractCrmWorkspaceQuery(message)) ||
      this.isCrmWorkspaceRoute(workspaceContext)
    );
  }

  private isCrmWorkspaceRoute(workspaceContext?: WorkspaceContextDto): boolean {
    const route = workspaceContext?.route?.toLowerCase() ?? "";
    return (
      route.includes("/parties") ||
      route.includes("/consulting/crm") ||
      route.includes("/crm")
    );
  }

  private hasFinanceMessageSignal(message: string): boolean {
    return /(финанс|марж|бюджет|ebitda|roi|cash|ликвид|план)/i.test(message);
  }

  private isCrmInnLookupQuery(message: string): boolean {
    if (
      /(созд(ай|ать)|зарегистр|добавь|обнови|измени|удали|оформи)/i.test(
        message,
      )
    ) {
      return false;
    }
    if (!/(инн|контрагент|юрлиц|компан)/i.test(message)) {
      return false;
    }
    if (this.resolveCrmInnFromMessage(message)) {
      return true;
    }
    const hasLookupVerb =
      /(провер|проверь|найд|поищ|ищи|посмотр|покаж|уточн|пробей)/i.test(
        message,
      );
    const hasEntity =
      /(контрагент|компан|юрлиц|организац|ип)/i.test(message);
    return /инн/i.test(message) && (hasLookupVerb || hasEntity);
  }

  private resolveFieldRef(
    workspaceContext?: WorkspaceContextDto,
  ): string | undefined {
    const selected =
      workspaceContext?.selectedRowSummary?.kind === "field"
        ? workspaceContext.selectedRowSummary.id
        : undefined;
    const active = workspaceContext?.activeEntityRefs?.find(
      (item) => item.kind === "field",
    )?.id;
    const filterField =
      typeof workspaceContext?.filters?.fieldId === "string"
        ? workspaceContext.filters.fieldId
        : undefined;
    return selected ?? active ?? filterField;
  }

  private resolveSeasonRef(
    workspaceContext?: WorkspaceContextDto,
  ): string | undefined {
    const seasonId =
      typeof workspaceContext?.filters?.seasonId === "string"
        ? workspaceContext.filters.seasonId
        : undefined;
    const seasonRef =
      typeof workspaceContext?.filters?.seasonRef === "string"
        ? workspaceContext.filters.seasonRef
        : undefined;
    return seasonId ?? seasonRef;
  }

  private resolvePlanId(
    workspaceContext?: WorkspaceContextDto,
  ): string | undefined {
    if (workspaceContext?.selectedRowSummary?.kind === "yield") {
      return workspaceContext.selectedRowSummary.id;
    }
    return typeof workspaceContext?.filters?.planId === "string"
      ? workspaceContext.filters.planId
      : undefined;
  }

  private resolveCrmWorkspaceAccountId(
    workspaceContext?: WorkspaceContextDto,
  ): string | undefined {
    const selected = workspaceContext?.selectedRowSummary;
    if (
      selected?.id &&
      (!selected.kind ||
        ["account", "party", "farm", "holding"].includes(
          selected.kind.toLowerCase(),
        ))
    ) {
      return selected.id;
    }
    return workspaceContext?.activeEntityRefs?.find((item) =>
      ["party", "account", "farm", "holding"].includes(item.kind),
    )?.id;
  }

  private resolveContractId(
    workspaceContext?: WorkspaceContextDto,
  ): string | undefined {
    if (workspaceContext?.selectedRowSummary?.kind === "contract") {
      return workspaceContext.selectedRowSummary.id;
    }
    const activeContract = workspaceContext?.activeEntityRefs?.find(
      (item) => item.kind === "contract",
    )?.id;
    if (activeContract) {
      return activeContract;
    }
    return typeof workspaceContext?.filters?.contractId === "string"
      ? workspaceContext.filters.contractId
      : undefined;
  }

  private resolveContractReviewQuery(message: string): string | undefined {
    return extractContractReviewQuery(message);
  }

  private resolveInvoiceId(
    workspaceContext?: WorkspaceContextDto,
    message?: string,
  ): string | undefined {
    if (
      workspaceContext?.selectedRowSummary?.kind?.toLowerCase() === "invoice"
    ) {
      return workspaceContext.selectedRowSummary.id;
    }
    const activeInvoice = workspaceContext?.activeEntityRefs?.find(
      (item) => item.kind.toLowerCase() === "invoice",
    )?.id;
    if (activeInvoice) {
      return activeInvoice;
    }
    const filterInvoiceId =
      typeof workspaceContext?.filters?.invoiceId === "string"
        ? workspaceContext.filters.invoiceId
        : undefined;
    if (filterInvoiceId) {
      return filterInvoiceId;
    }
    if (!message) {
      return undefined;
    }
    const fromMessage = message.match(/\b(?:inv|invoice)[-_]?\d+\b/i)?.[0];
    return fromMessage ? fromMessage.toUpperCase() : undefined;
  }

  private resolveCrmInnFromMessage(message: string): string | undefined {
    return extractInnFromMessage(message);
  }

  private resolveCrop(message: string): "rapeseed" | "sunflower" {
    return /(подсолнеч|sunflower)/i.test(message) ? "sunflower" : "rapeseed";
  }

  private extractTechmapFilters(
    message: string,
    workspaceContext?: WorkspaceContextDto,
  ): Record<string, string | number | boolean | null> {
    const filters: Record<string, string | number | boolean | null> = {
      ...(workspaceContext?.filters ?? {}),
    };
    if (/создан/i.test(message)) {
      filters.status = "created";
    }
    if (/архив/i.test(message)) {
      filters.status = "archived";
    }
    if (/активн/i.test(message)) {
      filters.status = "active";
    }
    return filters;
  }

  private extractFinanceScopeFilters(
    workspaceContext: WorkspaceContextDto | undefined,
    planId?: string,
    seasonRef?: string,
  ): Record<string, string | number | boolean | null> {
    return {
      ...(workspaceContext?.filters ?? {}),
      ...(planId ? { planId } : {}),
      ...(seasonRef ? { seasonId: seasonRef } : {}),
    };
  }

  private extractCrmWorkspaceFilters(
    workspaceContext: WorkspaceContextDto | undefined,
    accountId?: string,
    query?: string,
  ): Record<string, string | number | boolean | null> {
    return {
      ...(workspaceContext?.filters ?? {}),
      ...(accountId ? { accountId } : {}),
      ...(query ? { query } : {}),
    };
  }

  private extractCrmInnLookupFilters(
    workspaceContext: WorkspaceContextDto | undefined,
    inn?: string,
  ): Record<string, string | number | boolean | null> {
    return {
      ...(workspaceContext?.filters ?? {}),
      ...(inn ? { inn } : {}),
    };
  }

  private extractContractsFilters(
    workspaceContext: WorkspaceContextDto | undefined,
    contractId?: string,
    query?: string,
  ): Record<string, string | number | boolean | null> {
    return {
      ...(workspaceContext?.filters ?? {}),
      ...(contractId ? { contractId } : {}),
      ...(query ? { query } : {}),
    };
  }

  private extractContractsArBalanceFilters(
    workspaceContext: WorkspaceContextDto | undefined,
    invoiceId?: string,
  ): Record<string, string | number | boolean | null> {
    return {
      ...(workspaceContext?.filters ?? {}),
      ...(invoiceId ? { invoiceId } : {}),
    };
  }

  private extractKnowledgeFilters(
    workspaceContext: WorkspaceContextDto | undefined,
    query: string,
  ): Record<string, string | number | boolean | null> {
    return {
      ...(workspaceContext?.filters ?? {}),
      query,
    };
  }

  private mapDomainFromLegacy(
    legacyClassification: IntentClassification,
  ): RoutingDomain {
    if (legacyClassification.targetRole === "agronomist") {
      return RoutingDomain.Agro;
    }
    if (legacyClassification.targetRole === "economist") {
      return RoutingDomain.Finance;
    }
    if (legacyClassification.targetRole === "crm_agent") {
      return RoutingDomain.Crm;
    }
    if (legacyClassification.targetRole === "contracts_agent") {
      return RoutingDomain.Contracts;
    }
    if (legacyClassification.targetRole === "front_office_agent") {
      return RoutingDomain.FrontOffice;
    }
    if (legacyClassification.targetRole === "monitoring") {
      return RoutingDomain.Monitoring;
    }
    if (legacyClassification.targetRole === "knowledge") {
      return RoutingDomain.Knowledge;
    }
    return RoutingDomain.Unknown;
  }
}
