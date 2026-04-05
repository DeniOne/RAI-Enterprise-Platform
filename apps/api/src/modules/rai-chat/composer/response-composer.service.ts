import { Injectable } from "@nestjs/common";
import {
  RaiChatRequestDto,
  RaiChatResponseDto,
  RaiMemoryUsedDto,
  RaiMemorySummaryDto,
  ExternalAdvisoryDto,
  EvidenceReference,
  PendingClarificationDto,
  RaiWorkWindowDto,
  type ExecutionExplainabilityV1,
} from "../dto/rai-chat.dto";
import {
  RaiSuggestedAction,
  RaiToolName,
  ComputeDeviationsResult,
  ComputePlanFactResult,
  EmitAlertsResult,
  GenerateTechMapDraftResult,
  RegisterCounterpartyResult,
  CreateCounterpartyRelationResult,
  CreateCrmAccountResult,
  CreateCrmContactResult,
  GetCrmAccountWorkspaceResult,
  UpdateCrmAccountResult,
  UpdateCrmContactResult,
  DeleteCrmContactResult,
  CreateCrmInteractionResult,
  UpdateCrmInteractionResult,
  DeleteCrmInteractionResult,
  CreateCrmObligationResult,
  UpdateCrmObligationResult,
  DeleteCrmObligationResult,
  CreateCommerceContractResult,
  ListCommerceContractsResult,
  GetCommerceContractResult,
  CreateCommerceObligationResult,
  CreateFulfillmentEventResult,
  CreateInvoiceFromFulfillmentResult,
  PostInvoiceResult,
  CreatePaymentResult,
  ConfirmPaymentResult,
  AllocatePaymentResult,
  GetArBalanceResult,
  QueryKnowledgeResult,
  SimulateScenarioResult,
} from "../tools/rai-tools.types";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import { RecallResult } from "../memory/memory-coordinator.service";
import { EpisodicRetrievalResponse } from "../../../shared/memory/episodic-retrieval.service";
import { isFoundationGatedFeatureEnabled } from "../../../shared/feature-flags/foundation-release-flags";
import { ExecutionResult } from "../runtime/agent-runtime.service";
import { RaiChatWidget } from "../../../shared/rai-chat/rai-chat-widgets.types";
import {
  composeWindowsFromLegacyWidgets,
  resolveActiveWorkWindowId,
} from "./work-window.factory";
import {
  BranchResultContract,
  BranchTrustAssessment,
  BranchVerdict,
  UserFacingBranchCompositionPayload,
  UserFacingTrustSummary,
} from "../../../shared/rai-chat/branch-trust.types";
import { resolveOverallBranchVerdictFromCounts } from "../../../shared/rai-chat/branch-verdict-rules";
import {
  extractStructuredRuntimeSummary,
  resolveAgentExecutionSummary,
} from "../../../shared/rai-chat/agent-execution-summary";
import { CompositeWorkflowPlan } from "../../../shared/rai-chat/composite-orchestration.types";
import {
  buildPendingClarificationItems,
  detectClarificationContract,
  resolveContextValues,
  resolveMissingContextKeys,
} from "../../../shared/rai-chat/agent-interaction-contracts";
import {
  buildContractsActions,
  buildContractsNextStepSummary,
  buildContractsSections,
  buildContractsSummary,
  buildContractsTitle,
  buildCrmActions,
  buildCrmNextStepSummary,
  buildCrmSections,
  buildCrmSummary,
  buildCrmTitle,
  buildWorkspaceDirectorAnswer,
  resolveCounterpartyRouteFromWorkspaceData,
  buildToolDisplayName,
} from "../../../shared/rai-chat/response-composer-presenters";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import { InvariantMetrics } from "../../../shared/invariants/invariant-metrics";

export interface BuildResponseParams {
  request: RaiChatRequestDto;
  executionResult: ExecutionResult;
  recallResult: RecallResult;
  externalSignalResult: {
    advisory?: ExternalAdvisoryDto;
    feedbackStored: boolean;
  };
  traceId: string;
  threadId: string;
  companyId: string;
  semanticIngressFrame?: SemanticIngressFrame;
}

interface BranchSynthesisEntry {
  result?: BranchResultContract;
  assessment: BranchTrustAssessment;
  composition?: UserFacingBranchCompositionPayload;
}

interface BranchSynthesis {
  text: string;
  replaceBaseText: boolean;
}

interface WorkWindowPayloadBundle {
  workWindows: RaiWorkWindowDto[];
  activeWindowId: string | null;
}

@Injectable()
export class ResponseComposerService {
  constructor(
    private readonly widgetBuilder: RaiChatWidgetBuilder,
    private readonly sensitiveDataFilter: SensitiveDataFilterService,
  ) {}

  private isRiskPolicyBlockedResult(result: unknown): result is {
    riskPolicyBlocked: true;
    actionId?: string;
    message?: string;
  } {
    return Boolean(
      result &&
      typeof result === "object" &&
      (result as { riskPolicyBlocked?: boolean }).riskPolicyBlocked === true,
    );
  }

  private isAgentConfigBlockedResult(result: unknown): result is {
    agentConfigBlocked: true;
    reasonCode?: string;
    message?: string;
  } {
    return Boolean(
      result &&
      typeof result === "object" &&
      (result as { agentConfigBlocked?: boolean }).agentConfigBlocked === true,
    );
  }

  private isToolExecutionErrorResult(
    result: unknown,
  ): result is { toolExecutionError: true; code?: string; message?: string } {
    return Boolean(
      result &&
      typeof result === "object" &&
      (result as { toolExecutionError?: boolean }).toolExecutionError === true,
    );
  }

  private summarizeBlockedToolResult(tool: {
    name: RaiToolName;
    result: unknown;
  }): string | null {
    if (this.isRiskPolicyBlockedResult(tool.result)) {
      const actionId =
        typeof tool.result.actionId === "string" &&
        tool.result.actionId.length > 0
          ? ` PendingAction #${tool.result.actionId}.`
          : "";
      return `Действие "${buildToolDisplayName(tool.name)}" ожидает подтверждения.${actionId}`;
    }

    if (this.isAgentConfigBlockedResult(tool.result)) {
      return `Действие "${buildToolDisplayName(tool.name)}" заблокировано конфигурацией агента.`;
    }

    return null;
  }

  async buildResponse(
    params: BuildResponseParams,
  ): Promise<RaiChatResponseDto> {
    const {
      request,
      executionResult,
      recallResult,
      externalSignalResult,
      traceId,
      threadId,
      companyId,
      semanticIngressFrame,
    } = params;
    const { recall, profile } = recallResult;
    const clientFacing = request.audience === "client_front_office";
    const readOnlyTechMapQuery = this.isReadOnlyTechMapQuery(request.message);

    const directAnswer = this.buildDirectAnswerForRequest(
      request.message,
      executionResult.executedTools,
    );
    const greetingAnswer = this.buildGreetingAnswerForRequest(request.message);
    const fallbackText =
      "Я не совсем понял ваш запрос. Пожалуйста, уточните: вас интересует агрономия (технологические карты, поля), финансы или необходимо выполнить поиск в базе знаний?";
    const techMapReadOnlyText =
      "Понял запрос: показать список техкарт. Откройте реестр техкарт по кнопке ниже.";
    let text =
      directAnswer ??
      greetingAnswer ??
      (readOnlyTechMapQuery ? techMapReadOnlyText : fallbackText);
    if (!directAnswer && executionResult.executedTools.length > 0) {
      const toolSummary = this.summarizeExecutedTools(
        executionResult.executedTools,
        request.message,
      );
      if (toolSummary) {
        text = toolSummary;
      }
    }
    if (recall.items.length > 0) {
      const top = recall.items[0];
      text += `\nУчтён предыдущий контекст: ${top.content.slice(0, 80)}`;
    }
    if (externalSignalResult.advisory) {
      const a = externalSignalResult.advisory;
      text += `\nAdvisory: ${a.recommendation} — ${a.summary}`;
    }
    if (externalSignalResult.feedbackStored) {
      text += "\nFeedback по advisory записан в память.";
    }
    const compositePayload = this.buildCrmCompositeWorkflowPayload(
      request,
      executionResult,
    );
    const clarificationPayload = this.buildClarificationPayload(
      request,
      executionResult,
    );
    const hasRenderableLegacySource = executionResult.executedTools.some(
      (tool) =>
        !this.isRiskPolicyBlockedResult(tool.result) &&
        !this.isAgentConfigBlockedResult(tool.result) &&
        !this.isToolExecutionErrorResult(tool.result),
    );
    const widgets =
      clientFacing ||
      executionResult.agentExecution ||
      (request.toolCalls?.length ?? 0) > 0 ||
      !hasRenderableLegacySource
        ? []
        : this.widgetBuilder.build({
            companyId,
            workspaceContext: request.workspaceContext,
          });
    let richOutputPayload: {
      workWindows: RaiWorkWindowDto[];
      activeWindowId: string | null;
    } | null = null;
    if (compositePayload) {
      richOutputPayload = compositePayload;
    } else if (!clarificationPayload) {
      richOutputPayload = this.buildRichOutputPayload(
        request,
        executionResult,
        widgets,
      );
    }

    if (executionResult.agentExecution) {
      text = resolveAgentExecutionSummary({
        structuredOutput: executionResult.agentExecution.structuredOutput,
        structuredOutputs: executionResult.agentExecution.structuredOutputs,
        branchCompositions: executionResult.agentExecution.branchCompositions,
        branchResults: executionResult.agentExecution.branchResults,
        fallback: text,
      });
      if (
        readOnlyTechMapQuery &&
        executionResult.agentExecution.status === "NEEDS_MORE_DATA"
      ) {
        text = techMapReadOnlyText;
      }
    }
    if (clarificationPayload) {
      text = clarificationPayload.text;
    }
    const branchVerdictSynthesis = this.buildBranchVerdictSynthesis(
      executionResult,
    );
    if (branchVerdictSynthesis) {
      text = branchVerdictSynthesis.replaceBaseText
        ? branchVerdictSynthesis.text
        : `${text}\n${branchVerdictSynthesis.text}`;
    } else {
      const structuredOutputsSynthesis = this.buildStructuredOutputsSynthesis(
        executionResult,
      );
      if (structuredOutputsSynthesis) {
        text = `${text}\n${structuredOutputsSynthesis}`;
      }
    }
    text = this.sensitiveDataFilter.mask(text);

    const evidence =
      executionResult.agentExecution?.evidence ??
      this.collectEvidence(executionResult);
    const runtimeGovernance =
      executionResult.agentExecution?.runtimeGovernance ??
      executionResult.runtimeGovernance;
    const suggestedActions = clientFacing
      ? []
      : this.buildSuggestedActions(request, runtimeGovernance, traceId);

    if (executionResult.agentExecution?.suggestedActions?.length) {
      suggestedActions.unshift(...executionResult.agentExecution.suggestedActions);
    }
    
    if (executionResult.agentExecution?.structuredOutput?.suggested_actions && Array.isArray(executionResult.agentExecution.structuredOutput.suggested_actions)) {
      const llmActions = executionResult.agentExecution.structuredOutput.suggested_actions.map(a => ({
        kind: "route" as const,
        title: a.title,
        href: a.href || a.route,
      })).filter(a => a.href && a.title);
      suggestedActions.unshift(...llmActions);
    }
    const intermediateSteps = this.buildIntermediateSteps(executionResult);
    const trustSummary = this.buildUserFacingTrustSummary(executionResult);

    let workWindowPayload = clientFacing
      ? null
      : compositePayload
        ? compositePayload
        : clarificationPayload
        ? {
            workWindows: clarificationPayload.workWindows,
            activeWindowId: clarificationPayload.activeWindowId,
          }
        : this.buildBranchTrustWorkWindows(
            request,
            executionResult,
            richOutputPayload,
          );

    if (!clientFacing && semanticIngressFrame?.executionSurface?.branches?.length) {
      const surfaceBundle = this.buildExecutionSurfaceWorkWindows(
        semanticIngressFrame,
        traceId,
      );
      workWindowPayload = this.mergeWorkWindowPayloads(
        surfaceBundle,
        workWindowPayload,
      );
    }

    return {
      text,
      widgets,
      toolCalls: executionResult.executedTools.map((t) => ({
        name: t.name,
        payload:
          t.result && typeof t.result === "object"
            ? (t.result as Record<string, unknown>)
            : { result: t.result ?? null },
      })),
      traceId,
      threadId,
      suggestedActions,
      openUiToken: undefined,
      advisory: externalSignalResult.advisory,
      memoryUsed: this.buildMemoryUsed(
        profile,
        recall,
        recallResult.engrams,
        recallResult.hotEngrams,
        recallResult.activeAlerts,
      ),
      memorySummary: this.buildMemorySummary(
        profile,
        recall,
        recallResult.engrams,
        recallResult.hotEngrams,
        recallResult.activeAlerts,
      ),
      evidence: evidence.length > 0 ? evidence : undefined,
      runtimeBudget: executionResult.runtimeBudget,
      runtimeGovernance,
      agentRole:
        executionResult.agentExecution?.role ??
        (executionResult.executedTools[0]?.name === "emit_alerts"
          ? "monitoring"
          : undefined),
      fallbackUsed: executionResult.agentExecution?.fallbackUsed,
      validation: executionResult.agentExecution?.validation,
      outputContractVersion:
        executionResult.agentExecution?.outputContractVersion,
      branchResults: executionResult.agentExecution?.branchResults,
      branchTrustAssessments:
        executionResult.agentExecution?.branchTrustAssessments,
      branchCompositions: executionResult.agentExecution?.branchCompositions,
      trustSummary: trustSummary ?? undefined,
      pendingClarification: clarificationPayload?.pendingClarification,
      workWindows: clientFacing ? undefined : workWindowPayload?.workWindows,
      activeWindowId: clientFacing
        ? undefined
        : workWindowPayload?.activeWindowId,
      intermediateSteps:
        intermediateSteps.length > 0 ? intermediateSteps : undefined,
      executionSurface: semanticIngressFrame?.executionSurface ?? undefined,
      executionExplainability:
        !clientFacing &&
        semanticIngressFrame?.executionSurface?.branches?.length
          ? (() => {
              const surface = semanticIngressFrame.executionSurface!;
              const meta = surface.plannerAdvanceMeta;
              const deferred = new Set(meta?.deferredRunnableBranchIds ?? []);
              const explain: ExecutionExplainabilityV1 = {
                  version: "v1" as const,
                  branches: surface.branches.map((b) => ({
                    branchId: b.branchId,
                    lifecycle: b.lifecycle,
                    mutationState: b.mutationState,
                    policyDecision:
                      deferred.has(b.branchId) && b.lifecycle === "PLANNED"
                        ? "branch_concurrency_cap"
                        : (semanticIngressFrame.writePolicy?.decision ?? null),
                    ...(b.pendingActionId
                      ? { pendingActionId: b.pendingActionId }
                      : {}),
                  })),
                };
              if (
                meta &&
                meta.deferredRunnableBranchIds.length > 0
              ) {
                explain.concurrencyDeferral = {
                  cap: meta.concurrencyCap,
                  deferredBranchIds: meta.deferredRunnableBranchIds,
                };
              }
              return explain;
            })()
          : undefined,
    };
  }

  private buildIntermediateSteps(
    executionResult: ExecutionResult,
  ): RaiChatResponseDto["intermediateSteps"] {
    if (executionResult.agentExecution) {
      const executionPath =
        executionResult.agentExecution.executionPath ??
        "fallback_interpretation";
      const confidence =
        executionResult.agentExecution.structuredOutput &&
        typeof executionResult.agentExecution.structuredOutput === "object" &&
        typeof (executionResult.agentExecution.structuredOutput as { confidence?: unknown }).confidence === "number"
          ? Number(
              (executionResult.agentExecution.structuredOutput as {
                confidence: number;
              }).confidence,
            )
          : undefined;
      const delegated =
        executionResult.agentExecution.delegationChain?.map((step) => ({
          executionPath,
          toolName: step.toolName,
          status: executionResult.agentExecution?.status ?? "FAILED",
          confidence:
            typeof step.confidence === "number" ? step.confidence : confidence,
          fromRole: step.fromRole,
          toRole: step.toRole,
          traceId: step.traceId,
          spanId: step.spanId,
          parentSpanId: step.parentSpanId,
          promptTokens: step.usage?.promptTokens,
          completionTokens: step.usage?.completionTokens,
          totalTokens: step.usage?.totalTokens,
        })) ?? [];
      const direct = (executionResult.agentExecution.toolCalls ?? []).map(
        (call) => ({
          executionPath,
          toolName: call.name,
          status: executionResult.agentExecution?.status ?? "FAILED",
          confidence,
        }),
      );
      return [...delegated, ...direct];
    }

    return executionResult.executedTools.map((tool) => ({
      executionPath: "fallback_interpretation",
      toolName: tool.name,
      status: "COMPLETED",
    }));
  }

  private buildClarificationPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    text: string;
    pendingClarification: PendingClarificationDto | null;
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    const agentExecution = executionResult.agentExecution;
    if (!agentExecution) {
      return null;
    }
    if (
      agentExecution.status === "NEEDS_MORE_DATA" &&
      typeof agentExecution.structuredOutput?.routingReason === "string" &&
      agentExecution.structuredOutput.routingReason === "no_safe_agronom_intent"
    ) {
      return null;
    }

    const contract = detectClarificationContract(request, executionResult);
    if (!contract?.clarification) {
      return null;
    }
    const clarificationContract = contract.clarification;
    const context = resolveContextValues(request);
    const windowId =
      request.clarificationResume?.windowId ??
      `${clarificationContract.windowIdPrefix}-${request.threadId ?? "new"}`;
    const missingKeys = resolveMissingContextKeys(contract, context);
    const clarificationMode = this.resolveClarificationWindowMode({
      status: agentExecution.status,
      missingKeys,
      resultText: resolveAgentExecutionSummary({
        structuredOutput: agentExecution.structuredOutput,
        fallback: clarificationContract.pendingSummary,
      }),
    });

    if (agentExecution.status === "NEEDS_MORE_DATA") {
      const hintWindowId = `${windowId}-hint`;
      const pendingClarification: PendingClarificationDto = {
        kind: "missing_context",
        agentRole: contract.role,
        intentId:
          contract.intentId === "tech_map_draft"
            ? "tech_map_draft"
            : "compute_plan_fact",
        summary: clarificationContract.pendingSummary,
        autoResume: true,
        items: buildPendingClarificationItems(contract, context),
      };

      return {
        text: clarificationContract.chatText,
        pendingClarification,
        workWindows: [
          {
            windowId,
            originMessageId: null,
            agentRole: contract.role,
            type: "context_acquisition",
            parentWindowId: null,
            relatedWindowIds: [hintWindowId],
            category: "clarification",
            priority: missingKeys.length === 1 ? 95 : 85,
            mode: clarificationMode,
            title: clarificationContract.title,
            status: "needs_user_input",
            payload: {
              intentId:
                contract.intentId === "tech_map_draft"
                  ? "tech_map_draft"
                  : "compute_plan_fact",
              summary: pendingClarification.summary,
              fieldRef: context.fieldRef,
              seasonRef: context.seasonRef,
              seasonId: context.seasonId,
              planId: context.planId,
              missingKeys,
            },
            actions: clarificationContract.buildClarificationActions(context),
            isPinned: false,
          },
          {
            windowId: hintWindowId,
            originMessageId: null,
            agentRole: contract.role,
            type: "context_hint",
            parentWindowId: windowId,
            relatedWindowIds: [windowId],
            category: "analysis",
            priority: 40,
            mode: missingKeys.length === 1 ? "inline" : "panel",
            title: clarificationContract.hintTitle,
            status: "needs_user_input",
            payload: {
              intentId:
                contract.intentId === "tech_map_draft"
                  ? "tech_map_draft"
                  : "compute_plan_fact",
              summary: clarificationContract.hintSummary(missingKeys),
              fieldRef: context.fieldRef,
              seasonRef: context.seasonRef,
              seasonId: context.seasonId,
              planId: context.planId,
              missingKeys,
            },
            actions: clarificationContract.buildHintActions(windowId),
            isPinned: false,
          },
        ],
        activeWindowId: windowId,
      };
    }

    if (request.clarificationResume && agentExecution.status === "COMPLETED") {
      const resultHintWindowId = `${windowId}-result-hint`;
      return {
        text: resolveAgentExecutionSummary({
          structuredOutput: agentExecution.structuredOutput,
          fallback: clarificationContract.resultSummary,
        }),
        pendingClarification: null,
        workWindows: [
          {
            windowId,
            originMessageId: null,
            agentRole: contract.role,
            type: "context_acquisition",
            parentWindowId: null,
            relatedWindowIds: [resultHintWindowId],
            category: "result",
            priority: 70,
            mode: clarificationMode,
            title: clarificationContract.resultTitle,
            status: "completed",
            payload: {
              intentId:
                contract.intentId === "tech_map_draft"
                  ? "tech_map_draft"
                  : "compute_plan_fact",
              summary: clarificationContract.resultSummary,
              fieldRef: context.fieldRef,
              seasonRef: context.seasonRef,
              seasonId: context.seasonId,
              planId: context.planId,
              missingKeys: [],
              resultText: resolveAgentExecutionSummary({
                structuredOutput: agentExecution.structuredOutput,
                fallback: clarificationContract.resultSummary,
              }),
            },
            actions: [],
            isPinned: false,
          },
          {
            windowId: resultHintWindowId,
            originMessageId: null,
            agentRole: contract.role,
            type: "context_hint",
            parentWindowId: windowId,
            relatedWindowIds: [windowId],
            category: "result",
            priority: 30,
            mode: "inline",
            title: "Что делать дальше",
            status: "completed",
            payload: {
              intentId:
                contract.intentId === "tech_map_draft"
                  ? "tech_map_draft"
                  : "compute_plan_fact",
              summary: clarificationContract.resultHintSummary,
              fieldRef: context.fieldRef,
              seasonRef: context.seasonRef,
              seasonId: context.seasonId,
              planId: context.planId,
              missingKeys: [],
              resultText: resolveAgentExecutionSummary({
                structuredOutput: agentExecution.structuredOutput,
                fallback: clarificationContract.resultHintSummary,
              }),
            },
            actions: clarificationContract.buildResultHintActions(
              windowId,
              context,
            ),
            isPinned: false,
          },
        ],
        activeWindowId: windowId,
      };
    }

    return null;
  }

  private buildStructuredOutputsSynthesis(
    executionResult: ExecutionResult,
  ): string | null {
    const outputs = executionResult.agentExecution?.structuredOutputs;
    if (!outputs || outputs.length < 2) {
      return null;
    }

    const bullets = outputs
      .map((output, index) => {
        const summary = extractStructuredRuntimeSummary(output);
        if (!summary) {
          return null;
        }
        return `${index + 1}. ${summary}`;
      })
      .filter((item): item is string => Boolean(item));
    if (bullets.length === 0) {
      return null;
    }
    return `Синтез делегированной цепочки:\n${bullets.join("\n")}`;
  }

  private buildBranchVerdictSynthesis(
    executionResult: ExecutionResult,
  ): BranchSynthesis | null {
    const assessments =
      executionResult.agentExecution?.branchTrustAssessments ?? [];
    if (assessments.length === 0) {
      return null;
    }

    const bundles = this.buildBranchSynthesisEntries(executionResult);
    if (bundles.length === 0) {
      return null;
    }

    const conflicted = bundles.filter(
      (entry) => entry.assessment.verdict === "CONFLICTED",
    );
    if (conflicted.length > 0) {
      return {
        text: this.buildConflictDisclosure(conflicted),
        replaceBaseText: true,
      };
    }

    const verified = bundles.filter(
      (entry) => entry.assessment.verdict === "VERIFIED",
    );
    const partial = bundles.filter(
      (entry) => entry.assessment.verdict === "PARTIAL",
    );
    const unresolved = bundles.filter(
      (entry) =>
        entry.assessment.verdict === "UNVERIFIED" ||
        entry.assessment.verdict === "REJECTED",
    );

    if (verified.length === 0 && partial.length === 0 && unresolved.length > 0) {
      return {
        text: this.buildInsufficientEvidenceDisclosure(unresolved),
        replaceBaseText: true,
      };
    }

    const sections = [
      this.buildConfirmedFactsSection(verified),
      this.buildPartialFactsSection(partial),
      this.buildUnresolvedDisclaimer(unresolved),
    ].filter((section): section is string => Boolean(section));

    if (sections.length === 0) {
      return null;
    }

    return {
      text: sections.join("\n"),
      replaceBaseText: false,
    };
  }

  private buildBranchSynthesisEntries(
    executionResult: ExecutionResult,
  ): BranchSynthesisEntry[] {
    const results = executionResult.agentExecution?.branchResults ?? [];
    const assessments =
      executionResult.agentExecution?.branchTrustAssessments ?? [];
    const compositions =
      executionResult.agentExecution?.branchCompositions ?? [];
    const resultMap = new Map(results.map((result) => [result.branch_id, result]));
    const compositionMap = new Map(
      compositions.map((composition) => [composition.branch_id, composition]),
    );

    return assessments.map((assessment) => ({
      assessment,
      result: resultMap.get(assessment.branch_id),
      composition: compositionMap.get(assessment.branch_id),
    }));
  }

  private buildConfirmedFactsSection(
    entries: BranchSynthesisEntry[],
  ): string | null {
    if (entries.length === 0) {
      return null;
    }
    const bullets = entries
      .map((entry, index) => {
        const summary = this.extractBranchSummary(entry);
        if (!summary) {
          return null;
        }
        return `${index + 1}. ${summary}`;
      })
      .filter((item): item is string => Boolean(item));
    if (bullets.length === 0) {
      return null;
    }

    return bullets.length === 1
      ? `Подтверждённый факт: ${bullets[0].replace(/^1\\. /, "")}`
      : `Подтверждённые факты:\n${bullets.join("\n")}`;
  }

  private buildPartialFactsSection(
    entries: BranchSynthesisEntry[],
  ): string | null {
    if (entries.length === 0) {
      return null;
    }
    const bullets = entries
      .map((entry, index) => {
        const summary = this.extractBranchSummary(entry);
        if (!summary) {
          return null;
        }
        const limitations = this.extractBranchDisclosure(entry);
        const suffix =
          limitations.length > 0
            ? ` Ограничения: ${limitations.join(", ")}.`
            : " Ограничения: есть неполное подтверждение данных.";
        return `${index + 1}. ${summary}.${suffix}`;
      })
      .filter((item): item is string => Boolean(item));
    if (bullets.length === 0) {
      return null;
    }
    return `Частично подтверждено:\n${bullets.join("\n")}`;
  }

  private buildConflictDisclosure(
    entries: BranchSynthesisEntry[],
  ): string {
    const bullets = entries
      .map((entry, index) => {
        const summary = this.extractBranchSummary(entry);
        const disclosure = this.extractBranchDisclosure(entry);
        const details =
          disclosure.length > 0 ? ` Причины: ${disclosure.join(", ")}.` : "";
        return `${index + 1}. ${summary ?? "Есть конфликтующая ветка."}${details}`;
      })
      .join("\n");

    return `Обнаружено расхождение между ветками. Я не буду выдавать это как подтверждённый факт.\n${bullets}`;
  }

  private buildInsufficientEvidenceDisclosure(
    entries: BranchSynthesisEntry[],
  ): string {
    const disclosure = entries
      .flatMap((entry) => this.extractBranchDisclosure(entry))
      .filter((value, index, array) => array.indexOf(value) === index);
    const suffix =
      disclosure.length > 0
        ? ` Ограничения: ${disclosure.join(", ")}.`
        : "";

    return `Недостаточно подтверждённых данных, чтобы выдать установленный факт.${suffix}`;
  }

  private buildUnresolvedDisclaimer(
    entries: BranchSynthesisEntry[],
  ): string | null {
    if (entries.length === 0) {
      return null;
    }
    const verdicts = entries
      .map((entry) => entry.assessment.verdict)
      .filter((value, index, array) => array.indexOf(value) === index);
    return `Часть веток не включена в подтверждённые факты: ${verdicts.join(", ")}.`;
  }

  private extractBranchSummary(entry: BranchSynthesisEntry): string | null {
    const summaryFields = [
      entry.composition?.summary,
      entry.result?.summary,
    ];
    for (const value of summaryFields) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  private extractBranchDisclosure(entry: BranchSynthesisEntry): string[] {
    const compositionDisclosure = Array.isArray(entry.composition?.disclosure)
      ? entry.composition.disclosure.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];
    const assessmentReasons = Array.isArray(entry.assessment.reasons)
      ? entry.assessment.reasons.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];
    return [...new Set([...compositionDisclosure, ...assessmentReasons])];
  }

  private buildRichOutputPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
    widgets: RaiChatWidget[],
  ): WorkWindowPayloadBundle | null {
    const comparisonPayload = this.buildEconomistComparisonPayload(
      request,
      executionResult,
    );
    if (comparisonPayload) {
      return comparisonPayload;
    }

    const knowledgePayload = this.buildKnowledgeRichOutputPayload(
      request,
      executionResult,
    );
    if (knowledgePayload) {
      return knowledgePayload;
    }

    const monitoringPayload = this.buildMonitoringRichOutputPayload(
      request,
      executionResult,
    );
    if (monitoringPayload) {
      return monitoringPayload;
    }

    const crmPayload = this.buildCrmRichOutputPayload(request, executionResult);
    if (crmPayload) {
      return crmPayload;
    }

    const contractsPayload = this.buildContractsRichOutputPayload(
      request,
      executionResult,
    );
    if (contractsPayload) {
      return contractsPayload;
    }

    const mapped = composeWindowsFromLegacyWidgets({
      widgets,
      agentRole: executionResult.agentExecution?.role ?? "knowledge",
      baseWindowId: `win-legacy-${request.threadId ?? "new"}`,
      summary: executionResult.agentExecution
        ? resolveAgentExecutionSummary({
            structuredOutput: executionResult.agentExecution.structuredOutput,
            branchCompositions: executionResult.agentExecution.branchCompositions,
            branchResults: executionResult.agentExecution.branchResults,
            fallback: undefined,
          })
        : undefined,
    });

    return mapped.workWindows.length > 0 ? mapped : null;
  }

  private buildBranchTrustWorkWindows(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
    currentPayload: WorkWindowPayloadBundle | null,
  ): WorkWindowPayloadBundle | null {
    const entries = this.buildBranchSynthesisEntries(executionResult);
    if (entries.length === 0) {
      return currentPayload;
    }

    const trustPayload = this.buildBranchTrustWindowPayload(
      request.threadId,
      entries,
    );
    if (!trustPayload) {
      return currentPayload;
    }

    const mergedWorkWindows = [
      ...(currentPayload?.workWindows ?? []),
      ...trustPayload.workWindows,
    ];

    return {
      workWindows: mergedWorkWindows,
      activeWindowId:
        currentPayload?.activeWindowId ??
        resolveActiveWorkWindowId(mergedWorkWindows),
    };
  }

  private buildUserFacingTrustSummary(
    executionResult: ExecutionResult,
  ): UserFacingTrustSummary | null {
    const entries = this.buildBranchSynthesisEntries(executionResult);
    if (entries.length === 0) {
      return null;
    }

    const overallVerdict = this.resolveOverallBranchVerdict(entries);
    const verifiedCount = entries.filter(
      (entry) => entry.assessment.verdict === "VERIFIED",
    ).length;
    const partialCount = entries.filter(
      (entry) => entry.assessment.verdict === "PARTIAL",
    ).length;
    const unverifiedCount = entries.filter(
      (entry) => entry.assessment.verdict === "UNVERIFIED",
    ).length;
    const conflictedCount = entries.filter(
      (entry) => entry.assessment.verdict === "CONFLICTED",
    ).length;
    const rejectedCount = entries.filter(
      (entry) => entry.assessment.verdict === "REJECTED",
    ).length;
    const crossCheckCount = entries.filter(
      (entry) => entry.assessment.requires_cross_check,
    ).length;
    const disclosure = this.uniqueStrings(
      entries.flatMap((entry) => this.extractBranchDisclosure(entry)),
    ).slice(0, 4);
    const sortedEntries = [...entries]
      .sort((left, right) => {
        const verdictDiff =
          this.branchVerdictSeverity(right.assessment.verdict) -
          this.branchVerdictSeverity(left.assessment.verdict);
        if (verdictDiff !== 0) {
          return verdictDiff;
        }
        return right.assessment.score - left.assessment.score;
      })
      .slice(0, 4);

    return {
      verdict: overallVerdict,
      label: this.branchVerdictLabel(overallVerdict),
      tone: this.branchVerdictTone(overallVerdict),
      summary: this.buildBranchTrustSummaryText(
        overallVerdict,
        entries.length,
        verifiedCount,
      ),
      disclosure,
      branchCount: entries.length,
      verifiedCount,
      partialCount,
      unverifiedCount,
      conflictedCount,
      rejectedCount,
      crossCheckCount,
      branches: sortedEntries.map((entry) => ({
        branchId: entry.assessment.branch_id,
        sourceAgent: entry.assessment.source_agent,
        verdict: entry.assessment.verdict,
        label: this.branchVerdictLabel(entry.assessment.verdict),
        summary: this.extractBranchSummary(entry) ?? undefined,
        disclosure: this.extractBranchDisclosure(entry),
      })),
    };
  }

  private buildBranchTrustWindowPayload(
    threadId: string | undefined,
    entries: BranchSynthesisEntry[],
  ): WorkWindowPayloadBundle | null {
    if (entries.length === 0) {
      return null;
    }

    const overallVerdict = this.resolveOverallBranchVerdict(entries);
    const trustWindowId = `win-branch-trust-${threadId ?? "new"}`;
    const signalsWindowId = `${trustWindowId}-signals`;
    const disclosure = this.uniqueStrings(
      entries.flatMap((entry) => this.extractBranchDisclosure(entry)),
    ).slice(0, 4);
    const verifiedCount = entries.filter(
      (entry) => entry.assessment.verdict === "VERIFIED",
    ).length;
    const partialCount = entries.filter(
      (entry) => entry.assessment.verdict === "PARTIAL",
    ).length;
    const unverifiedCount = entries.filter(
      (entry) => entry.assessment.verdict === "UNVERIFIED",
    ).length;
    const conflictedCount = entries.filter(
      (entry) => entry.assessment.verdict === "CONFLICTED",
    ).length;
    const rejectedCount = entries.filter(
      (entry) => entry.assessment.verdict === "REJECTED",
    ).length;
    const crossCheckCount = entries.filter(
      (entry) => entry.assessment.requires_cross_check,
    ).length;
    const supportedCount = verifiedCount + partialCount;
    const unresolvedCount =
      unverifiedCount + conflictedCount + rejectedCount;
    const sortedEntries = [...entries]
      .sort((left, right) => {
        const verdictDiff =
          this.branchVerdictSeverity(right.assessment.verdict) -
          this.branchVerdictSeverity(left.assessment.verdict);
        if (verdictDiff !== 0) {
          return verdictDiff;
        }
        return right.assessment.score - left.assessment.score;
      })
      .slice(0, 4);
    const signalItems = sortedEntries
      .filter((entry) => entry.assessment.verdict !== "VERIFIED")
      .slice(0, 3)
      .map((entry, index) => ({
        id: `${signalsWindowId}-signal-${index + 1}`,
        tone: this.branchVerdictTone(entry.assessment.verdict),
        text: `${entry.assessment.source_agent}: ${
          this.extractBranchSummary(entry) ??
          this.branchVerdictLabel(entry.assessment.verdict)
        }${
          this.extractBranchDisclosure(entry)[0]
            ? ` Ограничение: ${this.extractBranchDisclosure(entry)[0]}.`
            : ""
        }`,
        targetWindowId: trustWindowId,
      }));

    if (signalItems.length === 0) {
      signalItems.push({
        id: `${signalsWindowId}-verified`,
        tone: "info",
        text: `Ответ подтверждён по ${this.formatBranchCountLabel(
          verifiedCount,
        )}.`,
        targetWindowId: trustWindowId,
      });
    }

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId: trustWindowId,
        originMessageId: null,
        agentRole: "supervisor",
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [signalsWindowId],
        category: "analysis",
        priority:
          overallVerdict === "CONFLICTED" || overallVerdict === "REJECTED"
            ? 74
            : overallVerdict === "UNVERIFIED"
              ? 68
              : overallVerdict === "PARTIAL"
                ? 52
                : 26,
        mode:
          overallVerdict === "CONFLICTED" ||
          overallVerdict === "UNVERIFIED" ||
          overallVerdict === "REJECTED"
            ? "panel"
            : "inline",
        title: "Статус подтверждения ответа",
        status: "informational",
        payload: {
          intentId: "branch_trust_summary",
          summary: this.buildBranchTrustSummaryText(
            overallVerdict,
            entries.length,
            verifiedCount,
          ),
          missingKeys: [],
          sections: [
            {
              id: "trust-overview",
              title: "Итог проверки",
              items: [
                {
                  label: "Вердикт",
                  value: this.branchVerdictLabel(overallVerdict),
                  tone:
                    overallVerdict === "VERIFIED"
                      ? "positive"
                      : overallVerdict === "PARTIAL"
                        ? "warning"
                        : "critical",
                },
                {
                  label: "Подтверждено",
                  value: `${supportedCount} из ${entries.length}`,
                  tone: supportedCount > 0 ? "positive" : "warning",
                },
                {
                  label: "Селективная перепроверка",
                  value:
                    crossCheckCount > 0
                      ? `${crossCheckCount}`
                      : "не потребовалась",
                  tone: crossCheckCount > 0 ? "warning" : "neutral",
                },
              ],
            },
            {
              id: "trust-coverage",
              title: "Покрытие веток",
              items: [
                {
                  label: "Подтверждено",
                  value: `${verifiedCount}`,
                  tone: verifiedCount > 0 ? "positive" : "neutral",
                },
                {
                  label: "Частично",
                  value: `${partialCount}`,
                  tone: partialCount > 0 ? "warning" : "neutral",
                },
                {
                  label: "Неподтверждено или отклонено",
                  value: `${unresolvedCount}`,
                  tone: unresolvedCount > 0 ? "critical" : "neutral",
                },
              ],
            },
            ...(disclosure.length > 0
              ? [
                  {
                    id: "trust-limitations",
                    title: "Ограничения",
                    items: disclosure.map((item, index) => ({
                      label: `Ограничение ${index + 1}`,
                      value: item,
                      tone: "warning" as const,
                    })),
                  },
                ]
              : []),
            {
              id: "trust-branches",
              title: "По веткам",
              items: sortedEntries.map((entry) => {
                const branchDisclosure = this.extractBranchDisclosure(entry);
                return {
                  label: `${entry.assessment.source_agent} · ${this.branchVerdictLabel(
                    entry.assessment.verdict,
                  )}`,
                  value: this.extractBranchSummary(entry)
                    ? `${this.extractBranchSummary(entry)}${
                        branchDisclosure[0]
                          ? ` Ограничение: ${branchDisclosure[0]}.`
                          : ""
                      }`
                    : branchDisclosure[0] ?? "Сводка ветки недоступна.",
                  tone:
                    entry.assessment.verdict === "VERIFIED"
                      ? ("positive" as const)
                      : entry.assessment.verdict === "PARTIAL"
                        ? ("warning" as const)
                        : ("critical" as const),
                };
              }),
            },
          ],
        },
        actions: [],
        isPinned: false,
      },
      {
        windowId: signalsWindowId,
        originMessageId: null,
        agentRole: "supervisor",
        type: "related_signals",
        parentWindowId: trustWindowId,
        relatedWindowIds: [trustWindowId],
        category: "signals",
        priority:
          overallVerdict === "CONFLICTED" || overallVerdict === "REJECTED"
            ? 66
            : overallVerdict === "UNVERIFIED"
              ? 60
              : overallVerdict === "PARTIAL"
                ? 44
                : 18,
        mode: "inline",
        title: "Сигналы подтверждения",
        status: "informational",
        payload: {
          intentId: "branch_trust_summary",
          summary: "Что контур доверия зафиксировал в этом ответе.",
          missingKeys: [],
          signalItems,
        },
        actions: [
          {
            id: "focus_branch_trust_summary",
            kind: "focus_window",
            label: "Открыть статус подтверждения",
            enabled: true,
            targetWindowId: trustWindowId,
          },
        ],
        isPinned: false,
      },
    ];

    return {
      workWindows,
      activeWindowId: resolveActiveWorkWindowId(workWindows),
    };
  }

  private resolveOverallBranchVerdict(
    entries: BranchSynthesisEntry[],
  ): BranchVerdict {
    const counts = entries.reduce(
      (acc, entry) => {
        acc[entry.assessment.verdict] += 1;
        return acc;
      },
      {
        VERIFIED: 0,
        PARTIAL: 0,
        UNVERIFIED: 0,
        CONFLICTED: 0,
        REJECTED: 0,
      } satisfies Record<BranchVerdict, number>,
    );
    return resolveOverallBranchVerdictFromCounts(counts);
  }

  private buildBranchTrustSummaryText(
    verdict: BranchVerdict,
    branchCount: number,
    verifiedCount: number,
  ): string {
    switch (verdict) {
      case "VERIFIED":
        return `Ответ подтверждён по ${this.formatBranchCountLabel(
          verifiedCount,
        )} без неподтверждённых веток.`;
      case "PARTIAL":
        return "Подтверждённые ветки есть, но часть ответа требует явного указания ограничений.";
      case "UNVERIFIED":
        return "Недостаточно подтверждённых веток, чтобы считать ответ установленным фактом.";
      case "CONFLICTED":
        return "Между ветками найдено расхождение, поэтому ответ должен оставаться с честным раскрытием конфликта.";
      case "REJECTED":
        return "Ветки ответа отклонены проверкой и не должны выдаваться как подтверждённый факт.";
      default:
        return `Проверено ${this.formatBranchCountLabel(branchCount)}.`;
    }
  }

  private branchVerdictLabel(verdict: BranchVerdict): string {
    switch (verdict) {
      case "VERIFIED":
        return "Подтверждено";
      case "PARTIAL":
        return "Частично подтверждено";
      case "UNVERIFIED":
        return "Неподтверждено";
      case "CONFLICTED":
        return "Есть конфликт";
      case "REJECTED":
        return "Отклонено";
      default:
        return verdict;
    }
  }

  private branchVerdictTone(
    verdict: BranchVerdict,
  ): "critical" | "warning" | "info" {
    switch (verdict) {
      case "VERIFIED":
        return "info";
      case "PARTIAL":
      case "UNVERIFIED":
        return "warning";
      case "CONFLICTED":
      case "REJECTED":
        return "critical";
      default:
        return "info";
    }
  }

  private branchVerdictSeverity(verdict: BranchVerdict): number {
    switch (verdict) {
      case "CONFLICTED":
        return 5;
      case "REJECTED":
        return 4;
      case "UNVERIFIED":
        return 3;
      case "PARTIAL":
        return 2;
      case "VERIFIED":
      default:
        return 1;
    }
  }

  private formatBranchCountLabel(count: number): string {
    if (count === 1) {
      return "1 ветка";
    }
    if (count > 1 && count < 5) {
      return `${count} ветки`;
    }
    return `${count} веток`;
  }

  private uniqueStrings(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private buildKnowledgeRichOutputPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    const agentExecution = executionResult.agentExecution;
    if (
      !agentExecution ||
      agentExecution.role !== "knowledge" ||
      agentExecution.status !== "COMPLETED"
    ) {
      return null;
    }

    const knowledgeResult = executionResult.executedTools.find(
      (tool) => tool.name === RaiToolName.QueryKnowledge,
    )?.result as QueryKnowledgeResult | undefined;

    if (!knowledgeResult) {
      return null;
    }

    const windowId = `win-knowledge-${request.threadId ?? "new"}`;
    const signalWindowId = `${windowId}-signals`;
    const hasHits = knowledgeResult.hits > 0;

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId,
        originMessageId: null,
        agentRole: "knowledge",
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [signalWindowId],
        category: "result",
        priority: hasHits ? 72 : 60,
        mode: hasHits ? "panel" : "inline",
        title: hasHits ? "Результат из базы знаний" : "Совпадения не найдены",
        status: "completed",
        payload: {
          intentId: "query_knowledge",
          summary: hasHits
            ? `Найдено совпадений: ${knowledgeResult.hits}.`
            : "По текущему запросу база знаний не нашла подтверждённых совпадений.",
          missingKeys: [],
          sections: [
            {
              id: "knowledge_hits",
              title: hasHits ? "Найденные фрагменты" : "Статус поиска",
              items: hasHits
                ? knowledgeResult.items.slice(0, 3).map((item, index) => ({
                    label: `Фрагмент ${index + 1}`,
                    value: item.content,
                    tone: item.score >= 0.75 ? "positive" : "neutral",
                  }))
                : [
                    {
                      label: "Рекомендация",
                      value:
                        "Уточните формулировку запроса или перейдите в базу знаний для ручного поиска.",
                      tone: "warning",
                    },
                  ],
            },
          ],
        },
        actions: [
          {
            id: "open_knowledge_base",
            kind: "open_route",
            label: "Открыть базу знаний",
            enabled: true,
            targetRoute: "/knowledge/base",
          },
        ],
        isPinned: false,
      },
      {
        windowId: signalWindowId,
        originMessageId: null,
        agentRole: "knowledge",
        type: "related_signals",
        parentWindowId: windowId,
        relatedWindowIds: [windowId],
        category: "signals",
        priority: 28,
        mode: "inline",
        title: "Сигналы по знанию",
        status: "informational",
        payload: {
          intentId: "query_knowledge",
          summary: hasHits
            ? "Можно открыть основной результат или перейти в базу знаний."
            : "Нужна более точная формулировка запроса или ручной поиск в базе знаний.",
          missingKeys: [],
          signalItems: hasHits
            ? knowledgeResult.items.slice(0, 3).map((item, index) => ({
                id: `knowledge-hit-${index + 1}`,
                tone: item.score >= 0.75 ? "info" : "warning",
                text: `Фрагмент ${index + 1}: релевантность ${item.score.toFixed(2)}`,
                targetWindowId: windowId,
              }))
            : [
                {
                  id: "knowledge-no-hit",
                  tone: "warning",
                  text: "Совпадений не найдено. Уточните запрос или откройте базу знаний.",
                  targetRoute: "/knowledge/base",
                },
              ],
        },
        actions: [
          {
            id: "focus_knowledge_result",
            kind: "focus_window",
            label: "Открыть результат",
            enabled: true,
            targetWindowId: windowId,
          },
          {
            id: "go_knowledge_base",
            kind: "open_route",
            label: "Перейти в базу знаний",
            enabled: true,
            targetRoute: "/knowledge/base",
          },
        ],
        isPinned: false,
      },
    ];

    return {
      activeWindowId: resolveActiveWorkWindowId(workWindows),
      workWindows,
    };
  }

  private buildMonitoringRichOutputPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    const agentExecution = executionResult.agentExecution;
    if (
      !agentExecution ||
      agentExecution.role !== "monitoring" ||
      (agentExecution.status !== "COMPLETED" &&
        agentExecution.status !== "RATE_LIMITED")
    ) {
      return null;
    }

    const monitoringWindowId = `win-monitoring-${request.threadId ?? "new"}`;
    const detailsWindowId = `${monitoringWindowId}-details`;
    const structured = (agentExecution.structuredOutput ?? {}) as {
      alertsEmitted?: number;
      signalsSnapshot?: { signals?: Array<{ type?: string }> };
    };
    const alertCount =
      typeof structured.alertsEmitted === "number"
        ? structured.alertsEmitted
        : 0;
    const signalTypes = (structured.signalsSnapshot?.signals ?? [])
      .map((item) => item?.type)
      .filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      );

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId: monitoringWindowId,
        originMessageId: null,
        agentRole: "monitoring",
        type: "related_signals",
        parentWindowId: null,
        relatedWindowIds: [detailsWindowId],
        category: "signals",
        priority: agentExecution.status === "RATE_LIMITED" ? 92 : 82,
        mode: alertCount > 0 ? "panel" : "inline",
        title:
          agentExecution.status === "RATE_LIMITED"
            ? "Мониторинг временно ограничен"
            : "Сигналы мониторинга",
        status: "informational",
        payload: {
          intentId: "emit_alerts",
          summary:
            agentExecution.status === "RATE_LIMITED"
              ? "Лимит алертов исчерпан. Проверьте инциденты вручную."
              : alertCount > 0
                ? `Открытых алертов: ${alertCount}.`
                : "Новых алертов не обнаружено или сигналы совпали с недавними.",
          missingKeys: [],
          signalItems:
            signalTypes.length > 0
              ? signalTypes.slice(0, 4).map((signalType, index) => ({
                  id: `monitoring-signal-${index + 1}`,
                  tone: alertCount > 0 ? "critical" : "info",
                  text: `Сигнал: ${signalType}`,
                  targetWindowId: detailsWindowId,
                }))
              : [
                  {
                    id: "monitoring-status",
                    tone:
                      agentExecution.status === "RATE_LIMITED"
                        ? "warning"
                        : "info",
                    text:
                      agentExecution.status === "RATE_LIMITED"
                        ? "Автоматический мониторинг временно ограничен."
                        : "Сигналы обработаны, критичных событий не добавлено.",
                    targetWindowId: detailsWindowId,
                  },
                ],
        },
        actions: [
          {
            id: "focus_monitoring_details",
            kind: "focus_window",
            label: "Открыть детали",
            enabled: true,
            targetWindowId: detailsWindowId,
          },
          {
            id: "open_monitoring_route",
            kind: "open_route",
            label: "Перейти к инцидентам",
            enabled: true,
            targetRoute: "/governance/security#incidents",
          },
        ],
        isPinned: false,
      },
      {
        windowId: detailsWindowId,
        originMessageId: null,
        agentRole: "monitoring",
        type: "structured_result",
        parentWindowId: monitoringWindowId,
        relatedWindowIds: [monitoringWindowId],
        category: "analysis",
        priority: 38,
        mode: "panel",
        title: "Детали мониторинга",
        status: "completed",
        payload: {
          intentId: "emit_alerts",
          summary: "Сводка по последнему прогону мониторинга.",
          missingKeys: [],
          sections: [
            {
              id: "monitoring_summary",
              title: "Сводка",
              items: [
                {
                  label: "Статус",
                  value:
                    agentExecution.status === "RATE_LIMITED"
                      ? "Ограничено по лимиту"
                      : "Завершено",
                  tone:
                    agentExecution.status === "RATE_LIMITED"
                      ? "warning"
                      : "positive",
                },
                {
                  label: "Открытых алертов",
                  value: `${alertCount}`,
                  tone: alertCount > 0 ? "critical" : "neutral",
                },
                {
                  label: "Типы сигналов",
                  value:
                    signalTypes.length > 0
                      ? signalTypes.join(", ")
                      : "Нет отдельных сигналов в snapshot",
                  tone: "neutral",
                },
              ],
            },
          ],
        },
        actions: [
          {
            id: "open_incidents_route",
            kind: "open_route",
            label: "Открыть инциденты",
            enabled: true,
            targetRoute: "/governance/security#incidents",
          },
        ],
        isPinned: false,
      },
    ];

    return {
      activeWindowId: resolveActiveWorkWindowId(workWindows),
      workWindows,
    };
  }

  private buildCrmCompositeWorkflowPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    const agentExecution = executionResult.agentExecution;
    if (
      !agentExecution ||
      agentExecution.status !== "COMPLETED"
    ) {
      return null;
    }

    const structured = (agentExecution.structuredOutput ?? {}) as {
      compositePlan?: CompositeWorkflowPlan;
      compositeStages?: Array<{
        stageId: string;
        order: number;
        agentRole: string;
        intent: string;
        toolName: RaiToolName;
        status: "planned" | "completed" | "failed" | "blocked";
        summary: string;
      }>;
    };
    const compositePlan = structured.compositePlan;
    const compositeStages = structured.compositeStages ?? [];
    if (!compositePlan || compositeStages.length === 0) {
      return null;
    }

    const isCrmWorkflow = compositePlan.workflowId.startsWith("crm.");
    const compositeWindowId = isCrmWorkflow
      ? `win-crm-composite-${request.threadId ?? "new"}`
      : `win-analytics-composite-${request.threadId ?? "new"}`;
    const signalsWindowId = `${compositeWindowId}-signals`;
    const allCompleted = compositeStages.every(
      (stage) => stage.status === "completed",
    );
    const blockedStage = compositeStages.find(
      (stage) => stage.status === "blocked",
    );
    const failedStages = compositeStages.filter(
      (stage) => stage.status === "failed",
    );
    const intentId = isCrmWorkflow
      ? "crm_composite_flow"
      : "multi_source_aggregation";
    const title = isCrmWorkflow
      ? "CRM составной сценарий"
      : "Аналитическая агрегация";

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId: compositeWindowId,
        originMessageId: null,
        agentRole: agentExecution.role,
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [signalsWindowId],
        category: "result",
        priority: 88,
        mode: allCompleted ? "panel" : "takeover",
        title,
        status: blockedStage || failedStages.length > 0 ? "needs_user_input" : "completed",
        payload: {
          intentId,
          summary: compositePlan.summary,
          missingKeys: [],
          sections: [
            {
              id: "crm_composite_overview",
              title: "План",
              items: [
                {
                  label: "Владелец",
                  value: compositePlan.leadOwnerAgent,
                  tone: "neutral",
                },
                {
                  label: "Стратегия",
                  value: compositePlan.executionStrategy,
                  tone: "neutral",
                },
                {
                  label: "Стадий",
                  value: `${compositeStages.length}`,
                  tone: "neutral",
                },
              ],
            },
            {
              id: "crm_composite_stages",
              title: "Стадии",
              items: compositeStages.map((stage, index) => ({
                label: `${index + 1}. ${stage.summary ? stage.summary.slice(0, 48) : stage.stageId}`,
                value: `${stage.status} · ${stage.intent}`,
                tone:
                  stage.status === "completed"
                    ? ("positive" as const)
                    : stage.status === "blocked"
                      ? ("critical" as const)
                      : ("warning" as const),
              })),
            },
          ],
        },
        actions: [
          {
            id: isCrmWorkflow ? "focus_crm_composite" : "focus_analytics_composite",
            kind: "focus_window",
            label: isCrmWorkflow ? "Открыть сценарий" : "Открыть агрегацию",
            enabled: true,
            targetWindowId: compositeWindowId,
          },
          ...(isCrmWorkflow
            ? [
                {
                  id: "open_crm_composite_route",
                  kind: "open_route" as const,
                  label: "Перейти в CRM",
                  enabled: true,
                  targetRoute: "/consulting/crm",
                },
              ]
            : []),
        ],
        isPinned: false,
      },
      {
        windowId: signalsWindowId,
        originMessageId: null,
        agentRole: agentExecution.role,
        type: "related_signals",
        parentWindowId: compositeWindowId,
        relatedWindowIds: [compositeWindowId],
        category: "signals",
        priority: 34,
        mode: "inline",
        title: isCrmWorkflow ? "Сигналы сценария" : "Сигналы агрегации",
        status: "informational",
        payload: {
          intentId,
          summary: allCompleted
            ? "Все стадии сценария завершены."
            : "Сценарий завершён с ограничениями или требует уточнения.",
          missingKeys: [],
          signalItems: compositeStages.map((stage, index) => ({
            id: `${signalsWindowId}-stage-${index + 1}`,
            tone:
              stage.status === "completed"
                ? ("info" as const)
                : stage.status === "blocked"
                  ? ("critical" as const)
                  : ("warning" as const),
            text: `${stage.stageId}: ${stage.summary}`,
            targetWindowId: compositeWindowId,
          })),
        },
        actions: [
          {
            id: isCrmWorkflow ? "focus_crm_composite_summary" : "focus_analytics_composite_summary",
            kind: "focus_window",
            label: isCrmWorkflow ? "Открыть план" : "Открыть сводку",
            enabled: true,
            targetWindowId: compositeWindowId,
          },
        ],
        isPinned: false,
      },
    ];

    return {
      activeWindowId: resolveActiveWorkWindowId(workWindows),
      workWindows,
    };
  }

  private buildCrmRichOutputPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    const agentExecution = executionResult.agentExecution;
    const explicitCrmTool = executionResult.executedTools.find((tool) =>
      [
        RaiToolName.RegisterCounterparty,
        RaiToolName.CreateCounterpartyRelation,
        RaiToolName.CreateCrmAccount,
        RaiToolName.GetCrmAccountWorkspace,
        RaiToolName.UpdateCrmAccount,
        RaiToolName.CreateCrmContact,
        RaiToolName.UpdateCrmContact,
        RaiToolName.DeleteCrmContact,
        RaiToolName.CreateCrmInteraction,
        RaiToolName.UpdateCrmInteraction,
        RaiToolName.DeleteCrmInteraction,
        RaiToolName.CreateCrmObligation,
        RaiToolName.UpdateCrmObligation,
        RaiToolName.DeleteCrmObligation,
      ].includes(tool.name),
    );

    if (
      agentExecution &&
      agentExecution.role !== "crm_agent" &&
      !explicitCrmTool
    ) {
      return null;
    }

    if (!agentExecution && !explicitCrmTool) {
      return null;
    }

    const structured = (agentExecution?.structuredOutput ?? {}) as {
      data?: unknown;
      intent?: string;
    };
    const toolIntentMap: Partial<Record<RaiToolName, string>> = {
      [RaiToolName.RegisterCounterparty]: "register_counterparty",
      [RaiToolName.CreateCounterpartyRelation]: "create_counterparty_relation",
      [RaiToolName.CreateCrmAccount]: "create_crm_account",
      [RaiToolName.GetCrmAccountWorkspace]: "review_account_workspace",
      [RaiToolName.UpdateCrmAccount]: "update_account_profile",
      [RaiToolName.CreateCrmContact]: "create_crm_contact",
      [RaiToolName.UpdateCrmContact]: "update_crm_contact",
      [RaiToolName.DeleteCrmContact]: "delete_crm_contact",
      [RaiToolName.CreateCrmInteraction]: "log_crm_interaction",
      [RaiToolName.UpdateCrmInteraction]: "update_crm_interaction",
      [RaiToolName.DeleteCrmInteraction]: "delete_crm_interaction",
      [RaiToolName.CreateCrmObligation]: "create_crm_obligation",
      [RaiToolName.UpdateCrmObligation]: "update_crm_obligation",
      [RaiToolName.DeleteCrmObligation]: "delete_crm_obligation",
    };
    const intent =
      structured.intent ??
      (explicitCrmTool ? toolIntentMap[explicitCrmTool.name] : undefined);
    if (
      intent !== "register_counterparty" &&
      intent !== "create_counterparty_relation" &&
      intent !== "create_crm_account" &&
      intent !== "review_account_workspace" &&
      intent !== "update_account_profile" &&
      intent !== "create_crm_contact" &&
      intent !== "update_crm_contact" &&
      intent !== "delete_crm_contact" &&
      intent !== "log_crm_interaction" &&
      intent !== "update_crm_interaction" &&
      intent !== "delete_crm_interaction" &&
      intent !== "create_crm_obligation" &&
      intent !== "update_crm_obligation" &&
      intent !== "delete_crm_obligation"
    ) {
      return null;
    }

    const data = structured.data ?? explicitCrmTool?.result;
    const crmWindowId = `win-crm-${request.threadId ?? "new"}`;
    const nextStepWindowId = `${crmWindowId}-next`;

    if (
      explicitCrmTool &&
      (this.isRiskPolicyBlockedResult(data) ||
        this.isAgentConfigBlockedResult(data))
    ) {
      const actionId =
        this.isRiskPolicyBlockedResult(data) &&
        typeof data.actionId === "string" &&
        data.actionId.length > 0
          ? data.actionId
          : null;
      const blockedSummary =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : this.isAgentConfigBlockedResult(data)
            ? "CRM-действие заблокировано конфигурацией агента."
            : "CRM-действие ещё не выполнено. Система создала ожидающее действие.";
      const workWindows: RaiWorkWindowDto[] = [
        {
          windowId: crmWindowId,
          originMessageId: null,
          agentRole: "crm_agent",
          type: "structured_result",
          parentWindowId: null,
          relatedWindowIds: [nextStepWindowId],
          category: "result",
          priority: 76,
          mode: "panel",
          title: this.isAgentConfigBlockedResult(data)
            ? "Выполнение заблокировано"
            : "Требуется подтверждение",
          status: this.isAgentConfigBlockedResult(data)
            ? "informational"
            : "needs_user_input",
          payload: {
            intentId: intent,
            summary: blockedSummary,
            missingKeys: [],
            sections: [
              {
                id: "crm_pending_action",
                title: "Статус",
                items: [
                  {
                    label: "Операция",
                    value: buildToolDisplayName(explicitCrmTool.name),
                    tone: "warning",
                  },
                  {
                    label: "Статус",
                    value: this.isAgentConfigBlockedResult(data)
                      ? "Заблокировано конфигурацией"
                      : "Ожидает подтверждения",
                    tone: this.isAgentConfigBlockedResult(data)
                      ? "critical"
                      : "warning",
                  },
                  {
                    label: this.isAgentConfigBlockedResult(data)
                      ? "Причина"
                      : "PendingAction",
                    value: this.isAgentConfigBlockedResult(data)
                      ? (data.reasonCode ?? "не указана")
                      : (actionId ?? "не указан"),
                    tone: "neutral",
                  },
                ],
              },
            ],
          },
          actions: [
            {
              id: "open_crm_route_pending",
              kind: "open_route",
              label: "Перейти в CRM",
              enabled: true,
              targetRoute: "/consulting/crm",
            },
          ],
          isPinned: false,
        },
        {
          windowId: nextStepWindowId,
          originMessageId: null,
          agentRole: "crm_agent",
          type: "related_signals",
          parentWindowId: crmWindowId,
          relatedWindowIds: [crmWindowId],
          category: "signals",
          priority: 28,
          mode: "inline",
          title: "Следующий шаг",
          status: "informational",
          payload: {
            intentId: intent,
            summary: this.isAgentConfigBlockedResult(data)
              ? "Исправьте runtime-конфиг агента и повторите CRM-операцию."
              : "Подтвердите действие в governance-контуре, затем повторите операцию.",
            missingKeys: [],
            signalItems: [
              {
                id: `${nextStepWindowId}-signal`,
                tone: this.isAgentConfigBlockedResult(data)
                  ? "critical"
                  : "warning",
                text: this.isAgentConfigBlockedResult(data)
                  ? "Нужна корректировка конфигурации агента."
                  : actionId
                    ? `Создан PendingAction #${actionId}.`
                    : "CRM-действие ожидает подтверждения.",
                targetWindowId: crmWindowId,
              },
            ],
          },
          actions: [
            {
              id: "focus_crm_pending",
              kind: "focus_window",
              label: "Открыть статус",
              enabled: true,
              targetWindowId: crmWindowId,
            },
          ],
          isPinned: false,
        },
      ];

      return {
        activeWindowId: resolveActiveWorkWindowId(workWindows),
        workWindows,
      };
    }

    if (explicitCrmTool && this.isToolExecutionErrorResult(data)) {
      return null;
    }

    if (agentExecution && agentExecution.status !== "COMPLETED") {
      return null;
    }

    const sections = buildCrmSections(intent, data, request.message);
    const summary = buildCrmSummary(
      intent,
      data,
      agentExecution
        ? resolveAgentExecutionSummary({
            structuredOutput: agentExecution.structuredOutput,
            branchCompositions: agentExecution.branchCompositions,
            branchResults: agentExecution.branchResults,
            fallback: "CRM-операция выполнена.",
          })
        : "CRM-операция выполнена.",
      request.message,
    );
    const reviewWorkspaceRoute =
      intent === "review_account_workspace"
        ? resolveCounterpartyRouteFromWorkspaceData(data)
        : null;

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId: crmWindowId,
        originMessageId: null,
        agentRole: "crm_agent",
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [nextStepWindowId],
        category: "result",
        priority: 76,
        mode: "panel",
        title: buildCrmTitle(intent),
        status: "completed",
        payload: {
          intentId: intent,
          summary,
          missingKeys: [],
          sections,
        },
        actions: buildCrmActions(intent, data, crmWindowId),
        isPinned: false,
      },
      {
        windowId: nextStepWindowId,
        originMessageId: null,
        agentRole: "crm_agent",
        type: "related_signals",
        parentWindowId: crmWindowId,
        relatedWindowIds: [crmWindowId],
        category: "signals",
        priority: 28,
        mode: "inline",
        title: "Следующий шаг",
        status: "informational",
        payload: {
          intentId: intent,
          summary: buildCrmNextStepSummary(intent),
          missingKeys: [],
          signalItems: [
            {
              id: `${nextStepWindowId}-signal`,
              tone: "info",
              text: buildCrmNextStepSummary(intent),
              targetWindowId: crmWindowId,
            },
          ],
        },
        actions: [
          {
            id: "focus_crm_result",
            kind: "focus_window",
            label: "Открыть результат",
            enabled: true,
            targetWindowId: crmWindowId,
          },
          {
            id: "go_crm_route",
            kind: "open_route",
            label: reviewWorkspaceRoute?.label ?? "Перейти в CRM",
            enabled: true,
            targetRoute: reviewWorkspaceRoute?.route ?? "/consulting/crm",
          },
        ],
        isPinned: false,
      },
    ];

    return {
      activeWindowId: resolveActiveWorkWindowId(workWindows),
      workWindows,
    };
  }

  private buildContractsRichOutputPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    type ContractsWindowIntent = Extract<
      RaiWorkWindowDto["payload"]["intentId"],
      | "create_commerce_contract"
      | "list_commerce_contracts"
      | "review_commerce_contract"
      | "create_contract_obligation"
      | "create_fulfillment_event"
      | "create_invoice_from_fulfillment"
      | "post_invoice"
      | "create_payment"
      | "confirm_payment"
      | "allocate_payment"
      | "review_ar_balance"
    >;
    const agentExecution = executionResult.agentExecution;
    const explicitContractsTool = executionResult.executedTools.find((tool) =>
      [
        RaiToolName.CreateCommerceContract,
        RaiToolName.ListCommerceContracts,
        RaiToolName.GetCommerceContract,
        RaiToolName.CreateCommerceObligation,
        RaiToolName.CreateFulfillmentEvent,
        RaiToolName.CreateInvoiceFromFulfillment,
        RaiToolName.PostInvoice,
        RaiToolName.CreatePayment,
        RaiToolName.ConfirmPayment,
        RaiToolName.AllocatePayment,
        RaiToolName.GetArBalance,
      ].includes(tool.name),
    );

    if (
      agentExecution &&
      agentExecution.role !== "contracts_agent" &&
      !explicitContractsTool
    ) {
      return null;
    }
    if (!agentExecution && !explicitContractsTool) {
      return null;
    }

    const structured = (agentExecution?.structuredOutput ?? {}) as {
      data?: unknown;
      intent?: string;
      missingContext?: string[];
    };
    const toolIntentMap: Partial<Record<RaiToolName, string>> = {
      [RaiToolName.CreateCommerceContract]: "create_commerce_contract",
      [RaiToolName.ListCommerceContracts]: "list_commerce_contracts",
      [RaiToolName.GetCommerceContract]: "review_commerce_contract",
      [RaiToolName.CreateCommerceObligation]: "create_contract_obligation",
      [RaiToolName.CreateFulfillmentEvent]: "create_fulfillment_event",
      [RaiToolName.CreateInvoiceFromFulfillment]:
        "create_invoice_from_fulfillment",
      [RaiToolName.PostInvoice]: "post_invoice",
      [RaiToolName.CreatePayment]: "create_payment",
      [RaiToolName.ConfirmPayment]: "confirm_payment",
      [RaiToolName.AllocatePayment]: "allocate_payment",
      [RaiToolName.GetArBalance]: "review_ar_balance",
    };
    const intent = (structured.intent ??
      (explicitContractsTool
        ? toolIntentMap[explicitContractsTool.name]
        : undefined)) as ContractsWindowIntent | undefined;
    if (
      intent !== "create_commerce_contract" &&
      intent !== "list_commerce_contracts" &&
      intent !== "review_commerce_contract" &&
      intent !== "create_contract_obligation" &&
      intent !== "create_fulfillment_event" &&
      intent !== "create_invoice_from_fulfillment" &&
      intent !== "post_invoice" &&
      intent !== "create_payment" &&
      intent !== "confirm_payment" &&
      intent !== "allocate_payment" &&
      intent !== "review_ar_balance"
    ) {
      return null;
    }

    const data = structured.data ?? explicitContractsTool?.result;
    const contractsWindowId = `win-contracts-${request.threadId ?? "new"}`;
    const nextStepWindowId = `${contractsWindowId}-next`;

    if (
      explicitContractsTool &&
      (this.isRiskPolicyBlockedResult(data) ||
        this.isAgentConfigBlockedResult(data))
    ) {
      const blockedSummary =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : this.isAgentConfigBlockedResult(data)
            ? "Commerce-действие заблокировано конфигурацией агента."
            : "Commerce-действие ожидает подтверждения.";
      const workWindows: RaiWorkWindowDto[] = [
        {
          windowId: contractsWindowId,
          originMessageId: null,
          agentRole: "contracts_agent",
          type: "structured_result",
          parentWindowId: null,
          relatedWindowIds: [nextStepWindowId],
          category: "result",
          priority: 76,
          mode: "panel",
          title: this.isAgentConfigBlockedResult(data)
            ? "Commerce-выполнение заблокировано"
            : "Требуется подтверждение",
          status: this.isAgentConfigBlockedResult(data)
            ? "informational"
            : "needs_user_input",
          payload: {
            intentId: intent,
            summary: blockedSummary,
            missingKeys: [],
            sections: [
              {
                id: "contracts_pending_action",
                title: "Статус",
                items: [
                  {
                    label: "Операция",
                    value: buildToolDisplayName(explicitContractsTool.name),
                    tone: "warning",
                  },
                  {
                    label: "Статус",
                    value: this.isAgentConfigBlockedResult(data)
                      ? "Заблокировано конфигурацией"
                      : "Ожидает подтверждения",
                    tone: this.isAgentConfigBlockedResult(data)
                      ? "critical"
                      : "warning",
                  },
                ],
              },
            ],
          },
          actions: [
            {
              id: "open_contracts_route_pending",
              kind: "open_route",
              label: "Открыть реестр договоров",
              enabled: true,
              targetRoute: "/commerce/contracts",
            },
          ],
          isPinned: false,
        },
        {
          windowId: nextStepWindowId,
          originMessageId: null,
          agentRole: "contracts_agent",
          type: "related_signals",
          parentWindowId: contractsWindowId,
          relatedWindowIds: [contractsWindowId],
          category: "signals",
          priority: 28,
          mode: "inline",
          title: "Следующий шаг",
          status: "informational",
          payload: {
            intentId: intent,
            summary:
              "Подтвердите commerce-действие в governance-контуре и повторите команду.",
            missingKeys: [],
            signalItems: [
              {
                id: `${nextStepWindowId}-signal`,
                tone: "warning",
                text: "Commerce write path ожидает управляемого подтверждения.",
                targetWindowId: contractsWindowId,
              },
            ],
          },
          actions: [
            {
              id: "focus_contracts_pending",
              kind: "focus_window",
              label: "Открыть статус",
              enabled: true,
              targetWindowId: contractsWindowId,
            },
          ],
          isPinned: false,
        },
      ];

      return {
        activeWindowId: resolveActiveWorkWindowId(workWindows),
        workWindows,
      };
    }

    if (agentExecution?.status === "NEEDS_MORE_DATA") {
      const missingContext = (
        Array.isArray(structured.missingContext)
          ? structured.missingContext
          : []
      ) as RaiWorkWindowDto["payload"]["missingKeys"];
      const workWindows: RaiWorkWindowDto[] = [
        {
          windowId: contractsWindowId,
          originMessageId: null,
          agentRole: "contracts_agent",
          type: "context_acquisition",
          parentWindowId: null,
          relatedWindowIds: [nextStepWindowId],
          category: "clarification",
          priority: 86,
          mode: "panel",
          title: "Нужен контекст для commerce-операции",
          status: "needs_user_input",
          payload: {
            intentId: intent,
            summary: `Нужно дополнить: ${missingContext.join(", ")}`,
            missingKeys: missingContext,
          },
          actions: [
            {
              id: "open_contract_create_route",
              kind: "open_route",
              label: "Открыть создание договора",
              enabled: intent === "create_commerce_contract",
              targetRoute: "/commerce/contracts/create",
            },
            {
              id: "open_contracts_registry_route",
              kind: "open_route",
              label: "Открыть реестр договоров",
              enabled: true,
              targetRoute: "/commerce/contracts",
            },
            {
              id: "refresh_contracts_context",
              kind: "refresh_context",
              label: "Обновить контекст",
              enabled: true,
            },
          ],
          isPinned: false,
        },
        {
          windowId: nextStepWindowId,
          originMessageId: null,
          agentRole: "contracts_agent",
          type: "context_hint",
          parentWindowId: contractsWindowId,
          relatedWindowIds: [contractsWindowId],
          category: "analysis",
          priority: 34,
          mode: "inline",
          title: "Что нужно дополнить",
          status: "needs_user_input",
          payload: {
            intentId: intent,
            summary: `Commerce-операция не может быть завершена без: ${missingContext.join(", ")}`,
            missingKeys: missingContext,
          },
          actions: [
            {
              id: "focus_contracts_clarification",
              kind: "focus_window",
              label: "Открыть панель добора",
              enabled: true,
              targetWindowId: contractsWindowId,
            },
          ],
          isPinned: false,
        },
      ];

      return {
        activeWindowId: resolveActiveWorkWindowId(workWindows),
        workWindows,
      };
    }

    if (agentExecution && agentExecution.status !== "COMPLETED") {
      return null;
    }

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId: contractsWindowId,
        originMessageId: null,
        agentRole: "contracts_agent",
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [nextStepWindowId],
        category: "result",
        priority: 76,
        mode: "panel",
        title: buildContractsTitle(intent),
        status: "completed",
        payload: {
          intentId: intent,
          summary: buildContractsSummary(
            intent,
            data,
            agentExecution
              ? resolveAgentExecutionSummary({
                  structuredOutput: agentExecution.structuredOutput,
                  branchCompositions: agentExecution.branchCompositions,
                  branchResults: agentExecution.branchResults,
                  fallback: "Commerce-операция выполнена.",
                })
              : "Commerce-операция выполнена.",
          ),
          missingKeys: [],
          sections: buildContractsSections(intent, data),
        },
        actions: buildContractsActions(intent, data, contractsWindowId),
        isPinned: false,
      },
      {
        windowId: nextStepWindowId,
        originMessageId: null,
        agentRole: "contracts_agent",
        type: "related_signals",
        parentWindowId: contractsWindowId,
        relatedWindowIds: [contractsWindowId],
        category: "signals",
        priority: 28,
        mode: "inline",
        title: "Следующий шаг",
        status: "informational",
        payload: {
          intentId: intent,
          summary: buildContractsNextStepSummary(intent),
          missingKeys: [],
          signalItems: [
            {
              id: `${nextStepWindowId}-signal`,
              tone: "info",
              text: buildContractsNextStepSummary(intent),
              targetWindowId: contractsWindowId,
            },
          ],
        },
        actions: [
          {
            id: "focus_contracts_result",
            kind: "focus_window",
            label: "Открыть результат",
            enabled: true,
            targetWindowId: contractsWindowId,
          },
          {
            id: "go_contracts_route",
            kind: "open_route",
            label: "Перейти к коммерции",
            enabled: true,
            targetRoute: "/commerce/contracts",
          },
        ],
        isPinned: false,
      },
    ];

    return {
      activeWindowId: resolveActiveWorkWindowId(workWindows),
      workWindows,
    };
  }

  private buildEconomistComparisonPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
    const agentExecution = executionResult.agentExecution;
    if (
      !agentExecution ||
      agentExecution.role !== "economist" ||
      agentExecution.status !== "COMPLETED"
    ) {
      return null;
    }

    const hasScenarioTool =
      executionResult.executedTools.some(
        (tool) => tool.name === RaiToolName.SimulateScenario,
      ) ||
      agentExecution.toolCalls.some(
        (tool) => tool.name === RaiToolName.SimulateScenario,
      );

    if (!hasScenarioTool) {
      return null;
    }

    const comparisonWindowId = `win-comparison-${request.threadId ?? "new"}`;
    const relatedWindowId = `${comparisonWindowId}-signals`;
    const scenarioResult = executionResult.executedTools.find(
      (tool) => tool.name === RaiToolName.SimulateScenario,
    )?.result as SimulateScenarioResult | undefined;

    const workWindows: RaiWorkWindowDto[] = [
      {
        windowId: comparisonWindowId,
        originMessageId: null,
        agentRole: "economist",
        type: "comparison",
        parentWindowId: null,
        relatedWindowIds: [relatedWindowId],
        category: "analysis",
        priority: 90,
        mode: "takeover",
        title: "Сравнение сценария",
        status: "completed",
        payload: {
          intentId: "compute_plan_fact",
          summary:
            "Экономист подготовил сравнение ключевых показателей сценария.",
          missingKeys: [],
          columns: ["Текущий сценарий", "Комментарий"],
          rows: [
            {
              id: "roi",
              label: "ROI",
              values: [
                scenarioResult
                  ? `${(scenarioResult.roi * 100).toFixed(1)}%`
                  : "—",
                "Ключевой показатель окупаемости сценария.",
              ],
              emphasis: "best",
            },
            {
              id: "ebitda",
              label: "EBITDA",
              values: [
                scenarioResult
                  ? `${scenarioResult.ebitda.toLocaleString("ru-RU")} ₽`
                  : "—",
                "Операционный результат сценария.",
              ],
              emphasis: "neutral",
            },
            {
              id: "source",
              label: "Источник",
              values: [
                scenarioResult?.source ?? "deterministic",
                "Основа расчёта.",
              ],
              emphasis: "neutral",
            },
          ],
        },
        actions: [
          {
            id: "open_finance_route_comparison",
            kind: "open_route",
            label: "Перейти к финансам",
            enabled: true,
            targetRoute: "/consulting/yield",
          },
        ],
        isPinned: false,
      },
      {
        windowId: relatedWindowId,
        originMessageId: null,
        agentRole: "economist",
        type: "related_signals",
        parentWindowId: comparisonWindowId,
        relatedWindowIds: [comparisonWindowId],
        category: "signals",
        priority: 35,
        mode: "inline",
        title: "Ключевые сигналы сценария",
        status: "informational",
        payload: {
          intentId: "compute_plan_fact",
          summary: "Короткий обзор сценарных сигналов.",
          missingKeys: [],
          signalItems: [
            {
              id: "scenario-roi",
              tone: "info",
              text: scenarioResult
                ? `ROI сценария: ${(scenarioResult.roi * 100).toFixed(1)}%`
                : "ROI сценария рассчитан.",
              targetWindowId: comparisonWindowId,
            },
            {
              id: "scenario-ebitda",
              tone: "warning",
              text: scenarioResult
                ? `EBITDA: ${scenarioResult.ebitda.toLocaleString("ru-RU")} ₽`
                : "Проверьте EBITDA сценария в основном окне.",
              targetWindowId: comparisonWindowId,
            },
          ],
        },
        actions: [
          {
            id: "focus_comparison",
            kind: "focus_window",
            label: "Открыть сравнение",
            enabled: true,
            targetWindowId: comparisonWindowId,
          },
        ],
        isPinned: false,
      },
    ];

    return {
      activeWindowId: resolveActiveWorkWindowId(workWindows),
      workWindows,
    };
  }

  private resolveClarificationWindowMode(params: {
    status: ExecutionResult["agentExecution"]["status"];
    missingKeys: Array<"fieldRef" | "seasonRef" | "seasonId" | "planId">;
    resultText?: string;
  }): RaiWorkWindowDto["mode"] {
    if (params.status === "COMPLETED") {
      return "takeover";
    }

    if (params.missingKeys.length <= 1) {
      return "inline";
    }

    return "panel";
  }

  buildSuggestedActions(
    request: RaiChatRequestDto,
    runtimeGovernance?: RaiChatResponseDto["runtimeGovernance"],
    traceId?: string,
  ): RaiSuggestedAction[] {
    const actions: RaiSuggestedAction[] = [
      {
        kind: "tool",
        toolName: RaiToolName.EchoMessage,
        title: "Повторить сообщение",
        payload: { message: request.message },
      },
    ];
    if (this.isReadOnlyTechMapQuery(request.message)) {
      actions.unshift({
        kind: "route",
        title: "Открыть реестр техкарт",
        href: "/consulting/techmaps/active",
      });
    }
    const expertReviewAction = this.buildExpertReviewAction(
      request,
      runtimeGovernance,
      traceId,
    );
    if (expertReviewAction) {
      actions.unshift(expertReviewAction);
    }
    if (request.workspaceContext?.route) {
      actions.push({
        kind: "route",
        title: "Открыть текущий раздел",
        href: request.workspaceContext.route,
      });
      actions.push({
        kind: "tool",
        toolName: RaiToolName.WorkspaceSnapshot,
        title: "Снять срез рабочего контекста",
        payload: {
          route: request.workspaceContext.route,
          lastUserAction: request.workspaceContext.lastUserAction,
        },
      });
    }
    return actions.slice(0, 3);
  }

  private buildExpertReviewAction(
    request: RaiChatRequestDto,
    runtimeGovernance?: RaiChatResponseDto["runtimeGovernance"],
    traceId?: string,
  ): RaiSuggestedAction | null {
    const route = request.workspaceContext?.route ?? "";
    const selected = request.workspaceContext?.selectedRowSummary;
    const refs = request.workspaceContext?.activeEntityRefs ?? [];
    const entityType =
      selected?.kind === "techmap" || refs.some((ref) => ref.kind === "techmap")
        ? "techmap"
        : selected?.kind === "field" || refs.some((ref) => ref.kind === "field")
          ? "field"
          : route.includes("/deviations")
            ? "deviation"
            : null;
    const entityId =
      selected?.id ??
      refs.find((ref) => ref.kind === "techmap" || ref.kind === "field")?.id ??
      null;
    const fieldId =
      refs.find((ref) => ref.kind === "field")?.id ??
      (selected?.kind === "field" ? selected.id : undefined) ??
      this.readWorkspaceFilterAsString(
        request.workspaceContext?.filters?.fieldId,
      );
    const seasonId = this.readWorkspaceFilterAsString(
      request.workspaceContext?.filters?.seasonId,
    );
    const planId = this.readWorkspaceFilterAsString(
      request.workspaceContext?.filters?.planId,
    );

    const shouldSuggest =
      runtimeGovernance?.degraded ||
      route.includes("/deviations") ||
      route.includes("/techmap");

    if (!shouldSuggest || !entityType || !entityId) {
      return null;
    }

    return {
      kind: "expert_review",
      title: "Эскалировать к Мега-Агроному",
      expertRole: "chief_agronomist",
      payload: {
        entityType,
        entityId,
        reason: runtimeGovernance?.degraded
          ? runtimeGovernance.fallbackReason
          : "Контекстная экспертная проверка по рабочей сущности",
        ...(fieldId ? { fieldId } : {}),
        ...(seasonId ? { seasonId } : {}),
        ...(planId ? { planId } : {}),
        ...(route ? { workspaceRoute: route } : {}),
        ...(traceId ? { traceParentId: traceId } : {}),
      },
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

  private extractProfileSummary(
    profile: Record<string, unknown>,
  ): string | null {
    const lastRoute =
      typeof profile.lastRoute === "string" && profile.lastRoute.length > 0
        ? profile.lastRoute
        : null;
    const lastMessagePreview =
      typeof profile.lastMessagePreview === "string" &&
      profile.lastMessagePreview.length > 0
        ? profile.lastMessagePreview
        : null;
    const parts = [
      lastRoute ? `lastRoute=${lastRoute}` : null,
      lastMessagePreview ? `lastMessage=${lastMessagePreview}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? (parts.join("; ") as string) : null;
  }

  private buildMemoryUsed(
    profile: Record<string, unknown>,
    recall: EpisodicRetrievalResponse,
    engrams: RecallResult["engrams"] | undefined,
    hotEngrams: RecallResult["hotEngrams"] | undefined,
    activeAlerts: RecallResult["activeAlerts"] | undefined,
  ): RaiMemoryUsedDto[] {
    const items: RaiMemoryUsedDto[] = [];
    const topAlert = activeAlerts?.[0];
    if (topAlert?.message) {
      items.push({
        kind: "active_alert",
        label: topAlert.message.slice(0, 80),
        confidence: this.normalizeConfidence(topAlert.severity),
        source: topAlert.type,
      });
    }
    const topHotEngram = hotEngrams?.[0];
    if (topHotEngram?.contentPreview) {
      items.push({
        kind: "hot_engram",
        label: topHotEngram.contentPreview.slice(0, 80),
        confidence: Number(topHotEngram.compositeScore ?? 0),
        source: topHotEngram.category,
      });
    }
    const topEngram = engrams?.[0];
    if (topEngram?.content) {
      items.push({
        kind: "engram",
        label: topEngram.content.slice(0, 80),
        confidence: Number(
          topEngram.compositeScore ?? topEngram.similarity ?? 0,
        ),
        source: topEngram.category,
      });
    }
    const top = recall.items[0];
    if (top?.content) {
      items.push({
        kind: "episode",
        label: top.content.slice(0, 80),
        confidence: Number(top.confidence ?? 0),
        source:
          typeof top.metadata?.source === "string"
            ? top.metadata.source
            : "episode",
      });
    }
    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) {
      items.push({
        kind: "profile",
        label: profileSummary,
        confidence: this.extractProfileConfidence(profile),
        source: "profile",
      });
    }
    return items.slice(0, 5);
  }

  private buildMemorySummary(
    profile: Record<string, unknown>,
    recall: EpisodicRetrievalResponse,
    engrams: RecallResult["engrams"] | undefined,
    hotEngrams: RecallResult["hotEngrams"] | undefined,
    activeAlerts: RecallResult["activeAlerts"] | undefined,
  ): RaiMemorySummaryDto | undefined {
    if (!isFoundationGatedFeatureEnabled("RAI_MEMORY_HINTS_ENABLED")) {
      return undefined;
    }

    const items = this.buildMemoryUsed(
      profile,
      recall,
      engrams,
      hotEngrams,
      activeAlerts,
    );
    if (items.length === 0) {
      return undefined;
    }

    const priority: RaiMemoryUsedDto["kind"][] = [
      "active_alert",
      "hot_engram",
      "engram",
      "episode",
      "profile",
    ];
    const primary =
      priority
        .map((kind) => items.find((item) => item.kind === kind))
        .find(Boolean) ?? items[0];

    InvariantMetrics.increment("ai_memory_hint_shown_total");
    return {
      primaryHint: this.formatPrimaryMemoryHint(primary),
      primaryKind: primary.kind,
      detailsAvailable: items.length > 0,
    };
  }

  private formatPrimaryMemoryHint(item: RaiMemoryUsedDto): string {
    switch (item.kind) {
      case "active_alert":
        return "Учтены активные отклонения и сигналы риска";
      case "hot_engram":
      case "engram":
      case "episode":
        return "Учтён похожий кейс прошлого сезона";
      case "profile":
        return "Учтены предпочтения и политика компании";
      default:
        return "Учтён накопленный контекст";
    }
  }

  private extractProfileConfidence(profile: Record<string, unknown>): number {
    const raw = profile.confidence;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : 0.5;
  }

  private normalizeConfidence(severity: string | undefined): number {
    switch (severity) {
      case "CRITICAL":
        return 1;
      case "HIGH":
        return 0.9;
      case "MEDIUM":
        return 0.75;
      case "LOW":
        return 0.6;
      default:
        return 0.5;
    }
  }

  private mergeWorkWindowPayloads(
    first: WorkWindowPayloadBundle | null,
    second: WorkWindowPayloadBundle | null,
  ): WorkWindowPayloadBundle | null {
    if (!first) {
      return second;
    }
    if (!second) {
      return first;
    }
    return {
      workWindows: [...first.workWindows, ...second.workWindows],
      activeWindowId: second.activeWindowId ?? first.activeWindowId,
    };
  }

  /** Проекция executionSurface в workWindows (Phase C: только чтение runtime). */
  private buildExecutionSurfaceWorkWindows(
    frame: SemanticIngressFrame,
    traceId: string,
  ): WorkWindowPayloadBundle | null {
    const surface = frame.executionSurface;
    if (!surface?.branches?.length) {
      return null;
    }
    const owner =
      frame.requestedOperation.ownerRole ??
      frame.domainCandidates[0]?.ownerRole ??
      "supervisor";
    const windowId = `exec_surface_${traceId}`;
    return {
      workWindows: [
        {
          windowId,
          originMessageId: null,
          agentRole: owner,
          type: "structured_result",
          category: "analysis",
          priority: 12,
          mode: "panel",
          title: "Состояние веток исполнения",
          status: "informational",
          payload: {
            intentId: "branch_trust_summary",
            summary:
              "Канонические статусы веток из оркестратора (без локальной подмены UI).",
            missingKeys: [],
            sections: surface.branches.map((b) => ({
              id: b.branchId,
              title: b.branchId,
              items: [
                { label: "Жизненный цикл", value: b.lifecycle },
                { label: "Мутация", value: b.mutationState },
              ],
            })),
          },
          actions: [],
          isPinned: false,
        },
      ],
      activeWindowId: null,
    };
  }

  private buildDirectAnswerForRequest(
    requestMessage: string,
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): string | null {
    for (const tool of executedTools) {
      if (tool.name !== RaiToolName.GetCrmAccountWorkspace) {
        continue;
      }
      if (
        this.isRiskPolicyBlockedResult(tool.result) ||
        this.isAgentConfigBlockedResult(tool.result) ||
        this.isToolExecutionErrorResult(tool.result)
      ) {
        continue;
      }

      return buildWorkspaceDirectorAnswer(
        tool.result as GetCrmAccountWorkspaceResult,
        requestMessage,
      );
    }

    return null;
  }

  private buildGreetingAnswerForRequest(message: string): string | null {
    const normalized = message.trim();
    if (!normalized) {
      return null;
    }
    if (/^(привет|здравствуй|добрый\s+день|спасибо|ок|понял|угу)$/i.test(normalized)) {
      return `Принял: ${normalized}`;
    }
    return null;
  }

  private isReadOnlyTechMapQuery(message: string): boolean {
    const normalized = message.toLowerCase();
    const mentionsTechMap = /(техкарт|techmap)/i.test(normalized);
    if (!mentionsTechMap) {
      return false;
    }

    const hasCreateSignal =
      /(созд(ай|ать)|сдела(й|ть)|состав(ь|ить)|подготов(ь|ить)|сгенерируй|черновик|draft)/i.test(
        normalized,
      );
    const hasReadSignal =
      /(покаж|спис|все|какие|посмотр|найд|открой|где|выведи|реестр|активн|архив|заморож)/i.test(
        normalized,
      );
    return hasReadSignal && !hasCreateSignal;
  }

  private summarizeExecutedTools(
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
    requestMessage?: string,
  ): string | null {
    const parts = executedTools
      .map((tool) => {
        const blockedSummary = this.summarizeBlockedToolResult(tool);
        if (blockedSummary) {
          return blockedSummary;
        }
        if (this.isToolExecutionErrorResult(tool.result)) {
          const rawMessage =
            tool.result.message?.trim() ||
            "Неизвестная ошибка выполнения инструмента.";
          if (
            tool.name === RaiToolName.GetCrmAccountWorkspace &&
            (/account_and_party_not_found/i.test(rawMessage) ||
              /not found|не найден/i.test(rawMessage))
          ) {
            return "В текущем контуре не найден операционный аккаунт и не найден контрагент по этому запросу. Проверьте ИНН/название в реестре контрагентов и затем откройте или создайте CRM-аккаунт.";
          }
          return `Действие "${buildToolDisplayName(tool.name)}" не выполнено: ${rawMessage}`;
        }
        if (tool.name === RaiToolName.ComputeDeviations) {
          const r = tool.result as ComputeDeviationsResult & {
            explain?: string;
            agentName?: string;
          };
          if (r?.agentName === "AgronomAgent" && r.explain) return r.explain;
          return `Отклонения получены: ${(r as ComputeDeviationsResult)?.count ?? 0}`;
        }
        if (tool.name === RaiToolName.ComputePlanFact) {
          const r = tool.result as
            | ComputePlanFactResult
            | { data?: ComputePlanFactResult; agentName?: string };
          const data =
            "data" in r && r.data ? r.data : (r as ComputePlanFactResult);
          return `План ${data.planId}: ROI ${data.roi}, EBITDA ${data.ebitda}`;
        }
        if (tool.name === RaiToolName.EmitAlerts) {
          const r = tool.result as EmitAlertsResult;
          return `Открытых эскалаций ${r.severity}+ : ${r.count}`;
        }
        if (tool.name === RaiToolName.GenerateTechMapDraft) {
          const r = tool.result as GenerateTechMapDraftResult & {
            explain?: string;
            agentName?: string;
          };
          if (r?.agentName === "AgronomAgent" && r.explain) return r.explain;
          const workflowSnapshot =
            r?.workflowSnapshot && typeof r.workflowSnapshot === "object"
              ? r.workflowSnapshot
              : r?.workflow_snapshot && typeof r.workflow_snapshot === "object"
                ? r.workflow_snapshot
                : null;
          const missingMust = Array.isArray(r?.missingMust)
            ? r.missingMust
            : Array.isArray(workflowSnapshot?.missing_must)
              ? workflowSnapshot.missing_must
            : [];
          const draftId =
            typeof r?.draftId === "string"
              ? r.draftId
              : typeof workflowSnapshot?.draft_id === "string"
                ? workflowSnapshot.draft_id
              : typeof (r as { id?: unknown })?.id === "string"
                ? String((r as { id?: unknown }).id)
                : "techmap-draft";
          const readiness =
            typeof r?.readiness === "string"
              ? r.readiness
              : typeof workflowSnapshot?.readiness === "string"
                ? workflowSnapshot.readiness
                : "unknown";
          const workflowVerdict =
            typeof r?.workflowVerdict === "string"
              ? r.workflowVerdict
              : typeof workflowSnapshot?.workflow_verdict === "string"
                ? workflowSnapshot.workflow_verdict
              : "unknown";
          const clarifyBatch =
            r?.clarifyBatch && typeof r.clarifyBatch === "object"
              ? r.clarifyBatch
              : workflowSnapshot?.clarify_batch &&
                  typeof workflowSnapshot.clarify_batch === "object"
                ? workflowSnapshot.clarify_batch
              : null;
          const resumeState =
            r?.workflowResumeState && typeof r.workflowResumeState === "object"
              ? r.workflowResumeState
              : workflowSnapshot?.workflow_resume_state &&
                  typeof workflowSnapshot.workflow_resume_state === "object"
                ? workflowSnapshot.workflow_resume_state
              : null;
          const clarifySuffix =
            missingMust.length > 0
              ? ` Нужен governed clarify по ${missingMust.length} обязательным слотам.`
              : "";
          const clarifyLifecycle = clarifyBatch
            ? ` Batch ${clarifyBatch.mode}/${clarifyBatch.status}, resume ${clarifyBatch.resume_token}.`
            : "";
          const resumeSuffix = resumeState
            ? ` Resume phase ${resumeState.resume_from_phase}, recheck ${resumeState.external_recheck_required ? "required" : "not required"}.`
            : "";
          const clarifyAuditTrail = Array.isArray(r?.clarifyAuditTrail)
            ? r.clarifyAuditTrail
            : [];
          const auditSuffix =
            clarifyAuditTrail.length > 0
              ? ` Audit ${clarifyAuditTrail.length} event(s), last ${clarifyAuditTrail[clarifyAuditTrail.length - 1]?.event_type}.`
              : "";
          const workflowOrchestration =
            r?.workflowOrchestration && typeof r.workflowOrchestration === "object"
              ? r.workflowOrchestration
              : workflowSnapshot?.workflow_orchestration &&
                  typeof workflowSnapshot.workflow_orchestration === "object"
                ? workflowSnapshot.workflow_orchestration
              : null;
          const orchestrationSuffix = workflowOrchestration
            ? ` ${workflowOrchestration.summary} Композиция ${workflowOrchestration.composition_gate.can_compose ? "готова" : "заблокирована"}: ${workflowOrchestration.composition_gate.reason}.`
            : "";
          const trustSpecialization =
            r?.trustSpecialization && typeof r.trustSpecialization === "object"
              ? r.trustSpecialization
              : workflowSnapshot?.trust_specialization &&
                  typeof workflowSnapshot.trust_specialization === "object"
                ? workflowSnapshot.trust_specialization
              : null;
          const trustSuffix = trustSpecialization
            ? ` Trust specialization: ${
                trustSpecialization.composition_gate.can_compose
                  ? "composition-allowed"
                  : "composition-blocked"
              }. Disclosed ${trustSpecialization.blocked_disclosure.length} blocked signal(s).`
            : "";
          const variantComparisonReport =
            r?.variantComparisonReport &&
            typeof r.variantComparisonReport === "object"
              ? r.variantComparisonReport
              : null;
          const comparisonSuffix = variantComparisonReport
            ? ` Variant comparison ${variantComparisonReport.comparison_available ? "available" : "single-variant"}.`
            : "";
          const expertReview =
            r?.expertReview && typeof r.expertReview === "object"
              ? r.expertReview
              : null;
          const expertReviewSuffix = expertReview
            ? ` Expert review ${expertReview.verdict} (${expertReview.trigger}). Publication packet ${expertReview.publication_packet_ref}. Human agronomy ${expertReview.human_authority_chain.find((step) => step.role === "human_agronomist")?.status ?? "pending"}.`
            : "";
          const executionLoopSummary =
            r?.executionLoopSummary &&
            typeof r.executionLoopSummary === "object"
              ? r.executionLoopSummary
              : r?.execution_loop_summary &&
                  typeof r.execution_loop_summary === "object"
                ? r.execution_loop_summary
                : null;
          const workflowExplainability =
            r?.workflowExplainability &&
            typeof r.workflowExplainability === "object"
              ? r.workflowExplainability
              : r?.workflow_explainability &&
                  typeof r.workflow_explainability === "object"
                ? r.workflow_explainability
                : null;
          const explainabilitySuffix = workflowExplainability
            ? ` Explainability window ${workflowExplainability.explainability_window}. Blocked reasons ${workflowExplainability.why.blocked_reasons.length}, partial reasons ${workflowExplainability.why.partial_reasons.length}.`
            : "";
          const executionLoopSuffix = executionLoopSummary
            ? ` Execution loop ${executionLoopSummary.execution_state.status}/${executionLoopSummary.deviation_state.status}/${executionLoopSummary.result_state.status}.`
            : "";
          return `Черновик техкарты создан: ${draftId}. Готовность ${readiness}, verdict ${workflowVerdict}.${clarifySuffix}${clarifyLifecycle}${resumeSuffix}${auditSuffix}${orchestrationSuffix}${trustSuffix}${expertReviewSuffix}${comparisonSuffix}${explainabilitySuffix}${executionLoopSuffix}`;
        }
        if (tool.name === RaiToolName.RegisterCounterparty) {
          const r = tool.result as RegisterCounterpartyResult;
          return `Контрагент: ${r.legalName}, карточка ${r.partyId}`;
        }
        if (tool.name === RaiToolName.CreateCounterpartyRelation) {
          const r = tool.result as CreateCounterpartyRelationResult;
          return `Связь контрагентов: ${r.fromPartyId} -> ${r.toPartyId}`;
        }
        if (tool.name === RaiToolName.CreateCrmAccount) {
          const r = tool.result as CreateCrmAccountResult;
          return `CRM-аккаунт: ${r.name}, карточка ${r.accountId}`;
        }
        if (tool.name === RaiToolName.GetCrmAccountWorkspace) {
          const r = tool.result as GetCrmAccountWorkspaceResult;
          return (
            buildWorkspaceDirectorAnswer(r, requestMessage) ??
            `CRM-карточка: контактов ${r.contacts.length}, обязательств ${r.obligations.length}`
          );
        }
        if (tool.name === RaiToolName.CreateCrmContact) {
          const r = tool.result as CreateCrmContactResult;
          return `Контакт создан: ${r.firstName}${r.lastName ? ` ${r.lastName}` : ""}`;
        }
        if (tool.name === RaiToolName.UpdateCrmContact) {
          const r = tool.result as UpdateCrmContactResult;
          return `Контакт обновлён: ${r.contactId}`;
        }
        if (tool.name === RaiToolName.DeleteCrmContact) {
          const r = tool.result as DeleteCrmContactResult;
          return `Контакт удалён: ${r.contactId}`;
        }
        if (tool.name === RaiToolName.CreateCrmInteraction) {
          const r = tool.result as CreateCrmInteractionResult;
          return `Взаимодействие создано: ${r.interactionId}`;
        }
        if (tool.name === RaiToolName.UpdateCrmInteraction) {
          const r = tool.result as UpdateCrmInteractionResult;
          return `Взаимодействие обновлено: ${r.interactionId}`;
        }
        if (tool.name === RaiToolName.DeleteCrmInteraction) {
          const r = tool.result as DeleteCrmInteractionResult;
          return `Взаимодействие удалено: ${r.interactionId}`;
        }
        if (tool.name === RaiToolName.CreateCrmObligation) {
          const r = tool.result as CreateCrmObligationResult;
          return `Обязательство создано: ${r.obligationId}`;
        }
        if (tool.name === RaiToolName.UpdateCrmObligation) {
          const r = tool.result as UpdateCrmObligationResult;
          return `Обязательство обновлено: ${r.obligationId}`;
        }
        if (tool.name === RaiToolName.DeleteCrmObligation) {
          const r = tool.result as DeleteCrmObligationResult;
          return `Обязательство удалено: ${r.obligationId}`;
        }
        return null;
      })
      .filter((x): x is string => Boolean(x));
    return parts.length > 0 ? parts.join("\n") : null;
  }

  private collectEvidence(
    executionResult: ExecutionResult,
  ): EvidenceReference[] {
    const acc: EvidenceReference[] = [];
    for (const tool of executionResult.executedTools) {
      const payload = tool.result as
        | { evidence?: EvidenceReference[] }
        | undefined;
      if (payload?.evidence && Array.isArray(payload.evidence)) {
        acc.push(...payload.evidence);
      }
    }
    return acc;
  }
}
