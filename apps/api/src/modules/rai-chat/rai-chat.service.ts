import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  RaiChatRequestDto,
  RaiChatResponseDto,
  RaiToolCallDto,
} from "./dto/rai-chat.dto";
import {
  RaiSuggestedAction,
  RaiToolActorContext,
  RaiToolName,
} from "./tools/rai-tools.types";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidget,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";
import { MemoryManager } from "../../shared/memory/memory-manager.service";
import { EpisodicRetrievalService } from "../../shared/memory/episodic-retrieval.service";
import { buildTextEmbedding } from "../../shared/memory/signal-embedding.util";
import { getRaiChatMemoryConfig } from "../../shared/memory/rai-chat-memory.config";
import {
  sanitizeChatTextForMemory,
  withTimeout,
} from "../../shared/memory/rai-chat-memory.util";
import { RaiChatMemoryPolicy } from "../../shared/memory/rai-chat-memory.policy";

@Injectable()
export class RaiChatService {
  private readonly logger = new Logger(RaiChatService.name);

  constructor(
    private readonly toolsRegistry: RaiToolsRegistry,
    private readonly memoryManager: MemoryManager,
    private readonly episodicRetrieval: EpisodicRetrievalService,
  ) { }

  async handleChat(
    request: RaiChatRequestDto,
    companyId: string,
  ): Promise<RaiChatResponseDto> {
    const memoryConfig = getRaiChatMemoryConfig();
    const traceId = request.clientTraceId || `tr_${randomUUID()}`;
    const threadId = request.threadId || `th_${randomUUID()}`;
    const actorContext: RaiToolActorContext = {
      companyId,
      traceId,
    };

    const executedTools = await this.executeToolCalls(
      request.toolCalls ?? [],
      actorContext,
    );

    const embedding = buildTextEmbedding(request.message);

    const recallStartedAt = Date.now();
    const memoryContext = await withTimeout(
      this.episodicRetrieval.retrieve({
        companyId,
        embedding,
        traceId,
        limit: memoryConfig.recallLimit,
        minSimilarity: memoryConfig.minSimilarity,
      }),
      memoryConfig.recallTimeoutMs,
      () => ({
        traceId,
        total: 0,
        positive: 0,
        negative: 0,
        unknown: 0,
        items: [],
      }),
    ).catch((err) => {
      this.logger.warn(
        `memory_recall status=error companyId=${companyId} traceId=${traceId} message=${String(
          err?.message ?? err,
        )}`,
      );
      return {
        traceId,
        total: 0,
        positive: 0,
        negative: 0,
        unknown: 0,
        items: [],
      };
    });

    const recallMs = Date.now() - recallStartedAt;
    this.logger.debug(
      `memory_recall status=${memoryContext.items.length ? "hit" : "miss"} companyId=${companyId} traceId=${traceId} ms=${recallMs} topK=${memoryConfig.recallLimit} minSim=${memoryConfig.minSimilarity}`,
    );

    let text = `Принял: ${request.message}`;
    if (request.workspaceContext?.route) {
      text += `\nroute: ${request.workspaceContext.route}`;
    }

    if (executedTools.length > 0) {
      text += `\nИнструментов выполнено: ${executedTools.length}`;
    }

    if (memoryContext.items.length > 0) {
      const topMatch = memoryContext.items[0];
      text += `\n(Контекст из памяти: "${topMatch.content.slice(0, 50)}...", sim: ${topMatch.similarity.toFixed(2)})`;
    }

    const response: RaiChatResponseDto = {
      text,
      widgets: this.buildWidgets(request, companyId),
      traceId,
      threadId,
      suggestedActions: this.buildSuggestedActions(request),
    };

    const sanitized = sanitizeChatTextForMemory(request.message, memoryConfig);
    if (sanitized.ok === false) {
      this.logger.debug(
        `memory_append status=skipped reason=${sanitized.reason} companyId=${companyId} traceId=${traceId}`,
      );
      return response;
    }

    void this.memoryManager
      .store(
        sanitized.value,
        embedding,
        {
          companyId,
          traceId,
          sessionId: threadId,
          source: "rai-chat",
          memoryType: "EPISODIC",
          metadata: {
            route: request.workspaceContext?.route,
          },
        },
        RaiChatMemoryPolicy,
      )
      .then(() => {
        this.logger.debug(
          `memory_append status=ok companyId=${companyId} traceId=${traceId} chars=${sanitized.value.length}`,
        );
      })
      .catch((err) => {
        this.logger.warn(
          `memory_append status=error companyId=${companyId} traceId=${traceId} message=${String(
            err?.message ?? err,
          )}`,
        );
      });

    return response;
  }

  private async executeToolCalls(
    toolCalls: RaiToolCallDto[],
    actorContext: RaiToolActorContext,
  ): Promise<Array<{ name: RaiToolName; result: unknown }>> {
    const results: Array<{ name: RaiToolName; result: unknown }> = [];

    for (const toolCall of toolCalls) {
      const result = await this.toolsRegistry.execute(
        toolCall.name,
        toolCall.payload,
        actorContext,
      );
      results.push({
        name: toolCall.name,
        result,
      });
    }

    return results;
  }

  private buildSuggestedActions(
    request: RaiChatRequestDto,
  ): RaiSuggestedAction[] {
    const actions: RaiSuggestedAction[] = [
      {
        kind: "tool",
        toolName: RaiToolName.EchoMessage,
        title: "Повторить сообщение",
        payload: {
          message: request.message,
        },
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

  private buildWidgets(
    request: RaiChatRequestDto,
    companyId: string,
  ): RaiChatWidget[] {
    const route = request.workspaceContext?.route ?? "/unknown";
    const routeSuffix = route.split("/").filter(Boolean).at(-1) ?? "workspace";
    const companyMarker = companyId.slice(-4).toUpperCase();

    return [
      {
        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
        type: RaiChatWidgetType.DeviationList,
        version: 1,
        payload: {
          title: "Критические отклонения",
          items: [
            {
              id: `dev-${companyMarker}-1`,
              title: `Просадка выполнения на маршруте ${routeSuffix}`,
              severity: "high",
              fieldLabel: "Поле Север-12",
              status: "open",
            },
            {
              id: `dev-${companyMarker}-2`,
              title: "Рост операционного риска по задаче опрыскивания",
              severity: "medium",
              fieldLabel: "Поле Восток-04",
              status: "watch",
            },
          ],
        },
      },
      {
        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
        type: RaiChatWidgetType.TaskBacklog,
        version: 1,
        payload: {
          title: "Бэклог задач на сегодня",
          items: [
            {
              id: `task-${companyMarker}-1`,
              title: `Проверить контур ${routeSuffix}`,
              dueLabel: "Сегодня, 14:00",
              ownerLabel: "Операционный штаб",
              status: "queued",
            },
            {
              id: `task-${companyMarker}-2`,
              title: "Подтвердить пакет действий по отклонениям",
              dueLabel: "Сегодня, 16:30",
              ownerLabel: "Куратор участка",
              status: "in_progress",
            },
          ],
        },
      },
    ];
  }
}
