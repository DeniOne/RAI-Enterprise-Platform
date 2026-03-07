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
    if (request.workspaceContext?.route) {
      text += `\nroute: ${request.workspaceContext.route}`;
    }
    if (executionResult.executedTools.length > 0) {
      text += `\nИнструментов выполнено: ${executionResult.executedTools.length}`;
      const toolSummary = this.summarizeExecutedTools(executionResult.executedTools);
      if (toolSummary) text += `\n${toolSummary}`;
    }
    if (recall.items.length > 0) {
      const top = recall.items[0];
      text += `\n(Контекст из памяти: "${top.content.slice(0, 50)}...", sim: ${top.similarity.toFixed(2)})`;
    }
    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) text += `\n(Профиль: ${profileSummary})`;
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
    profile: Record<string, unknown>,
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
    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) {
      items.push({
        kind: "profile",
        label: profileSummary,
        confidence: typeof profile.confidence === "number" ? Number(profile.confidence) : 0.8,
        source: typeof profile.provenance === "string" ? profile.provenance : "profile",
      });
    }
    return items;
  }

  private summarizeExecutedTools(
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): string | null {
    const parts = executedTools
      .map((tool) => {
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
