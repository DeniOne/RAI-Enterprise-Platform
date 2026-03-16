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
import { InvariantMetrics } from "../../../shared/invariants/invariant-metrics";

export interface BuildResponseParams {
  request: RaiChatRequestDto;
  executionResult: ExecutionResult;
  recallResult: RecallResult;
  externalSignalResult: { advisory?: ExternalAdvisoryDto; feedbackStored: boolean };
  traceId: string;
  threadId: string;
  companyId: string;
}

@Injectable()
export class ResponseComposerService {
  constructor(
    private readonly widgetBuilder: RaiChatWidgetBuilder,
    private readonly sensitiveDataFilter: SensitiveDataFilterService,
  ) {}

  private isRiskPolicyBlockedResult(
    result: unknown,
  ): result is { riskPolicyBlocked: true; actionId?: string; message?: string } {
    return Boolean(
      result &&
        typeof result === "object" &&
        (result as { riskPolicyBlocked?: boolean }).riskPolicyBlocked === true,
    );
  }

  private isAgentConfigBlockedResult(
    result: unknown,
  ): result is { agentConfigBlocked: true; reasonCode?: string; message?: string } {
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

  private summarizeBlockedToolResult(
    tool: { name: RaiToolName; result: unknown },
  ): string | null {
    if (this.isRiskPolicyBlockedResult(tool.result)) {
      const actionId =
        typeof tool.result.actionId === "string" && tool.result.actionId.length > 0
          ? ` PendingAction #${tool.result.actionId}.`
          : "";
      return `Действие "${buildToolDisplayName(tool.name)}" ожидает подтверждения.${actionId}`;
    }

    if (this.isAgentConfigBlockedResult(tool.result)) {
      return `Действие "${buildToolDisplayName(tool.name)}" заблокировано конфигурацией агента.`;
    }

    return null;
  }

  async buildResponse(params: BuildResponseParams): Promise<RaiChatResponseDto> {
    const {
      request,
      executionResult,
      recallResult,
      externalSignalResult,
      traceId,
      threadId,
      companyId,
    } = params;
    const { recall, profile } = recallResult;
    const clientFacing = request.audience === "client_front_office";

    const directAnswer = this.buildDirectAnswerForRequest(
      request.message,
      executionResult.executedTools,
    );
    let text = directAnswer ?? `Принял: ${request.message}`;
    if (!directAnswer && executionResult.executedTools.length > 0) {
      const toolSummary = this.summarizeExecutedTools(
        executionResult.executedTools,
        request.message,
      );
      if (toolSummary) text += `\n${toolSummary}`;
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
      clientFacing || executionResult.agentExecution || !hasRenderableLegacySource
        ? []
        : this.widgetBuilder.build({
            companyId,
            workspaceContext: request.workspaceContext,
          });
    const richOutputPayload = clarificationPayload
      ? null
      : this.buildRichOutputPayload(request, executionResult, widgets);

    if (executionResult.agentExecution) {
      text = executionResult.agentExecution.text;
    }
    if (clarificationPayload) {
      text = clarificationPayload.text;
    }
    text = this.sensitiveDataFilter.mask(text);

    const evidence = executionResult.agentExecution?.evidence ?? this.collectEvidence(executionResult);
    const runtimeGovernance =
      executionResult.agentExecution?.runtimeGovernance ??
      executionResult.runtimeGovernance;
    const suggestedActions = clientFacing
      ? []
      : this.buildSuggestedActions(request, runtimeGovernance, traceId);

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
      agentRole: executionResult.agentExecution?.role,
      fallbackUsed: executionResult.agentExecution?.fallbackUsed,
      validation: executionResult.agentExecution?.validation,
      outputContractVersion: executionResult.agentExecution?.outputContractVersion,
      pendingClarification: clarificationPayload?.pendingClarification,
      workWindows: clientFacing
        ? undefined
        : clarificationPayload?.workWindows ?? richOutputPayload?.workWindows,
      activeWindowId: clientFacing
        ? undefined
        : clarificationPayload?.activeWindowId ?? richOutputPayload?.activeWindowId,
    };
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

    const contract = detectClarificationContract(request, executionResult);
    if (!contract?.clarification) {
      return null;
    }
    const clarificationContract = contract.clarification;
    const context = resolveContextValues(request);
    const windowId = request.clarificationResume?.windowId ?? `${clarificationContract.windowIdPrefix}-${request.threadId ?? "new"}`;
    const missingKeys = resolveMissingContextKeys(contract, context);
    const clarificationMode = this.resolveClarificationWindowMode({
      status: agentExecution.status,
      missingKeys,
      resultText: agentExecution.text,
    });

    if (agentExecution.status === "NEEDS_MORE_DATA") {
      const hintWindowId = `${windowId}-hint`;
      const pendingClarification: PendingClarificationDto = {
        kind: "missing_context",
        agentRole: contract.role,
        intentId: contract.intentId === "tech_map_draft" ? "tech_map_draft" : "compute_plan_fact",
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
              intentId: contract.intentId === "tech_map_draft" ? "tech_map_draft" : "compute_plan_fact",
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
              intentId: contract.intentId === "tech_map_draft" ? "tech_map_draft" : "compute_plan_fact",
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
        text: agentExecution.text,
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
              intentId: contract.intentId === "tech_map_draft" ? "tech_map_draft" : "compute_plan_fact",
              summary: clarificationContract.resultSummary,
              fieldRef: context.fieldRef,
              seasonRef: context.seasonRef,
              seasonId: context.seasonId,
              planId: context.planId,
              missingKeys: [],
              resultText: agentExecution.text,
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
              intentId: contract.intentId === "tech_map_draft" ? "tech_map_draft" : "compute_plan_fact",
              summary: clarificationContract.resultHintSummary,
              fieldRef: context.fieldRef,
              seasonRef: context.seasonRef,
              seasonId: context.seasonId,
              planId: context.planId,
              missingKeys: [],
              resultText: agentExecution.text,
            },
            actions: clarificationContract.buildResultHintActions(windowId, context),
            isPinned: false,
          },
        ],
        activeWindowId: windowId,
      };
    }

    return null;
  }

  private buildRichOutputPayload(
    request: RaiChatRequestDto,
    executionResult: ExecutionResult,
    widgets: RaiChatWidget[],
  ): {
    workWindows: RaiWorkWindowDto[];
    activeWindowId: string | null;
  } | null {
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

    const crmPayload = this.buildCrmRichOutputPayload(
      request,
      executionResult,
    );
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
      summary: executionResult.agentExecution?.text,
    });

    return mapped.workWindows.length > 0 ? mapped : null;
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
                      value: "Уточните формулировку запроса или перейдите в базу знаний для ручного поиска.",
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
      (agentExecution.status !== "COMPLETED" && agentExecution.status !== "RATE_LIMITED")
    ) {
      return null;
    }

    const monitoringWindowId = `win-monitoring-${request.threadId ?? "new"}`;
    const detailsWindowId = `${monitoringWindowId}-details`;
    const structured = (agentExecution.structuredOutput ?? {}) as {
      alertsEmitted?: number;
      signalsSnapshot?: { signals?: Array<{ type?: string }> };
    };
    const alertCount = typeof structured.alertsEmitted === "number" ? structured.alertsEmitted : 0;
    const signalTypes = (structured.signalsSnapshot?.signals ?? [])
      .map((item) => item?.type)
      .filter((item): item is string => typeof item === "string" && item.length > 0);

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
        title: agentExecution.status === "RATE_LIMITED" ? "Мониторинг временно ограничен" : "Сигналы мониторинга",
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
                    tone: agentExecution.status === "RATE_LIMITED" ? "warning" : "info",
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
                  value: agentExecution.status === "RATE_LIMITED" ? "Ограничено по лимиту" : "Завершено",
                  tone: agentExecution.status === "RATE_LIMITED" ? "warning" : "positive",
                },
                {
                  label: "Открытых алертов",
                  value: `${alertCount}`,
                  tone: alertCount > 0 ? "critical" : "neutral",
                },
                {
                  label: "Типы сигналов",
                  value: signalTypes.length > 0 ? signalTypes.join(", ") : "Нет отдельных сигналов в snapshot",
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

    const structured = ((agentExecution?.structuredOutput ?? {}) as {
      data?: unknown;
      intent?: string;
    });
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
    const intent = structured.intent ?? (explicitCrmTool ? toolIntentMap[explicitCrmTool.name] : undefined);
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
      (this.isRiskPolicyBlockedResult(data) || this.isAgentConfigBlockedResult(data))
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
          status: this.isAgentConfigBlockedResult(data) ? "informational" : "needs_user_input",
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
                    tone: this.isAgentConfigBlockedResult(data) ? "critical" : "warning",
                  },
                  {
                    label: this.isAgentConfigBlockedResult(data) ? "Причина" : "PendingAction",
                    value: this.isAgentConfigBlockedResult(data)
                      ? data.reasonCode ?? "не указана"
                      : actionId ?? "не указан",
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
                tone: this.isAgentConfigBlockedResult(data) ? "critical" : "warning",
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
      agentExecution?.text ?? "CRM-операция выполнена.",
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

    if (agentExecution && agentExecution.role !== "contracts_agent" && !explicitContractsTool) {
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
      [RaiToolName.CreateInvoiceFromFulfillment]: "create_invoice_from_fulfillment",
      [RaiToolName.PostInvoice]: "post_invoice",
      [RaiToolName.CreatePayment]: "create_payment",
      [RaiToolName.ConfirmPayment]: "confirm_payment",
      [RaiToolName.AllocatePayment]: "allocate_payment",
      [RaiToolName.GetArBalance]: "review_ar_balance",
    };
    const intent = (structured.intent ?? (explicitContractsTool ? toolIntentMap[explicitContractsTool.name] : undefined)) as
      | ContractsWindowIntent
      | undefined;
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
      (this.isRiskPolicyBlockedResult(data) || this.isAgentConfigBlockedResult(data))
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
          status: this.isAgentConfigBlockedResult(data) ? "informational" : "needs_user_input",
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
                    tone: this.isAgentConfigBlockedResult(data) ? "critical" : "warning",
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
            summary: "Подтвердите commerce-действие в governance-контуре и повторите команду.",
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
      const missingContext = (Array.isArray(structured.missingContext)
        ? structured.missingContext
        : []) as RaiWorkWindowDto["payload"]["missingKeys"];
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
          summary: buildContractsSummary(intent, data, agentExecution?.text ?? "Commerce-операция выполнена."),
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
          summary: "Экономист подготовил сравнение ключевых показателей сценария.",
          missingKeys: [],
          columns: ["Текущий сценарий", "Комментарий"],
          rows: [
            {
              id: "roi",
              label: "ROI",
              values: [
                scenarioResult ? `${(scenarioResult.roi * 100).toFixed(1)}%` : "—",
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
              values: [scenarioResult?.source ?? "deterministic", "Основа расчёта."],
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
      this.readWorkspaceFilterAsString(request.workspaceContext?.filters?.fieldId);
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
        reason:
          runtimeGovernance?.degraded
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

  private extractProfileSummary(profile: Record<string, unknown>): string | null {
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
        confidence: Number(topEngram.compositeScore ?? topEngram.similarity ?? 0),
        source: topEngram.category,
      });
    }
    const top = recall.items[0];
    if (top?.content) {
      items.push({
        kind: "episode",
        label: top.content.slice(0, 80),
        confidence: Number(top.confidence ?? 0),
        source: typeof top.metadata?.source === "string" ? top.metadata.source : "episode",
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
          const rawMessage = tool.result.message?.trim() || "Неизвестная ошибка выполнения инструмента.";
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
          const r = tool.result as ComputeDeviationsResult & { explain?: string; agentName?: string };
          if (r?.agentName === "AgronomAgent" && r.explain) return r.explain;
          return `Отклонений найдено: ${(r as ComputeDeviationsResult)?.count ?? 0}`;
        }
        if (tool.name === RaiToolName.ComputePlanFact) {
          const r = tool.result as ComputePlanFactResult | { data?: ComputePlanFactResult; agentName?: string };
          const data = "data" in r && r.data ? r.data : (r as ComputePlanFactResult);
          return `План-факт по плану ${data.planId}: ROI ${data.roi}, EBITDA ${data.ebitda}`;
        }
        if (tool.name === RaiToolName.EmitAlerts) {
          const r = tool.result as EmitAlertsResult;
          return `Открытых эскалаций ${r.severity}+ : ${r.count}`;
        }
        if (tool.name === RaiToolName.GenerateTechMapDraft) {
          const r = tool.result as GenerateTechMapDraftResult & { explain?: string; agentName?: string };
          if (r?.agentName === "AgronomAgent" && r.explain) return r.explain;
          return `Черновик техкарты создан: ${(r as GenerateTechMapDraftResult)?.draftId}`;
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
