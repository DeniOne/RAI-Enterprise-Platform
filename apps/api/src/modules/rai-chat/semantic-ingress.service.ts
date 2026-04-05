import { Injectable } from "@nestjs/common";
import { RaiChatRequestDto } from "./dto/rai-chat.dto";
import { IntentClassification } from "../../shared/rai-chat/intent-router.types";
import {
  ConfidenceBand,
  DecisionType,
  InteractionMode,
  MutationRisk,
  RoutingDomain,
  RoutingEntity,
  SemanticRoutingEvaluation,
} from "../../shared/rai-chat/semantic-routing.types";
import {
  SemanticIngressDomainCandidate,
  SemanticIngressEntity,
  SemanticIngressFrame,
  SemanticIngressFrameSource,
  SemanticIngressInteractionMode,
  SemanticIngressOperationAuthority,
  SemanticIngressRequestShape,
  SemanticIngressRiskClass,
  TechMapComparisonMode,
  TechMapContextReadiness,
  TechMapPolicyPosture,
  TechMapRequestedArtifact,
  TechMapScope,
  TechMapSemanticFrame,
  TechMapWorkflowIntent,
  TechMapWorkflowStageHint,
  SemanticIngressWritePolicy,
} from "../../shared/rai-chat/semantic-ingress.types";
import {
  CompositeWorkflowPlan,
  CompositeWorkflowStageContract,
} from "../../shared/rai-chat/composite-orchestration.types";
import { buildSubIntentGraphFromSemanticFrame } from "../../shared/rai-chat/sub-intent-graph.builder";
import { validateSubIntentGraphAntiTunnel } from "../../shared/rai-chat/sub-intent-graph.mixed-intent-invariants";
import { extractInnFromMessage } from "../../shared/rai-chat/execution-adapter-heuristics";
import { getIntentContractByToolName } from "../../shared/rai-chat/agent-interaction-contracts";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";
import type { SemanticIngressExplicitPlannerToolCall } from "../../shared/rai-chat/semantic-ingress.types";

@Injectable()
export class SemanticIngressService {
  buildFrame(params: {
    request: RaiChatRequestDto;
    baselineClassification: IntentClassification;
    finalClassification: IntentClassification;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
  }): SemanticIngressFrame {
    const baselineClassification = params.baselineClassification;
    const source = this.resolveSource(
      params.request,
      params.finalClassification,
      params.semanticEvaluation,
    );
    const entities = this.collectEntities(
      params.request,
      params.finalRequestedToolCalls,
      params.semanticEvaluation,
    );
    const requestedOperation = {
      ownerRole: params.finalClassification.targetRole ?? null,
      intent: params.finalClassification.intent ?? null,
      toolName: params.finalClassification.toolName ?? null,
      payload:
        params.finalRequestedToolCalls?.[0]?.payload &&
        typeof params.finalRequestedToolCalls[0].payload === "object"
          ? {
              ...(params.finalRequestedToolCalls[0].payload as Record<
                string,
                unknown
              >),
            }
          : null,
      decisionType: this.resolveDecisionType(
        params.request,
        params.finalRequestedToolCalls,
        params.semanticEvaluation,
      ),
      source,
    } satisfies SemanticIngressFrame["requestedOperation"];
    const compositePlan = this.resolveCompositePlan({
      request: params.request,
      requestedOperation,
      semanticEvaluation: params.semanticEvaluation,
      finalClassification: params.finalClassification,
    });
    const proofSliceId = this.resolveProofSliceId(
      requestedOperation.intent,
      requestedOperation.toolName,
    );
    const riskClass = this.resolveRiskClass(
      params.semanticEvaluation.semanticIntent.mutationRisk,
    );
    const operationAuthority = this.resolveOperationAuthority({
      request: params.request,
      finalRequestedToolCalls: params.finalRequestedToolCalls,
      semanticEvaluation: params.semanticEvaluation,
      requestedOperation,
      proofSliceId,
      compositePlan,
    });
    const writePolicy = this.resolveWritePolicy({
      operationAuthority,
      riskClass,
      requestedOperation,
      semanticEvaluation: params.semanticEvaluation,
      proofSliceId,
    });
    const techMapFrame = this.resolveTechMapFrame({
      request: params.request,
      finalClassification: params.finalClassification,
      finalRequestedToolCalls: params.finalRequestedToolCalls,
      semanticEvaluation: params.semanticEvaluation,
      writePolicy,
      riskClass,
    });

    const hasCompositeStages = Boolean(compositePlan?.stages?.length);
    const rawToolCalls = params.finalRequestedToolCalls ?? [];
    let explicitPlannerToolCalls: SemanticIngressExplicitPlannerToolCall[] | undefined;
    if (!hasCompositeStages && !techMapFrame && rawToolCalls.length >= 2) {
      explicitPlannerToolCalls = rawToolCalls.map((tc) => {
        const c = getIntentContractByToolName(tc.name);
        return {
          toolName: tc.name,
          ownerRole: c?.role ?? params.finalClassification.targetRole ?? null,
          intent: c?.id ?? params.finalClassification.intent ?? null,
          payload:
            tc.payload && typeof tc.payload === "object"
              ? { ...(tc.payload as Record<string, unknown>) }
              : {},
        };
      });
    }

    const frame: SemanticIngressFrame = {
      version: "v1",
      interactionMode: this.resolveInteractionMode(
        params.request,
        params.semanticEvaluation.semanticIntent.interactionMode,
        params.finalRequestedToolCalls,
      ),
      requestShape: this.resolveRequestShape(
        params.request,
        params.finalRequestedToolCalls,
        compositePlan,
      ),
      domainCandidates: this.resolveDomainCandidates(
        baselineClassification,
        params.finalClassification,
        params.semanticEvaluation,
      ),
      goal:
        compositePlan?.summary ??
        params.finalClassification.intent ??
        params.semanticEvaluation.sliceId ??
        null,
      entities,
      requestedOperation,
      operationAuthority,
      missingSlots: [
        ...params.semanticEvaluation.routeDecision.requiredContextMissing,
      ],
      riskClass,
      requiresConfirmation: this.resolveRequiresConfirmation({
        semanticEvaluation: params.semanticEvaluation,
        proofSliceId,
        riskClass,
        writePolicy,
      }),
      confidenceBand: this.resolveConfidenceBand(
        params.finalClassification,
        params.semanticEvaluation,
      ),
      explanation: this.buildExplanation(
        requestedOperation,
        operationAuthority,
        proofSliceId,
        params.semanticEvaluation,
        compositePlan,
        writePolicy,
      ),
      writePolicy,
      proofSliceId,
      compositePlan,
      ...(techMapFrame ? { techMapFrame } : {}),
      ...(explicitPlannerToolCalls ? { explicitPlannerToolCalls } : {}),
    };
    const subIntentGraph = buildSubIntentGraphFromSemanticFrame(frame);
    const antiTunnel = validateSubIntentGraphAntiTunnel(frame, subIntentGraph);
    if (antiTunnel.ok === false) {
      throw new Error(
        `SubIntentGraph anti-tunnel [${antiTunnel.caseId}]: ${antiTunnel.detail}`,
      );
    }
    return {
      ...frame,
      subIntentGraph,
    };
  }

  private resolveSource(
    request: RaiChatRequestDto,
    finalClassification: IntentClassification,
    semanticEvaluation: SemanticRoutingEvaluation,
  ): SemanticIngressFrameSource {
    if (request.clarificationResume) {
      return "clarification_resume";
    }
    if (finalClassification.method === "explicit_tool_path") {
      return "explicit_tool_call";
    }
    if (semanticEvaluation.promotedPrimary) {
      return "semantic_route_primary";
    }
    if (finalClassification.method === "semantic_route_shadow") {
      return "semantic_route_shadow";
    }
    return "fallback_normalization";
  }

  private resolveDecisionType(
    request: RaiChatRequestDto,
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"],
    semanticEvaluation: SemanticRoutingEvaluation,
  ): DecisionType {
    if (request.clarificationResume) {
      return DecisionType.Execute;
    }
    if (semanticEvaluation.promotedPrimary) {
      return semanticEvaluation.routeDecision.decisionType;
    }
    return (finalRequestedToolCalls?.length ?? 0) > 0
      ? DecisionType.Execute
      : semanticEvaluation.routeDecision.decisionType;
  }

  private resolveInteractionMode(
    request: RaiChatRequestDto,
    semanticInteractionMode: InteractionMode,
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"],
  ): SemanticIngressInteractionMode {
    if (request.clarificationResume) {
      return "workflow_resume";
    }
    if ((finalRequestedToolCalls?.length ?? 0) > 0) {
      return "task_request";
    }
    if (
      semanticInteractionMode === InteractionMode.ReadOnly ||
      semanticInteractionMode === InteractionMode.Navigation ||
      semanticInteractionMode === InteractionMode.Analysis
    ) {
      return "information_request";
    }
    if (semanticInteractionMode === InteractionMode.WriteCandidate) {
      return "task_request";
    }
    return "free_chat";
  }

  private resolveRequestShape(
    request: RaiChatRequestDto,
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"],
    compositePlan: CompositeWorkflowPlan | null,
  ): SemanticIngressRequestShape {
    if (request.clarificationResume) {
      return "clarification_resume";
    }
    if (compositePlan) {
      return "composite";
    }
    if ((finalRequestedToolCalls?.length ?? 0) > 1) {
      return "composite";
    }
    if ((finalRequestedToolCalls?.length ?? 0) === 1 || request.message.trim()) {
      return "single_intent";
    }
    return "unknown";
  }

  private resolveDomainCandidates(
    baselineClassification: IntentClassification,
    finalClassification: IntentClassification,
    semanticEvaluation: SemanticRoutingEvaluation,
  ): SemanticIngressDomainCandidate[] {
    const candidates: SemanticIngressDomainCandidate[] = [];
    const finalRole = finalClassification.targetRole ?? null;
    const finalDomain = this.mapRoleToDomain(finalRole);
    if (finalRole || finalClassification.intent) {
      candidates.push({
        domain: finalDomain,
        ownerRole: finalRole,
        score: this.normalizeScore(finalClassification.confidence),
        source: "legacy",
        reason: finalClassification.reason,
      });
    }

    const semanticDomain =
      semanticEvaluation.semanticIntent.domain ?? RoutingDomain.Unknown;
    const semanticOwnerRole =
      semanticEvaluation.classification?.targetRole ??
      finalClassification.targetRole ??
      this.mapDomainToRole(semanticDomain);
    if (
      semanticDomain !== RoutingDomain.Unknown ||
      semanticOwnerRole ||
      semanticEvaluation.sliceId
    ) {
      candidates.push({
        domain: semanticDomain,
        ownerRole: semanticOwnerRole ?? null,
        score: this.scoreFromConfidenceBand(
          semanticEvaluation.semanticIntent.confidenceBand,
        ),
        source: "semantic",
        reason: semanticEvaluation.semanticIntent.reason,
      });
    }

    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      const key = `${candidate.source}:${candidate.domain}:${candidate.ownerRole ?? "none"}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private collectEntities(
    request: RaiChatRequestDto,
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"],
    semanticEvaluation: SemanticRoutingEvaluation,
  ): SemanticIngressEntity[] {
    const entities: SemanticIngressEntity[] = [];
    const primaryPayload = finalRequestedToolCalls?.[0]?.payload ?? {};
    const innFromPayload =
      typeof primaryPayload.inn === "string" ? primaryPayload.inn : null;
    const innFromMessage = extractInnFromMessage(request.message) ?? null;

    entities.push({
      kind: "semantic_entity",
      value: semanticEvaluation.semanticIntent.entity,
      source: "semantic",
    });

    if (request.workspaceContext?.route) {
      entities.push({
        kind: "workspace_route",
        value: request.workspaceContext.route,
        source: "workspace",
      });
    }

    if (request.workspaceContext?.selectedRowSummary) {
      entities.push({
        kind: "workspace_selection",
        value: request.workspaceContext.selectedRowSummary.title,
        source: "workspace",
      });
    }

    for (const entityRef of request.workspaceContext?.activeEntityRefs ?? []) {
      entities.push({
        kind: "active_entity",
        value: `${entityRef.kind}:${entityRef.id}`,
        source: "workspace",
      });
    }

    if (innFromPayload) {
      entities.push({
        kind: "inn",
        value: innFromPayload,
        source: "tool_payload",
      });
    } else if (innFromMessage) {
      entities.push({
        kind: "inn",
        value: innFromMessage,
        source: "message",
      });
    }

    const seen = new Set<string>();
    return entities.filter((entity) => {
      const key = `${entity.kind}:${entity.value}:${entity.source}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private resolveRiskClass(
    mutationRisk: MutationRisk,
  ): SemanticIngressRiskClass {
    if (mutationRisk === MutationRisk.SafeRead) {
      return "safe_read";
    }
    if (mutationRisk === MutationRisk.IrreversibleWrite) {
      return "high_risk_write";
    }
    if (mutationRisk === MutationRisk.SideEffectingWrite) {
      return "write_candidate";
    }
    return "unknown";
  }

  private resolveConfidenceBand(
    finalClassification: IntentClassification,
    semanticEvaluation: SemanticRoutingEvaluation,
  ): ConfidenceBand {
    if (semanticEvaluation.promotedPrimary) {
      return semanticEvaluation.semanticIntent.confidenceBand;
    }
    return this.bandFromScore(finalClassification.confidence);
  }

  private buildExplanation(
    requestedOperation: SemanticIngressFrame["requestedOperation"],
    operationAuthority: SemanticIngressOperationAuthority,
    proofSliceId: string | null,
    semanticEvaluation: SemanticRoutingEvaluation,
    compositePlan: CompositeWorkflowPlan | null,
    writePolicy: SemanticIngressWritePolicy,
  ): string {
    if (compositePlan) {
      if (compositePlan.workflowId.startsWith("crm.")) {
        return `Составной CRM-сценарий нормализован в workflow: ${compositePlan.summary}.`;
      }
      return `Составной аналитический сценарий нормализован в workflow: ${compositePlan.summary}.`;
    }
    if (proofSliceId === "crm.register_counterparty") {
      if (writePolicy.decision === "execute") {
        return "Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН как прямое действие пользователя.";
      }
      if (writePolicy.decision === "confirm") {
        return "CRM-регистрация контрагента распознана как write-path без прямой пользовательской команды и требует governed confirmation.";
      }
      if (writePolicy.decision === "clarify") {
        return "CRM-регистрация контрагента требует уточнения входных данных перед выполнением.";
      }
      if (writePolicy.decision === "block") {
        return "CRM-регистрация контрагента заблокирована policy-слоем.";
      }
      return "Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН.";
    }
    if (
      requestedOperation.ownerRole &&
      requestedOperation.intent &&
      requestedOperation.source === "semantic_route_primary"
    ) {
      return `Semantic router выбрал ${requestedOperation.ownerRole}.${requestedOperation.intent}.`;
    }
    if (requestedOperation.ownerRole && requestedOperation.intent) {
      return `Запрос нормализован в ${requestedOperation.ownerRole}.${requestedOperation.intent}.`;
    }
    return semanticEvaluation.semanticIntent.reason;
  }

  private resolveTechMapFrame(params: {
    request: RaiChatRequestDto;
    finalClassification: IntentClassification;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
    writePolicy: SemanticIngressWritePolicy;
    riskClass: SemanticIngressRiskClass;
  }): TechMapSemanticFrame | null {
    const semanticIntent = params.semanticEvaluation.semanticIntent;
    if (
      semanticIntent.domain !== RoutingDomain.Agro ||
      semanticIntent.entity !== RoutingEntity.Techmap
    ) {
      return null;
    }

    const normalizedMessage = params.request.message.toLowerCase();
    const scope = this.resolveTechMapScope({
      request: params.request,
      finalRequestedToolCalls: params.finalRequestedToolCalls,
      semanticEvaluation: params.semanticEvaluation,
    });
    const userIntent = this.resolveTechMapWorkflowIntent({
      request: params.request,
      finalClassification: params.finalClassification,
      semanticEvaluation: params.semanticEvaluation,
      scope,
    });
    const workflowStageHint = this.resolveTechMapWorkflowStageHint(
      userIntent,
      params.semanticEvaluation,
      params.writePolicy,
    );
    const requestedArtifact = this.resolveTechMapRequestedArtifact(userIntent);
    const contextReadiness = this.resolveTechMapContextReadiness({
      userIntent,
      scope,
      semanticEvaluation: params.semanticEvaluation,
      writePolicy: params.writePolicy,
    });
    const requiredActions = this.resolveTechMapRequiredActions({
      userIntent,
      contextReadiness,
      semanticEvaluation: params.semanticEvaluation,
      writePolicy: params.writePolicy,
      riskClass: params.riskClass,
    });
    const policyPosture = this.resolveTechMapPolicyPosture({
      userIntent,
      semanticEvaluation: params.semanticEvaluation,
      writePolicy: params.writePolicy,
      riskClass: params.riskClass,
    });
    const policyConstraints = this.resolveTechMapPolicyConstraints({
      userIntent,
      workflowStageHint,
      contextReadiness,
      writePolicy: params.writePolicy,
      semanticEvaluation: params.semanticEvaluation,
    });
    const resultConstraints = this.resolveTechMapResultConstraints({
      userIntent,
      requestedArtifact,
      semanticEvaluation: params.semanticEvaluation,
    });
    const comparisonMode = this.resolveTechMapComparisonMode({
      userIntent,
      message: normalizedMessage,
      finalRequestedToolCalls: params.finalRequestedToolCalls,
    });

    return {
      workflowKind: "tech_map",
      userIntent,
      workflowStageHint,
      requestedArtifact,
      scope,
      contextReadiness,
      requiredActions,
      policyPosture,
      policyConstraints,
      resultConstraints,
      ...(comparisonMode ? { comparisonMode } : {}),
    };
  }

  private resolveTechMapScope(params: {
    request: RaiChatRequestDto;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
  }): TechMapScope {
    const scope: TechMapScope = {
      fieldIds: [],
    };
    const workspace = params.request.workspaceContext;
    const toolPayload = params.finalRequestedToolCalls?.[0]?.payload as
      | Record<string, unknown>
      | undefined;

    this.collectTechMapScopeValues(
      scope.fieldIds,
      workspace?.activeEntityRefs?.filter((ref) => ref.kind === "field").map((ref) => ref.id) ?? [],
    );
    this.collectTechMapScopeValues(
      scope.fieldIds,
      this.extractStringList(workspace?.filters?.fieldId),
    );
    this.collectTechMapScopeValues(
      scope.fieldIds,
      this.extractStringList(workspace?.filters?.fieldIds),
    );
    this.collectTechMapScopeValues(
      scope.fieldIds,
      this.extractStringList(toolPayload?.fieldRef),
    );
    this.collectTechMapScopeValues(
      scope.fieldIds,
      this.extractStringList(toolPayload?.scope && typeof toolPayload.scope === "object"
        ? (toolPayload.scope as Record<string, unknown>).fieldId
        : undefined),
    );

    scope.seasonId =
      this.firstString(
        workspace?.filters?.seasonId,
        toolPayload?.seasonRef,
        toolPayload?.scope && typeof toolPayload.scope === "object"
          ? (toolPayload.scope as Record<string, unknown>).seasonId
          : undefined,
      ) ?? undefined;
    scope.cropCode =
      this.firstString(
        toolPayload?.crop,
        workspace?.filters?.cropCode,
        workspace?.filters?.crop,
      ) ?? undefined;
    scope.existingTechMapId =
      this.firstString(
        this.resolveExistingTechMapId(workspace),
        toolPayload?.existingTechMapId,
        toolPayload?.techMapId,
      ) ?? undefined;
    scope.farmId =
      this.firstString(
        workspace?.filters?.farmId,
        toolPayload?.farmId,
        this.resolveFarmIdFromWorkspace(workspace),
      ) ?? undefined;
    scope.legalEntityId =
      this.firstString(
        workspace?.filters?.legalEntityId,
        toolPayload?.legalEntityId,
      ) ?? undefined;

    const normalizedFieldIds = [...new Set(scope.fieldIds.filter(Boolean))];
    scope.fieldIds = normalizedFieldIds;

    if (
      scope.fieldIds.length === 0 &&
      params.semanticEvaluation.semanticIntent.focusObject?.kind === "field" &&
      params.semanticEvaluation.semanticIntent.focusObject.id
    ) {
      scope.fieldIds = [params.semanticEvaluation.semanticIntent.focusObject.id];
    }

    return scope;
  }

  private resolveTechMapWorkflowIntent(params: {
    request: RaiChatRequestDto;
    finalClassification: IntentClassification;
    semanticEvaluation: SemanticRoutingEvaluation;
    scope: TechMapScope;
  }): TechMapWorkflowIntent {
    const normalized = params.request.message.toLowerCase();
    if (params.request.clarificationResume) {
      return "resume_clarify";
    }
    if (this.hasTechMapCompareSignal(normalized)) {
      return "compare_variants";
    }
    if (this.hasTechMapApprovalSignal(normalized)) {
      return "approve_publish";
    }
    if (this.hasTechMapExplainBlockSignal(normalized)) {
      return "explain_block";
    }
    if (params.semanticEvaluation.routeDecision.decisionType === DecisionType.Navigate) {
      return "review_draft";
    }
    if (params.semanticEvaluation.routeDecision.decisionType === DecisionType.Block) {
      return "explain_block";
    }
    if (params.semanticEvaluation.routeDecision.needsClarification) {
      return "create_new";
    }
    if (this.hasTechMapRebuildSignal(normalized) || Boolean(params.scope.existingTechMapId)) {
      return "rebuild_existing";
    }
    if (
      params.finalClassification.intent === "tech_map_draft" ||
      params.semanticEvaluation.candidateRoutes.some((route) =>
        route.intent === "tech_map_draft",
      )
    ) {
      return "create_new";
    }
    return "review_draft";
  }

  private resolveTechMapWorkflowStageHint(
    userIntent: TechMapWorkflowIntent,
    semanticEvaluation: SemanticRoutingEvaluation,
    writePolicy: SemanticIngressWritePolicy,
  ): TechMapWorkflowStageHint {
    if (userIntent === "resume_clarify") {
      return "clarify";
    }
    if (userIntent === "compare_variants") {
      return "compare";
    }
    if (userIntent === "approve_publish") {
      return writePolicy.decision === "block" || writePolicy.decision === "clarify"
        ? "approval"
        : "publication";
    }
    if (userIntent === "review_draft" || userIntent === "explain_block") {
      return "review";
    }
    if (
      writePolicy.decision === "clarify" ||
      semanticEvaluation.routeDecision.needsClarification
    ) {
      return "clarify";
    }
    return "assemble";
  }

  private resolveTechMapRequestedArtifact(
    userIntent: TechMapWorkflowIntent,
  ): TechMapRequestedArtifact {
    switch (userIntent) {
      case "compare_variants":
        return "comparison_report";
      case "review_draft":
        return "review_packet";
      case "approve_publish":
        return "publication_packet";
      case "explain_block":
        return "block_explanation";
      default:
        return "workflow_draft";
    }
  }

  private resolveTechMapContextReadiness(params: {
    userIntent: TechMapWorkflowIntent;
    scope: TechMapScope;
    semanticEvaluation: SemanticRoutingEvaluation;
    writePolicy: SemanticIngressWritePolicy;
  }): TechMapContextReadiness {
    const hasScope = params.scope.fieldIds.length > 0 || Boolean(params.scope.seasonId);
    const hasComputeBasis = Boolean(params.scope.fieldIds.length > 0 && params.scope.seasonId);
    const hasBlockedWrite = params.writePolicy.decision === "block";
    const missingContext = params.semanticEvaluation.routeDecision.requiredContextMissing.length > 0;

    if (!hasScope) {
      return "S0_UNSCOPED";
    }
    if (missingContext || params.writePolicy.decision === "clarify") {
      return "S1_SCOPED";
    }
    if (params.userIntent === "review_draft" || params.userIntent === "compare_variants") {
      return "S4_REVIEW_READY";
    }
    if (params.userIntent === "approve_publish") {
      return hasBlockedWrite ? "S4_REVIEW_READY" : "S5_PUBLISHABLE";
    }
    if (hasComputeBasis) {
      return "S3_DRAFT_READY";
    }
    return "S2_MINIMUM_COMPUTABLE";
  }

  private resolveTechMapRequiredActions(params: {
    userIntent: TechMapWorkflowIntent;
    contextReadiness: TechMapContextReadiness;
    semanticEvaluation: SemanticRoutingEvaluation;
    writePolicy: SemanticIngressWritePolicy;
    riskClass: SemanticIngressRiskClass;
  }): Array<"clarify" | "execute" | "confirm" | "human_review" | "block"> {
    const actions = new Set<
      "clarify" | "execute" | "confirm" | "human_review" | "block"
    >();

    if (
      params.contextReadiness === "S0_UNSCOPED" ||
      params.contextReadiness === "S1_SCOPED" ||
      params.writePolicy.decision === "clarify" ||
      params.semanticEvaluation.routeDecision.needsClarification
    ) {
      actions.add("clarify");
    }

    if (
      params.userIntent === "review_draft" ||
      params.userIntent === "compare_variants" ||
      params.userIntent === "create_new" ||
      params.userIntent === "rebuild_existing"
    ) {
      actions.add("execute");
    }

    if (
      params.userIntent === "approve_publish" ||
      params.writePolicy.decision === "confirm"
    ) {
      actions.add("confirm");
      actions.add("human_review");
    }

    if (
      params.userIntent === "review_draft" ||
      params.userIntent === "explain_block" ||
      params.riskClass === "high_risk_write" ||
      params.writePolicy.decision === "block"
    ) {
      actions.add("human_review");
    }

    if (params.writePolicy.decision === "block") {
      actions.add("block");
    }

    return [...actions];
  }

  private resolveTechMapPolicyPosture(params: {
    userIntent: TechMapWorkflowIntent;
    semanticEvaluation: SemanticRoutingEvaluation;
    writePolicy: SemanticIngressWritePolicy;
    riskClass: SemanticIngressRiskClass;
  }): TechMapPolicyPosture {
    if (
      params.writePolicy.decision === "block" ||
      params.riskClass === "high_risk_write" &&
        params.semanticEvaluation.routeDecision.decisionType === DecisionType.Block
    ) {
      return "blocked";
    }
    if (params.userIntent === "approve_publish") {
      return "governed";
    }
    if (
      params.writePolicy.decision === "confirm" ||
      params.writePolicy.decision === "clarify"
    ) {
      return "governed";
    }
    return "open";
  }

  private resolveTechMapPolicyConstraints(params: {
    userIntent: TechMapWorkflowIntent;
    workflowStageHint: TechMapWorkflowStageHint;
    contextReadiness: TechMapContextReadiness;
    writePolicy: SemanticIngressWritePolicy;
    semanticEvaluation: SemanticRoutingEvaluation;
  }): string[] {
    const constraints = [
      "tech_map.workflow_governed",
      `tech_map.intent:${params.userIntent}`,
      `tech_map.stage:${params.workflowStageHint}`,
      `tech_map.readiness:${params.contextReadiness}`,
      `tech_map.write_policy:${params.writePolicy.decision}`,
    ];
    if (params.semanticEvaluation.routeDecision.requiredContextMissing.length > 0) {
      constraints.push(
        `tech_map.missing_context:${params.semanticEvaluation.routeDecision.requiredContextMissing.join(",")}`,
      );
    }
    return constraints;
  }

  private resolveTechMapResultConstraints(params: {
    userIntent: TechMapWorkflowIntent;
    requestedArtifact: TechMapRequestedArtifact;
    semanticEvaluation: SemanticRoutingEvaluation;
  }): string[] {
    const constraints = [
      `tech_map.result:${params.requestedArtifact}`,
      "tech_map.honest_disclosure_required",
    ];
    if (params.userIntent === "compare_variants") {
      constraints.push("tech_map.baseline_context_consistent");
    }
    if (
      params.semanticEvaluation.routeDecision.requiredContextMissing.length > 0
    ) {
      constraints.push("tech_map.no_assumptions_without_evidence");
    }
    return constraints;
  }

  private resolveTechMapComparisonMode(params: {
    userIntent: TechMapWorkflowIntent;
    message: string;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
  }): TechMapComparisonMode | null {
    if (params.userIntent !== "compare_variants") {
      return null;
    }
    const variantCount = this.extractComparisonVariantCount(params.message);
    return {
      enabled: true,
      variantCount:
        variantCount ??
        (params.finalRequestedToolCalls?.length && params.finalRequestedToolCalls.length > 1
          ? params.finalRequestedToolCalls.length
          : 2),
    };
  }

  private hasTechMapCompareSignal(message: string): boolean {
    return /(сравн|compare|diff|вариант|variant)/i.test(message);
  }

  private hasTechMapRebuildSignal(message: string): boolean {
    return /(пересобер|rebuild|перестрой|обнови техкарт|пересчитай)/i.test(message);
  }

  private hasTechMapApprovalSignal(message: string): boolean {
    return /(согласован|отправь.*соглас|approve|publish|опубликуй|на согласование|на публикац)/i.test(
      message,
    );
  }

  private hasTechMapExplainBlockSignal(message: string): boolean {
    return /(почему.*не.*выпуст|blocked|блок|не выпуст|объясн.*блок)/i.test(message);
  }

  private extractComparisonVariantCount(message: string): number | null {
    if (/(две|\b2\b|пара|pair|two)/i.test(message)) {
      return 2;
    }
    if (/(три|\b3\b|three)/i.test(message)) {
      return 3;
    }
    if (/(четыре|\b4\b|four)/i.test(message)) {
      return 4;
    }
    return null;
  }

  private collectTechMapScopeValues(target: string[], values: string[]): void {
    for (const value of values) {
      if (value.trim()) {
        target.push(value.trim());
      }
    }
  }

  private extractStringList(value: unknown): string[] {
    if (typeof value === "string") {
      return value.trim() ? [value.trim()] : [];
    }
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private firstString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private resolveExistingTechMapId(
    workspaceContext?: RaiChatRequestDto["workspaceContext"],
  ): string | null {
    if (workspaceContext?.selectedRowSummary?.kind?.toLowerCase() === "techmap") {
      return workspaceContext.selectedRowSummary.id;
    }
    const selected = workspaceContext?.activeEntityRefs?.find(
      (ref) => ref.kind === "techmap",
    );
    return selected?.id ?? null;
  }

  private resolveFarmIdFromWorkspace(
    workspaceContext?: RaiChatRequestDto["workspaceContext"],
  ): string | null {
    const activeFarm = workspaceContext?.activeEntityRefs?.find(
      (ref) => ref.kind === "farm",
    );
    if (activeFarm) {
      return activeFarm.id;
    }
    const selected = workspaceContext?.selectedRowSummary;
    return selected?.kind?.toLowerCase() === "farm" ? selected.id : null;
  }

  private resolveProofSliceId(
    intent: string | null,
    toolName: RaiToolName | null,
  ): string | null {
    if (
      intent === "register_counterparty" ||
      toolName === RaiToolName.RegisterCounterparty
    ) {
      return "crm.register_counterparty";
    }
    return null;
  }

  private resolveOperationAuthority(params: {
    request: RaiChatRequestDto;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
    requestedOperation: SemanticIngressFrame["requestedOperation"];
    proofSliceId: string | null;
    compositePlan: CompositeWorkflowPlan | null;
  }): SemanticIngressOperationAuthority {
    if (params.request.clarificationResume) {
      return "workflow_resume";
    }

    if (this.isDirectRegisterUserCommand(params)) {
      return "direct_user_command";
    }

    if (
      params.compositePlan &&
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty
    ) {
      return "delegated_or_autonomous";
    }

    if (
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty
    ) {
      return "delegated_or_autonomous";
    }

    return "unknown";
  }

  private resolveCompositePlan(params: {
    request: RaiChatRequestDto;
    requestedOperation: SemanticIngressFrame["requestedOperation"];
    semanticEvaluation: SemanticRoutingEvaluation;
    finalClassification: IntentClassification;
  }): CompositeWorkflowPlan | null {
    const normalized = params.request.message.toLowerCase();
    const isCrmSemanticSlice = params.semanticEvaluation.semanticIntent.domain === "crm";
    const isRegisterFlow =
      params.finalClassification.intent === "register_counterparty" ||
      params.requestedOperation.intent === "register_counterparty" ||
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty ||
      /контрагент|контрагента|зарег|зареп|завед/i.test(normalized);
    const hasFollowUpSignal =
      /(?:^|\s)(и|затем|потом|после)(?:\s|$)/iu.test(normalized) &&
      /(аккаунт|карточк|workspace|карточку|карточке|карточкой)/iu.test(
        normalized,
      );

    if (isCrmSemanticSlice && isRegisterFlow && hasFollowUpSignal) {
      const workflowId = "crm.register_counterparty.create_account.open_workspace";
      const stages: CompositeWorkflowStageContract[] = [
        {
          stageId: "register_counterparty",
          order: 1,
          agentRole: "crm_agent",
          intent: "register_counterparty",
          toolName: RaiToolName.RegisterCounterparty,
          payload:
            params.requestedOperation.payload &&
            typeof params.requestedOperation.payload === "object"
              ? {
                  ...(params.requestedOperation.payload as Record<
                    string,
                    unknown
                  >),
                }
              : {},
          label: "Регистрация контрагента",
          dependsOn: [],
          status: "planned",
        },
        {
          stageId: "create_crm_account",
          order: 2,
          agentRole: "crm_agent",
          intent: "create_crm_account",
          toolName: RaiToolName.CreateCrmAccount,
          payloadBindings: [
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.legalName",
              targetPath: "name",
              writeMode: "set_if_absent",
              required: false,
            },
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.shortName",
              targetPath: "name",
              writeMode: "set_if_absent",
              required: false,
            },
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.partyId",
              targetPath: "name",
              writeMode: "set_if_absent",
              required: false,
            },
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.inn",
              targetPath: "inn",
              required: false,
            },
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.partyId",
              targetPath: "partyId",
              required: true,
            },
          ],
          label: "Создание CRM-аккаунта",
          dependsOn: ["register_counterparty"],
          status: "planned",
        },
        {
          stageId: "review_account_workspace",
          order: 3,
          agentRole: "crm_agent",
          intent: "review_account_workspace",
          toolName: RaiToolName.GetCrmAccountWorkspace,
          payloadBindings: [
            {
              sourceStageId: "create_crm_account",
              sourcePath: "data.accountId",
              targetPath: "accountId",
              required: true,
            },
            {
              sourceStageId: "create_crm_account",
              sourcePath: "data.name",
              targetPath: "query",
              writeMode: "set_if_absent",
              required: false,
            },
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.legalName",
              targetPath: "query",
              writeMode: "set_if_absent",
              required: false,
            },
            {
              sourceStageId: "register_counterparty",
              sourcePath: "data.shortName",
              targetPath: "query",
              writeMode: "set_if_absent",
              required: false,
            },
          ],
          label: "Открытие карточки/рабочего пространства",
          dependsOn: ["create_crm_account"],
          status: "planned",
        },
      ];

      return {
        planId: `${workflowId}:${params.request.threadId ?? params.request.clientTraceId ?? "new"}`,
        workflowId,
        leadOwnerAgent: "crm_agent",
        executionStrategy: "sequential",
        summary: "регистрация контрагента, создание CRM-аккаунта и открытие карточки",
        stages,
      };
    }

    const analyticalPlan = this.resolveAnalyticalCompositePlan({
      request: params.request,
      requestedOperation: params.requestedOperation,
      semanticEvaluation: params.semanticEvaluation,
      finalClassification: params.finalClassification,
    }, normalized);
    if (analyticalPlan) {
      return analyticalPlan;
    }

    return null;
  }

  private resolveAnalyticalCompositePlan(
    params: {
      request: RaiChatRequestDto;
      requestedOperation: SemanticIngressFrame["requestedOperation"];
      semanticEvaluation: SemanticRoutingEvaluation;
      finalClassification: IntentClassification;
    },
    normalized: string,
  ): CompositeWorkflowPlan | null {
    const hasAgroSignal =
      /(agro|агро|execution fact|факт исполнения|факт выполнения|отклонен|отклон)/iu.test(
        normalized,
      ) || params.semanticEvaluation.semanticIntent.domain === "agro";
    const hasFinanceSignal =
      /(finance|финанс|cost|costs|затрат|стоимост|стоило|aggregat|агрегац)/iu.test(
        normalized,
      ) || params.semanticEvaluation.semanticIntent.domain === "finance";
    const hasCompositeSignal =
      /(?:->|→|⇒|и|затем|потом|после)/iu.test(normalized) ||
      normalized.includes("aggregation") ||
      normalized.includes("агрегац");

    if (!hasAgroSignal || !hasFinanceSignal || !hasCompositeSignal) {
      return null;
    }

    const workflowId = "agro.execution_fact.finance.cost_aggregation";
    const stages: CompositeWorkflowStageContract[] = [
      {
        stageId: "agro_execution_fact",
        order: 1,
        agentRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        payload: {
          scope: {
            seasonId: this.readWorkspaceFilterAsString(
              params.request.workspaceContext?.filters?.seasonId,
            ),
            fieldId:
              this.readWorkspaceFilterAsString(
                params.request.workspaceContext?.filters?.fieldId,
              ) ??
              params.request.workspaceContext?.activeEntityRefs?.find(
                (item) => item.kind === "field",
              )?.id,
          },
        },
        label: "Факт исполнения по агро-контексту",
        dependsOn: [],
        status: "planned",
      },
      {
        stageId: "finance_cost_aggregation",
        order: 2,
        agentRole: "economist",
        intent: "compute_plan_fact",
        toolName: RaiToolName.ComputePlanFact,
        payload: {
          scope: {
            planId: this.readWorkspaceFilterAsString(
              params.request.workspaceContext?.filters?.planId,
            ),
            seasonId: this.readWorkspaceFilterAsString(
              params.request.workspaceContext?.filters?.seasonId,
            ),
          },
        },
        label: "Агрегация финансовых затрат",
        dependsOn: ["agro_execution_fact"],
        status: "planned",
      },
    ];

    return {
      planId: `${workflowId}:${params.request.threadId ?? params.request.clientTraceId ?? "new"}`,
      workflowId,
      leadOwnerAgent: "agronomist",
      executionStrategy: "sequential",
      summary: "агро-факт исполнения и агрегация финансовых затрат",
      stages,
    };
  }

  private readWorkspaceFilterAsString(
    value: string | number | boolean | null | undefined,
  ): string | undefined {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
    return undefined;
  }

  private isDirectRegisterUserCommand(params: {
    request: RaiChatRequestDto;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
    requestedOperation: SemanticIngressFrame["requestedOperation"];
    proofSliceId: string | null;
  }): boolean {
    const hasConversationalWriteSignal = /(?:зарегистр|заре[гп]|завед|оформ|контрагент|инн)/iu.test(
      params.request.message,
    );
    return (
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.ownerRole === "crm_agent" &&
      params.requestedOperation.intent === "register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty &&
      params.requestedOperation.source !== "explicit_tool_call" &&
      ((params.finalRequestedToolCalls?.some(
        (toolCall) => toolCall.name === RaiToolName.RegisterCounterparty,
      ) ?? false) ||
        hasConversationalWriteSignal) &&
      params.request.message.trim().length > 0
    );
  }

  private resolveRequiresConfirmation(params: {
    semanticEvaluation: SemanticRoutingEvaluation;
    proofSliceId: string | null;
    riskClass: SemanticIngressRiskClass;
    writePolicy: SemanticIngressWritePolicy;
  }): boolean {
    if (
      params.proofSliceId === "crm.register_counterparty" &&
      params.writePolicy.decision === "execute"
    ) {
      return false;
    }
    return (
      params.writePolicy.decision !== "execute" ||
      params.semanticEvaluation.routeDecision.needsConfirmation ||
      params.riskClass === "high_risk_write"
    );
  }

  private resolveWritePolicy(params: {
    operationAuthority: SemanticIngressOperationAuthority;
    riskClass: SemanticIngressRiskClass;
    requestedOperation: SemanticIngressFrame["requestedOperation"];
    semanticEvaluation: SemanticRoutingEvaluation;
    proofSliceId: string | null;
  }): SemanticIngressWritePolicy {
    if (params.semanticEvaluation.routeDecision.decisionType === "block") {
      return {
        decision: "block",
        reason: params.semanticEvaluation.routeDecision.policyBlockReason ?? "policy_block",
      };
    }

    if (
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty &&
      params.operationAuthority === "direct_user_command"
    ) {
      return {
        decision: "execute",
        reason: "direct_user_command",
      };
    }

    if (
      params.semanticEvaluation.routeDecision.needsClarification ||
      params.semanticEvaluation.semanticIntent.resolvability === "missing"
    ) {
      return {
        decision: "clarify",
        reason: "needs_clarification",
      };
    }

    if (
      params.riskClass === "high_risk_write" ||
      params.semanticEvaluation.routeDecision.needsConfirmation
    ) {
      return {
        decision: "confirm",
        reason: "high_risk_or_confirmation_required",
      };
    }

    if (params.operationAuthority === "workflow_resume") {
      return {
        decision: "execute",
        reason: "workflow_resume",
      };
    }

    if (
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty
    ) {
      return {
        decision:
          params.operationAuthority === "direct_user_command"
            ? "execute"
            : "confirm",
        reason:
          params.operationAuthority === "direct_user_command"
            ? "direct_user_command"
            : "governed_write_path",
      };
    }

    return {
      decision: "execute",
      reason: "semantic_default_execute",
    };
  }

  private normalizeScore(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(1, value));
  }

  private scoreFromConfidenceBand(value: ConfidenceBand): number {
    switch (value) {
      case ConfidenceBand.High:
        return 0.9;
      case ConfidenceBand.Medium:
        return 0.65;
      default:
        return 0.35;
    }
  }

  private bandFromScore(value: number): ConfidenceBand {
    if (value >= 0.8) {
      return ConfidenceBand.High;
    }
    if (value >= 0.45) {
      return ConfidenceBand.Medium;
    }
    return ConfidenceBand.Low;
  }

  private mapRoleToDomain(role: string | null): RoutingDomain | "unknown" {
    switch (role) {
      case "agronomist":
      case "chief_agronomist":
      case "data_scientist":
        return RoutingDomain.Agro;
      case "economist":
        return RoutingDomain.Finance;
      case "knowledge":
        return RoutingDomain.Knowledge;
      case "crm_agent":
        return RoutingDomain.Crm;
      case "contracts_agent":
        return RoutingDomain.Contracts;
      case "front_office_agent":
        return RoutingDomain.FrontOffice;
      case "monitoring":
        return RoutingDomain.Monitoring;
      default:
        return "unknown";
    }
  }

  private mapDomainToRole(domain: RoutingDomain): string | null {
    switch (domain) {
      case RoutingDomain.Agro:
        return "agronomist";
      case RoutingDomain.Finance:
        return "economist";
      case RoutingDomain.Knowledge:
        return "knowledge";
      case RoutingDomain.Crm:
        return "crm_agent";
      case RoutingDomain.Contracts:
        return "contracts_agent";
      case RoutingDomain.FrontOffice:
        return "front_office_agent";
      case RoutingDomain.Monitoring:
        return "monitoring";
      default:
        return null;
    }
  }
}
