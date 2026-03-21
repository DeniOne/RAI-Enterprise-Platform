import { Injectable } from "@nestjs/common";
import { RaiChatRequestDto } from "./dto/rai-chat.dto";
import { IntentClassification } from "../../shared/rai-chat/intent-router.types";
import {
  ConfidenceBand,
  DecisionType,
  InteractionMode,
  MutationRisk,
  RoutingDomain,
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
} from "../../shared/rai-chat/semantic-ingress.types";
import { extractInnFromMessage } from "../../shared/rai-chat/execution-adapter-heuristics";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";

@Injectable()
export class SemanticIngressService {
  buildFrame(params: {
    request: RaiChatRequestDto;
    legacyClassification: IntentClassification;
    finalClassification: IntentClassification;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
  }): SemanticIngressFrame {
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
      decisionType: this.resolveDecisionType(
        params.request,
        params.finalRequestedToolCalls,
        params.semanticEvaluation,
      ),
      source,
    } satisfies SemanticIngressFrame["requestedOperation"];
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
    });

    return {
      version: "v1",
      interactionMode: this.resolveInteractionMode(
        params.request,
        params.semanticEvaluation.semanticIntent.interactionMode,
        params.finalRequestedToolCalls,
      ),
      requestShape: this.resolveRequestShape(
        params.request,
        params.finalRequestedToolCalls,
      ),
      domainCandidates: this.resolveDomainCandidates(
        params.legacyClassification,
        params.finalClassification,
        params.semanticEvaluation,
      ),
      goal:
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
        operationAuthority,
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
      ),
      proofSliceId,
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
    if (finalClassification.method === "tool_call_primary") {
      return "explicit_tool_call";
    }
    if (semanticEvaluation.promotedPrimary) {
      return "semantic_router_primary";
    }
    if (finalClassification.method === "semantic_router_shadow") {
      return "semantic_router_shadow";
    }
    return "legacy_contracts";
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
  ): SemanticIngressRequestShape {
    if (request.clarificationResume) {
      return "clarification_resume";
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
    legacyClassification: IntentClassification,
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
      semanticEvaluation.classification.targetRole ??
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
  ): string {
    if (proofSliceId === "crm.register_counterparty") {
      if (operationAuthority === "direct_user_command") {
        return "Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН как прямое действие пользователя.";
      }
      if (operationAuthority === "delegated_or_autonomous") {
        return "CRM-регистрация контрагента распознана как write-path без прямой пользовательской команды и требует governed confirmation.";
      }
      return "Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН.";
    }
    if (
      requestedOperation.ownerRole &&
      requestedOperation.intent &&
      requestedOperation.source === "semantic_router_primary"
    ) {
      return `Semantic router выбрал ${requestedOperation.ownerRole}.${requestedOperation.intent}.`;
    }
    if (requestedOperation.ownerRole && requestedOperation.intent) {
      return `Запрос нормализован в ${requestedOperation.ownerRole}.${requestedOperation.intent}.`;
    }
    return semanticEvaluation.semanticIntent.reason;
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
  }): SemanticIngressOperationAuthority {
    if (params.request.clarificationResume) {
      return "workflow_resume";
    }

    if (this.isDirectRegisterUserCommand(params)) {
      return "direct_user_command";
    }

    if (
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty
    ) {
      return "delegated_or_autonomous";
    }

    return "unknown";
  }

  private isDirectRegisterUserCommand(params: {
    request: RaiChatRequestDto;
    finalRequestedToolCalls: RaiChatRequestDto["toolCalls"];
    semanticEvaluation: SemanticRoutingEvaluation;
    requestedOperation: SemanticIngressFrame["requestedOperation"];
    proofSliceId: string | null;
  }): boolean {
    return (
      params.proofSliceId === "crm.register_counterparty" &&
      params.requestedOperation.ownerRole === "crm_agent" &&
      params.requestedOperation.intent === "register_counterparty" &&
      params.requestedOperation.toolName === RaiToolName.RegisterCounterparty &&
      params.requestedOperation.source !== "explicit_tool_call" &&
      (params.finalRequestedToolCalls?.some(
        (toolCall) => toolCall.name === RaiToolName.RegisterCounterparty,
      ) ??
        false) &&
      params.request.message.trim().length > 0
    );
  }

  private resolveRequiresConfirmation(params: {
    semanticEvaluation: SemanticRoutingEvaluation;
    proofSliceId: string | null;
    riskClass: SemanticIngressRiskClass;
    operationAuthority: SemanticIngressOperationAuthority;
  }): boolean {
    if (
      params.proofSliceId === "crm.register_counterparty" &&
      params.operationAuthority !== "direct_user_command"
    ) {
      return true;
    }

    return (
      params.semanticEvaluation.routeDecision.needsConfirmation ||
      params.riskClass === "high_risk_write"
    );
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
