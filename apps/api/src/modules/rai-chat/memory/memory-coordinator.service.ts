import { Inject, Injectable, Logger } from "@nestjs/common";
import { MemoryAdapter } from "../../../shared/memory/memory-adapter.interface";
import { EpisodicRetrievalResponse } from "../../../shared/memory/episodic-retrieval.service";
import { buildTextEmbedding } from "../../../shared/memory/signal-embedding.util";
import { getRaiChatMemoryConfig } from "../../../shared/memory/rai-chat-memory.config";
import {
  sanitizeChatTextForMemory,
  withTimeout,
} from "../../../shared/memory/rai-chat-memory.util";
import { RaiChatRequestDto } from "../dto/rai-chat.dto";
import { RaiToolActorContext } from "../tools/rai-tools.types";

export interface RecallResult {
  recall: EpisodicRetrievalResponse;
  profile: Record<string, unknown>;
}

@Injectable()
export class MemoryCoordinatorService {
  private readonly logger = new Logger(MemoryCoordinatorService.name);

  constructor(
    @Inject("MEMORY_ADAPTER")
    private readonly memoryAdapter: MemoryAdapter,
  ) {}

  async recallContext(
    request: RaiChatRequestDto,
    actorContext: RaiToolActorContext,
    userId?: string,
  ): Promise<RecallResult> {
    const config = getRaiChatMemoryConfig();
    const embedding = buildTextEmbedding(request.message);
    const { companyId, traceId } = actorContext;

    const profile = await this.memoryAdapter.getProfile({
      companyId,
      traceId,
      userId,
    });

    const recallStartedAt = Date.now();
    const recall = await withTimeout(
      this.memoryAdapter.retrieve(
        { companyId, traceId },
        embedding,
        { limit: config.recallLimit, minSimilarity: config.minSimilarity },
      ),
      config.recallTimeoutMs,
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
        `memory_recall status=error companyId=${companyId} traceId=${traceId} message=${String(err?.message ?? err)}`,
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
      `memory_recall status=${recall.items.length ? "hit" : "miss"} companyId=${companyId} traceId=${traceId} ms=${recallMs}`,
    );

    return { recall, profile };
  }

  commitInteraction(
    request: RaiChatRequestDto,
    responseText: string,
    actorContext: RaiToolActorContext,
    threadId: string,
    userId?: string,
  ): void {
    const config = getRaiChatMemoryConfig();
    const { companyId, traceId } = actorContext;
    const sanitized = sanitizeChatTextForMemory(request.message, config);

    if (sanitized.ok === false) {
      this.logger.debug(
        `memory_append status=skipped reason=${sanitized.reason} companyId=${companyId} traceId=${traceId}`,
      );
      return;
    }

    const embedding = buildTextEmbedding(request.message);
    void this.memoryAdapter
      .appendInteraction(
        {
          companyId,
          traceId,
          sessionId: threadId,
          userId,
          metadata: { route: request.workspaceContext?.route },
        },
        {
          userMessage: sanitized.value,
          agentResponse: responseText,
          embedding,
        },
      )
      .then(() =>
        this.logger.debug(
          `memory_append_interaction status=ok companyId=${companyId} traceId=${traceId} chars=${sanitized.value.length}`,
        ),
      )
      .catch((err) =>
        this.logger.warn(
          `memory_append_interaction status=error companyId=${companyId} traceId=${traceId} message=${String(err?.message ?? err)}`,
        ),
      );

    void this.memoryAdapter
      .updateProfile(
        { companyId, traceId, userId },
        {
          lastRoute: request.workspaceContext?.route ?? null,
          lastMessagePreview: sanitized.value.slice(0, 160),
          lastInteractionAt: new Date().toISOString(),
        },
      )
      .catch((err) =>
        this.logger.warn(
          `memory_profile_update status=error companyId=${companyId} traceId=${traceId} message=${String(err?.message ?? err)}`,
        ),
      );
  }
}
