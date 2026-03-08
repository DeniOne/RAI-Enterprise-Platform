import { Injectable } from "@nestjs/common";
import {
  RaiChatRequestDto,
  RaiChatResponseDto,
  RaiMemoryUsedDto,
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
  QueryKnowledgeResult,
  SimulateScenarioResult,
} from "../tools/rai-tools.types";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import { RecallResult } from "../memory/memory-coordinator.service";
import { EpisodicRetrievalResponse } from "../../../shared/memory/episodic-retrieval.service";
import { ExecutionResult } from "../runtime/agent-runtime.service";
import { RaiChatWidget } from "../widgets/rai-chat-widgets.types";
import {
  composeWindowsFromLegacyWidgets,
  resolveActiveWorkWindowId,
} from "./work-window.factory";
import {
  buildPendingClarificationItems,
  detectClarificationContract,
  resolveContextValues,
  resolveMissingContextKeys,
} from "../agent-contracts/agent-interaction-contracts";

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

  private buildToolDisplayName(toolName: RaiToolName): string {
    switch (toolName) {
      case RaiToolName.RegisterCounterparty:
        return "регистрация контрагента";
      case RaiToolName.CreateCounterpartyRelation:
        return "создание связи контрагентов";
      case RaiToolName.CreateCrmAccount:
        return "создание CRM-аккаунта";
      case RaiToolName.UpdateCrmAccount:
        return "обновление профиля аккаунта";
      case RaiToolName.CreateCrmContact:
        return "создание контакта";
      case RaiToolName.UpdateCrmContact:
        return "обновление контакта";
      case RaiToolName.DeleteCrmContact:
        return "удаление контакта";
      case RaiToolName.CreateCrmInteraction:
        return "создание взаимодействия";
      case RaiToolName.UpdateCrmInteraction:
        return "обновление взаимодействия";
      case RaiToolName.DeleteCrmInteraction:
        return "удаление взаимодействия";
      case RaiToolName.CreateCrmObligation:
        return "создание обязательства";
      case RaiToolName.UpdateCrmObligation:
        return "обновление обязательства";
      case RaiToolName.DeleteCrmObligation:
        return "удаление обязательства";
      default:
        return toolName;
    }
  }

  private summarizeBlockedToolResult(
    tool: { name: RaiToolName; result: unknown },
  ): string | null {
    if (this.isRiskPolicyBlockedResult(tool.result)) {
      const actionId =
        typeof tool.result.actionId === "string" && tool.result.actionId.length > 0
          ? ` PendingAction #${tool.result.actionId}.`
          : "";
      return `Действие "${this.buildToolDisplayName(tool.name)}" ожидает подтверждения.${actionId}`;
    }

    if (this.isAgentConfigBlockedResult(tool.result)) {
      return `Действие "${this.buildToolDisplayName(tool.name)}" заблокировано конфигурацией агента.`;
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

    let text = `Принял: ${request.message}`;
    if (executionResult.executedTools.length > 0) {
      const toolSummary = this.summarizeExecutedTools(executionResult.executedTools);
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
    const widgets = this.widgetBuilder.build({
      companyId,
      workspaceContext: request.workspaceContext,
    });
    const clarificationPayload = this.buildClarificationPayload(
      request,
      executionResult,
    );
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
      suggestedActions: this.buildSuggestedActions(request),
      openUiToken: undefined,
      advisory: externalSignalResult.advisory,
      memoryUsed: this.buildMemoryUsed(profile, recall),
      evidence: evidence.length > 0 ? evidence : undefined,
      runtimeBudget: executionResult.runtimeBudget,
      agentRole: executionResult.agentExecution?.role,
      fallbackUsed: executionResult.agentExecution?.fallbackUsed,
      validation: executionResult.agentExecution?.validation,
      outputContractVersion: executionResult.agentExecution?.outputContractVersion,
      pendingClarification: clarificationPayload?.pendingClarification,
      workWindows: clarificationPayload?.workWindows ?? richOutputPayload?.workWindows,
      activeWindowId:
        clarificationPayload?.activeWindowId ?? richOutputPayload?.activeWindowId,
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
                    value: this.buildToolDisplayName(explicitCrmTool.name),
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

    if (agentExecution && agentExecution.status !== "COMPLETED") {
      return null;
    }

    const sections = this.buildCrmSections(intent, data);
    const summary = this.buildCrmSummary(intent, data, agentExecution?.text ?? "CRM-операция выполнена.");

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
        title: this.buildCrmTitle(intent),
        status: "completed",
        payload: {
          intentId: intent,
          summary,
          missingKeys: [],
          sections,
        },
        actions: this.buildCrmActions(intent, data, crmWindowId),
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
          summary: this.buildCrmNextStepSummary(intent),
          missingKeys: [],
          signalItems: [
            {
              id: `${nextStepWindowId}-signal`,
              tone: "info",
              text: this.buildCrmNextStepSummary(intent),
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
            label: "Перейти в CRM",
            enabled: true,
            targetRoute: "/consulting/crm",
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

  private buildCrmTitle(intent: string): string {
    switch (intent) {
      case "register_counterparty":
        return "Контрагент зарегистрирован";
      case "create_counterparty_relation":
        return "Связь контрагентов создана";
      case "create_crm_account":
        return "CRM-аккаунт создан";
      case "review_account_workspace":
        return "Рабочее пространство аккаунта";
      case "update_account_profile":
        return "Профиль аккаунта обновлён";
      case "create_crm_contact":
        return "Контакт создан";
      case "update_crm_contact":
        return "Контакт обновлён";
      case "delete_crm_contact":
        return "Контакт удалён";
      case "log_crm_interaction":
        return "CRM-взаимодействие сохранено";
      case "update_crm_interaction":
        return "CRM-взаимодействие обновлено";
      case "delete_crm_interaction":
        return "CRM-взаимодействие удалено";
      case "create_crm_obligation":
        return "Обязательство создано";
      case "update_crm_obligation":
        return "Обязательство обновлено";
      case "delete_crm_obligation":
        return "Обязательство удалено";
      default:
        return "Результат CRM-агента";
    }
  }

  private buildCrmSummary(intent: string, data: unknown, fallbackText: string): string {
    if (intent === "register_counterparty") {
      const result = data as RegisterCounterpartyResult;
      return result.alreadyExisted
        ? `Контрагент уже был в реестре: ${result.legalName}.`
        : `Создана карточка контрагента ${result.legalName}.`;
    }
    if (intent === "create_counterparty_relation") {
      const result = data as CreateCounterpartyRelationResult;
      return `Создана связь ${result.fromPartyId} -> ${result.toPartyId}.`;
    }
    if (intent === "create_crm_account") {
      const result = data as CreateCrmAccountResult;
      return `Создан CRM-аккаунт ${result.name}.`;
    }
    if (intent === "review_account_workspace") {
      const result = data as GetCrmAccountWorkspaceResult;
      const account = result.account as Record<string, unknown>;
      return `Карточка ${String(account?.name ?? account?.id ?? "клиента")} загружена.`;
    }
    if (intent === "update_account_profile") {
      const result = data as UpdateCrmAccountResult;
      return `Профиль аккаунта ${result.accountId} обновлён.`;
    }
    if (intent === "create_crm_contact") {
      const result = data as CreateCrmContactResult;
      return `Контакт ${result.firstName}${result.lastName ? ` ${result.lastName}` : ""} создан.`;
    }
    if (intent === "update_crm_contact") {
      const result = data as UpdateCrmContactResult;
      return `Контакт ${result.contactId} обновлён.`;
    }
    if (intent === "delete_crm_contact") {
      const result = data as DeleteCrmContactResult;
      return `Контакт ${result.contactId} удалён.`;
    }
    if (intent === "log_crm_interaction") {
      const result = data as CreateCrmInteractionResult;
      return `Взаимодействие ${result.interactionId} сохранено.`;
    }
    if (intent === "update_crm_interaction") {
      const result = data as UpdateCrmInteractionResult;
      return `Взаимодействие ${result.interactionId} обновлено.`;
    }
    if (intent === "delete_crm_interaction") {
      const result = data as DeleteCrmInteractionResult;
      return `Взаимодействие ${result.interactionId} удалено.`;
    }
    if (intent === "create_crm_obligation") {
      const result = data as CreateCrmObligationResult;
      return `Обязательство ${result.obligationId} поставлено в работу.`;
    }
    if (intent === "update_crm_obligation") {
      const result = data as UpdateCrmObligationResult;
      return `Обязательство ${result.obligationId} обновлено.`;
    }
    if (intent === "delete_crm_obligation") {
      const result = data as DeleteCrmObligationResult;
      return `Обязательство ${result.obligationId} удалено.`;
    }
    return fallbackText;
  }

  private buildCrmSections(
    intent: string,
    data: unknown,
  ): Array<{
    id: string;
    title: string;
    items: Array<{
      label: string;
      value: string;
      tone?: "neutral" | "positive" | "warning" | "critical";
    }>;
  }> {
    if (intent === "register_counterparty") {
      const result = data as RegisterCounterpartyResult;
      return [
        {
          id: "crm_counterparty_registration",
          title: "Карточка",
          items: [
            { label: "Контрагент", value: result.legalName, tone: "positive" },
            { label: "ID", value: result.partyId, tone: "neutral" },
            { label: "ИНН", value: result.inn ?? "не указан", tone: "neutral" },
            { label: "Источник", value: result.source, tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "create_counterparty_relation") {
      const result = data as CreateCounterpartyRelationResult;
      return [
        {
          id: "crm_relation",
          title: "Связь",
          items: [
            { label: "Источник", value: result.fromPartyId, tone: "neutral" },
            { label: "Целевой контрагент", value: result.toPartyId, tone: "neutral" },
            { label: "Тип", value: result.relationType, tone: "positive" },
            { label: "Действует с", value: result.validFrom, tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "create_crm_account") {
      const result = data as CreateCrmAccountResult;
      return [
        {
          id: "crm_account_create",
          title: "Новая карточка",
          items: [
            { label: "Аккаунт", value: result.name, tone: "positive" },
            { label: "ID", value: result.accountId, tone: "neutral" },
            { label: "ИНН", value: result.inn ?? "не указан", tone: "neutral" },
            { label: "Статус", value: result.status ?? "не указан", tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "review_account_workspace") {
      const result = data as GetCrmAccountWorkspaceResult;
      return [
        {
          id: "crm_workspace_summary",
          title: "Сводка",
          items: [
            {
              label: "Контакты",
              value: `${result.contacts.length}`,
              tone: result.contacts.length > 0 ? "positive" : "warning",
            },
            {
              label: "Взаимодействия",
              value: `${result.interactions.length}`,
              tone: result.interactions.length > 0 ? "positive" : "neutral",
            },
            {
              label: "Обязательства",
              value: `${result.obligations.length}`,
              tone: result.obligations.length > 0 ? "warning" : "neutral",
            },
            {
              label: "Риски",
              value: `${result.risks.length}`,
              tone: result.risks.length > 0 ? "critical" : "neutral",
            },
          ],
        },
      ];
    }
    if (intent === "update_account_profile") {
      const result = data as UpdateCrmAccountResult;
      return [
        {
          id: "crm_account_update",
          title: "Изменения",
          items: [
            { label: "Аккаунт", value: result.accountId, tone: "neutral" },
            { label: "Статус", value: result.status ?? "без изменений", tone: "neutral" },
            { label: "Риск", value: result.riskCategory ?? "без изменений", tone: "warning" },
            { label: "Стратегическая ценность", value: result.strategicValue ?? "без изменений", tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "create_crm_contact") {
      const result = data as CreateCrmContactResult;
      return [
        {
          id: "crm_contact_create",
          title: "Контакт",
          items: [
            { label: "ID", value: result.contactId, tone: "neutral" },
            { label: "Имя", value: `${result.firstName}${result.lastName ? ` ${result.lastName}` : ""}`, tone: "positive" },
            { label: "Роль", value: result.role ?? "не указана", tone: "neutral" },
            { label: "Email", value: result.email ?? "не указан", tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "update_crm_contact") {
      const result = data as UpdateCrmContactResult;
      return [
        {
          id: "crm_contact_update",
          title: "Контакт",
          items: [
            { label: "ID", value: result.contactId, tone: "neutral" },
            { label: "Имя", value: `${result.firstName}${result.lastName ? ` ${result.lastName}` : ""}`, tone: "positive" },
            { label: "Роль", value: result.role ?? "без изменений", tone: "neutral" },
            { label: "Телефон", value: result.phone ?? "не указан", tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "delete_crm_contact") {
      const result = data as DeleteCrmContactResult;
      return [
        {
          id: "crm_contact_delete",
          title: "Удаление",
          items: [
            { label: "Контакт", value: result.contactId, tone: "warning" },
            { label: "Статус", value: "Удалён", tone: "critical" },
          ],
        },
      ];
    }
    if (intent === "log_crm_interaction") {
      const result = data as CreateCrmInteractionResult;
      return [
        {
          id: "crm_interaction",
          title: "Взаимодействие",
          items: [
            { label: "ID", value: result.interactionId, tone: "neutral" },
            { label: "Тип", value: result.type, tone: "positive" },
            { label: "Дата", value: result.date, tone: "neutral" },
            { label: "Сводка", value: result.summary, tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "update_crm_interaction") {
      const result = data as UpdateCrmInteractionResult;
      return [
        {
          id: "crm_interaction_update",
          title: "Взаимодействие",
          items: [
            { label: "ID", value: result.interactionId, tone: "neutral" },
            { label: "Тип", value: result.type, tone: "positive" },
            { label: "Дата", value: result.date, tone: "neutral" },
            { label: "Сводка", value: result.summary, tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "delete_crm_interaction") {
      const result = data as DeleteCrmInteractionResult;
      return [
        {
          id: "crm_interaction_delete",
          title: "Удаление",
          items: [
            { label: "Взаимодействие", value: result.interactionId, tone: "warning" },
            { label: "Статус", value: "Удалено", tone: "critical" },
          ],
        },
      ];
    }
    if (intent === "create_crm_obligation") {
      const result = data as CreateCrmObligationResult;
      return [
        {
          id: "crm_obligation",
          title: "Обязательство",
          items: [
            { label: "ID", value: result.obligationId, tone: "neutral" },
            { label: "Срок", value: result.dueDate, tone: "warning" },
            { label: "Статус", value: result.status, tone: "neutral" },
            { label: "Описание", value: result.description, tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "update_crm_obligation") {
      const result = data as UpdateCrmObligationResult;
      return [
        {
          id: "crm_obligation_update",
          title: "Обязательство",
          items: [
            { label: "ID", value: result.obligationId, tone: "neutral" },
            { label: "Срок", value: result.dueDate, tone: "warning" },
            { label: "Статус", value: result.status, tone: "neutral" },
            { label: "Описание", value: result.description, tone: "neutral" },
          ],
        },
      ];
    }
    if (intent === "delete_crm_obligation") {
      const result = data as DeleteCrmObligationResult;
      return [
        {
          id: "crm_obligation_delete",
          title: "Удаление",
          items: [
            { label: "Обязательство", value: result.obligationId, tone: "warning" },
            { label: "Статус", value: "Удалено", tone: "critical" },
          ],
        },
      ];
    }
    return [];
  }

  private buildCrmActions(
    intent: string,
    data: unknown,
    windowId: string,
  ): RaiWorkWindowDto["actions"] {
    const openPartiesAction = {
      id: "go_parties_registry",
      kind: "open_route" as const,
      label: "Открыть реестр контрагентов",
      enabled: true,
      targetRoute: "/parties",
    };
    const openCrmAction = {
      id: "go_crm_workspace",
      kind: "open_route" as const,
      label: "Открыть CRM",
      enabled: true,
      targetRoute: "/consulting/crm",
    };

    if (intent === "register_counterparty") {
      const result = data as RegisterCounterpartyResult;
      return [
        {
          id: "focus_registered_counterparty",
          kind: "focus_window",
          label: "Открыть результат",
          enabled: true,
          targetWindowId: windowId,
        },
        {
          ...openPartiesAction,
          targetRoute: `/parties/${encodeURIComponent(result.partyId)}`,
          label: "Открыть карточку контрагента",
        },
      ];
    }

    if (intent === "create_crm_account") {
      const result = data as CreateCrmAccountResult;
      return [
        {
          id: "open_created_account",
          kind: "focus_window",
          label: "Открыть результат",
          enabled: true,
          targetWindowId: windowId,
        },
        {
          ...openCrmAction,
          targetRoute: `/crm/accounts/${encodeURIComponent(result.accountId)}`,
          label: "Открыть карточку клиента",
        },
      ];
    }

    return [
      {
        id: "focus_crm_window",
        kind: "focus_window",
        label: "Открыть результат",
        enabled: true,
        targetWindowId: windowId,
      },
      intent === "create_counterparty_relation" ? openPartiesAction : openCrmAction,
    ];
  }

  private buildCrmNextStepSummary(intent: string): string {
    switch (intent) {
      case "register_counterparty":
        return "Проверьте карточку контрагента, связи и реквизиты перед следующими CRM-действиями.";
      case "create_counterparty_relation":
        return "Откройте структуру контрагентов и убедитесь, что связь отражает реальную зависимость.";
      case "create_crm_account":
        return "Откройте новую карточку клиента и проверьте профиль, контакты и следующий шаг продаж.";
      case "review_account_workspace":
        return "Проверьте риски, обязательства и последние взаимодействия перед следующим касанием клиента.";
      case "update_account_profile":
        return "После изменения профиля обновите рабочий контекст и проверьте связанные обязательства.";
      case "create_crm_contact":
        return "Проверьте роль контакта и при необходимости зафиксируйте первое взаимодействие.";
      case "update_crm_contact":
        return "Проверьте, что контактные данные и роль отражают актуальное состояние клиента.";
      case "delete_crm_contact":
        return "Убедитесь, что у клиента остались актуальные контактные лица после удаления.";
      case "log_crm_interaction":
        return "После фиксации взаимодействия при необходимости поставьте follow-up обязательство.";
      case "update_crm_interaction":
        return "Проверьте журнал активностей и убедитесь, что сводка взаимодействия обновлена корректно.";
      case "delete_crm_interaction":
        return "Проверьте таймлайн клиента и убедитесь, что удалено именно ошибочное взаимодействие.";
      case "create_crm_obligation":
        return "Проверьте ответственного и срок, затем откройте CRM для контроля исполнения.";
      case "update_crm_obligation":
        return "После обновления обязательства проверьте срок, статус и ответственного.";
      case "delete_crm_obligation":
        return "Проверьте CRM-карточку и убедитесь, что обязательство больше не требуется.";
      default:
        return "Откройте CRM-контур и проверьте результат операции.";
    }
  }

  buildSuggestedActions(request: RaiChatRequestDto): RaiSuggestedAction[] {
    const actions: RaiSuggestedAction[] = [
      {
        kind: "tool",
        toolName: RaiToolName.EchoMessage,
        title: "Повторить сообщение",
        payload: { message: request.message },
      },
    ];
    if (request.workspaceContext?.route) {
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
    return actions;
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
    _profile: Record<string, unknown>,
    recall: EpisodicRetrievalResponse,
  ): RaiMemoryUsedDto[] {
    const items: RaiMemoryUsedDto[] = [];
    const top = recall.items[0];
    if (top?.content) {
      items.push({
        kind: "episode",
        label: top.content.slice(0, 80),
        confidence: Number(top.confidence ?? 0),
        source: typeof top.metadata?.source === "string" ? top.metadata.source : "episode",
      });
    }
    return items;
  }

  private summarizeExecutedTools(
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): string | null {
    const parts = executedTools
      .map((tool) => {
        const blockedSummary = this.summarizeBlockedToolResult(tool);
        if (blockedSummary) {
          return blockedSummary;
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
          return `CRM-карточка: контактов ${r.contacts.length}, обязательств ${r.obligations.length}`;
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
