import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  RaiChatRequestDto,
  RaiChatResponseDto,
  RaiMemoryUsedDto,
  RaiToolCallDto,
} from "./dto/rai-chat.dto";
import {
  RaiSuggestedAction,
  RaiToolActorContext,
  RaiToolName,
  ComputeDeviationsResult,
  ComputePlanFactResult,
  EmitAlertsResult,
  GenerateTechMapDraftResult,
} from "./tools/rai-tools.types";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { MemoryAdapter } from "../../shared/memory/memory-adapter.interface";
import { buildTextEmbedding } from "../../shared/memory/signal-embedding.util";
import { getRaiChatMemoryConfig } from "../../shared/memory/rai-chat-memory.config";
import {
  sanitizeChatTextForMemory,
  withTimeout,
} from "../../shared/memory/rai-chat-memory.util";
import { ExternalSignalsService } from "./external-signals.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class SupervisorAgent {
  private readonly logger = new Logger(SupervisorAgent.name);

  constructor(
    private readonly toolsRegistry: RaiToolsRegistry,
    private readonly intentRouter: IntentRouterService,
    private readonly agronomAgent: AgronomAgent,
    @Inject("MEMORY_ADAPTER")
    private readonly memoryAdapter: MemoryAdapter,
    private readonly externalSignalsService: ExternalSignalsService,
    private readonly widgetBuilder: RaiChatWidgetBuilder,
    private readonly prisma: PrismaService,
  ) {}

  async orchestrate(
    request: RaiChatRequestDto,
    companyId: string,
    userId?: string,
  ): Promise<RaiChatResponseDto> {
    const memoryConfig = getRaiChatMemoryConfig();
    const traceId = request.clientTraceId || `tr_${randomUUID()}`;
    const threadId = request.threadId || `th_${randomUUID()}`;
    const actorContext: RaiToolActorContext = {
      companyId,
      traceId,
    };
    const profile = await this.memoryAdapter.getProfile({
      companyId,
      traceId,
      userId,
    });

    const classification = this.intentRouter.classify(
      request.message,
      request.workspaceContext,
    );
    const autoToolCall = this.intentRouter.buildAutoToolCall(
      request.message,
      request,
      classification,
    );
    const requestedToolCalls: RaiToolCallDto[] = [...(request.toolCalls ?? [])];
    if (
      autoToolCall &&
      !requestedToolCalls.some((tool) => tool.name === autoToolCall.name)
    ) {
      requestedToolCalls.unshift({
        name: autoToolCall.name,
        payload: autoToolCall.payload as Record<string, unknown>,
      });
    }

    const executedTools = await this.executeToolCalls(
      requestedToolCalls,
      actorContext,
    );

    const embedding = buildTextEmbedding(request.message);

    const recallStartedAt = Date.now();
    const memoryContext = await withTimeout(
      this.memoryAdapter.retrieve(
        { companyId, traceId },
        embedding,
        {
          limit: memoryConfig.recallLimit,
          minSimilarity: memoryConfig.minSimilarity,
        },
      ),
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

    const externalSignalResult = await this.externalSignalsService.process({
      companyId,
      traceId,
      threadId,
      userId,
      signals: request.externalSignals,
      feedback: request.advisoryFeedback,
    });

    let text = `Принял: ${request.message}`;
    if (request.workspaceContext?.route) {
      text += `\nroute: ${request.workspaceContext.route}`;
    }

    if (executedTools.length > 0) {
      text += `\nИнструментов выполнено: ${executedTools.length}`;
      const toolSummary = this.summarizeExecutedTools(executedTools);
      if (toolSummary) {
        text += `\n${toolSummary}`;
      }
    }

    if (memoryContext.items.length > 0) {
      const topMatch = memoryContext.items[0];
      text += `\n(Контекст из памяти: "${topMatch.content.slice(0, 50)}...", sim: ${topMatch.similarity.toFixed(2)})`;
    }

    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) {
      text += `\n(Профиль: ${profileSummary})`;
    }

    if (externalSignalResult.advisory) {
      text += `\nAdvisory: ${externalSignalResult.advisory.recommendation} — ${externalSignalResult.advisory.summary}`;
    }

    if (externalSignalResult.feedbackStored) {
      text += "\nFeedback по advisory записан в память.";
    }

    const response: RaiChatResponseDto = {
      text,
      widgets: this.widgetBuilder.build({
        companyId,
        workspaceContext: request.workspaceContext,
      }),
      toolCalls: executedTools.map((tool) => ({
        name: tool.name,
        payload:
          tool.result && typeof tool.result === "object"
            ? (tool.result as Record<string, unknown>)
            : { result: tool.result ?? null },
      })),
      traceId,
      threadId,
      suggestedActions: this.buildSuggestedActions(request),
      openUiToken: undefined,
      advisory: externalSignalResult.advisory,
      memoryUsed: this.buildMemoryUsed(profile, memoryContext),
    };

    void this.writeAiAuditEntry({
      companyId,
      traceId,
      toolNames: executedTools.map((t) => t.name),
      intentMethod: classification.method,
    });

    const sanitized = sanitizeChatTextForMemory(request.message, memoryConfig);
    if (sanitized.ok === false) {
      this.logger.debug(
        `memory_append status=skipped reason=${sanitized.reason} companyId=${companyId} traceId=${traceId}`,
      );
      return response;
    }

    void this.memoryAdapter
      .appendInteraction(
        {
          companyId,
          traceId,
          sessionId: threadId,
          userId,
          metadata: {
            route: request.workspaceContext?.route,
          },
        },
        {
          userMessage: sanitized.value,
          agentResponse: response.text,
          embedding,
        },
      )
      .then(() => {
        this.logger.debug(
          `memory_append_interaction status=ok companyId=${companyId} traceId=${traceId} chars=${sanitized.value.length}`,
        );
      })
      .catch((err) => {
        this.logger.warn(
          `memory_append_interaction status=error companyId=${companyId} traceId=${traceId} message=${String(
            err?.message ?? err,
          )}`,
        );
      });

    void this.memoryAdapter
      .updateProfile(
        {
          companyId,
          traceId,
          userId,
        },
        {
          lastRoute: request.workspaceContext?.route ?? null,
          lastMessagePreview: sanitized.value.slice(0, 160),
          lastInteractionAt: new Date().toISOString(),
        },
      )
      .catch((err) => {
        this.logger.warn(
          `memory_profile_update status=error companyId=${companyId} traceId=${traceId} message=${String(
            err?.message ?? err,
          )}`,
        );
      });

    return response;
  }

  private writeAiAuditEntry(params: {
    companyId: string;
    traceId: string;
    toolNames: string[];
    intentMethod: string;
  }): void {
    this.prisma.aiAuditEntry
      .create({
        data: {
          traceId: params.traceId,
          companyId: params.companyId,
          toolNames: params.toolNames,
          model: "deterministic",
          intentMethod: params.intentMethod,
          tokensUsed: 0,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `ai_audit_entry create failed traceId=${params.traceId} err=${String(err?.message ?? err)}`,
        ),
      );
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

    const parts = [lastRoute ? `lastRoute=${lastRoute}` : null, lastMessagePreview ? `lastMessage=${lastMessagePreview}` : null].filter(Boolean);
    return parts.length > 0 ? parts.join("; ") : null;
  }

  private buildMemoryUsed(
    profile: Record<string, unknown>,
    memoryContext: {
      items: Array<{
        content: string;
        confidence: number;
        metadata: Record<string, unknown>;
      }>;
    },
  ): RaiMemoryUsedDto[] {
    const items: RaiMemoryUsedDto[] = [];

    const topEpisode = memoryContext.items[0];
    if (topEpisode && topEpisode.content) {
      items.push({
        kind: "episode",
        label: topEpisode.content.slice(0, 80),
        confidence: Number(topEpisode.confidence ?? 0),
        source:
          typeof topEpisode.metadata?.source === "string"
            ? topEpisode.metadata.source
            : "episode",
      });
    }

    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) {
      items.push({
        kind: "profile",
        label: profileSummary,
        confidence:
          typeof profile.confidence === "number"
            ? Number(profile.confidence)
            : 0.8,
        source:
          typeof profile.provenance === "string" ? profile.provenance : "profile",
      });
    }

    return items;
  }

  private async executeToolCalls(
    toolCalls: RaiToolCallDto[],
    actorContext: RaiToolActorContext,
  ): Promise<Array<{ name: RaiToolName; result: unknown }>> {
    const results: Array<{ name: RaiToolName; result: unknown }> = [];

    for (const toolCall of toolCalls) {
      if (
        toolCall.name === RaiToolName.GenerateTechMapDraft ||
        toolCall.name === RaiToolName.ComputeDeviations
      ) {
        const payload = toolCall.payload as Record<string, unknown>;
        const scope = payload?.scope as { seasonId?: string; fieldId?: string } | undefined;
        const agentResult = await this.agronomAgent.run({
          companyId: actorContext.companyId,
          traceId: actorContext.traceId,
          intent: toolCall.name === RaiToolName.GenerateTechMapDraft ? "generate_tech_map_draft" : "compute_deviations",
          fieldRef: typeof payload?.fieldRef === "string" ? payload.fieldRef : undefined,
          seasonRef: typeof payload?.seasonRef === "string" ? payload.seasonRef : undefined,
          crop: payload?.crop === "sunflower" ? "sunflower" : "rapeseed",
          scope,
        });
        results.push({ name: toolCall.name, result: agentResult });
        continue;
      }
      const result = await this.toolsRegistry.execute(
        toolCall.name,
        toolCall.payload,
        actorContext,
      );
      results.push({ name: toolCall.name, result });
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

  private summarizeExecutedTools(
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): string | null {
    const parts = executedTools
      .map((tool) => {
        if (tool.name === RaiToolName.ComputeDeviations) {
          const result = tool.result as ComputeDeviationsResult & { explain?: string; agentName?: string };
          if (result.agentName === "AgronomAgent" && result.explain) {
            return result.explain;
          }
          return `Отклонений найдено: ${result.count}`;
        }

        if (tool.name === RaiToolName.ComputePlanFact) {
          const result = tool.result as ComputePlanFactResult;
          return `План-факт по плану ${result.planId}: ROI ${result.roi}, EBITDA ${result.ebitda}`;
        }

        if (tool.name === RaiToolName.EmitAlerts) {
          const result = tool.result as EmitAlertsResult;
          return `Открытых эскалаций ${result.severity}+ : ${result.count}`;
        }

        if (tool.name === RaiToolName.GenerateTechMapDraft) {
          const result = tool.result as GenerateTechMapDraftResult & { explain?: string; agentName?: string };
          if (result.agentName === "AgronomAgent" && result.explain) {
            return result.explain;
          }
          return `Черновик техкарты создан: ${(result as GenerateTechMapDraftResult).draftId}`;
        }

        return null;
      })
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join("\n") : null;
  }
}
