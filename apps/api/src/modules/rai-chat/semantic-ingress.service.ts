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
  SemanticIngressWritePolicy,
} from "../../shared/rai-chat/semantic-ingress.types";
import {
  CompositeWorkflowPlan,
  CompositeWorkflowStageContract,
} from "../../shared/rai-chat/composite-orchestration.types";
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
        compositePlan,
      ),
      domainCandidates: this.resolveDomainCandidates(
        params.legacyClassification,
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
    writePolicy: SemanticIngressWritePolicy;
  }): boolean {
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
