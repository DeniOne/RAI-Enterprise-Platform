import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
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
import { EngramService } from "../../../shared/memory/engram.service";
import { RankedEngram } from "../../../shared/memory/engram.types";
import { WorkingMemoryService, ActiveAlert, HotEngramEntry } from "../../../shared/memory/working-memory.service";

export interface RecallResult {
  recall: EpisodicRetrievalResponse;
  profile: Record<string, unknown>;
  /** L4: Релевантные энграммы (когнитивная память) */
  engrams: RankedEngram[];
  /** L1: Горячие энграммы из Redis-кеша */
  hotEngrams: HotEngramEntry[];
  /** L1: Активные алерты */
  activeAlerts: ActiveAlert[];
}

@Injectable()
export class MemoryCoordinatorService {
  private readonly logger = new Logger(MemoryCoordinatorService.name);

  constructor(
    @Inject("MEMORY_ADAPTER")
    private readonly memoryAdapter: MemoryAdapter,
    @Optional() private readonly engramService?: EngramService,
    @Optional() private readonly workingMemoryService?: WorkingMemoryService,
  ) { }

  async recallContext(
    request: RaiChatRequestDto,
    actorContext: RaiToolActorContext,
    userId?: string,
  ): Promise<RecallResult> {
    const config = getRaiChatMemoryConfig();
    const embedding = buildTextEmbedding(request.message);
    const { companyId, traceId } = actorContext;

    // Параллельный recall из ВСЕХ доступных слоёв памяти
    const [profile, recall, engrams, l1Context] = await Promise.all([
      // L5: Profile
      this.memoryAdapter.getProfile({
        companyId,
        traceId,
        userId,
      }),

      // L2: Episodic recall
      withTimeout(
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
          `memory_recall_l2 status=error companyId=${companyId} traceId=${traceId} message=${String(err?.message ?? err)}`,
        );
        return {
          traceId,
          total: 0,
          positive: 0,
          negative: 0,
          unknown: 0,
          items: [],
        };
      }),

      // L4: Engram recall (когнитивная память)
      this.engramService
        ? this.engramService
          .recallEngrams({
            companyId,
            embedding,
            limit: 3,
            minSimilarity: 0.65,
          })
          .catch((err) => {
            this.logger.warn(
              `memory_recall_l4 status=error companyId=${companyId} traceId=${traceId} message=${String(err?.message ?? err)}`,
            );
            return [] as RankedEngram[];
          })
        : ([] as RankedEngram[]),

      // L1: Working Memory + Alerts + Hot Engrams
      this.workingMemoryService
        ? this.workingMemoryService
          .getFullAgentContext(
            request.threadId ?? traceId,
            companyId,
          )
          .catch(() => ({
            workingMemory: null,
            activeAlerts: [] as ActiveAlert[],
            hotEngrams: [] as HotEngramEntry[],
          }))
        : {
          workingMemory: null,
          activeAlerts: [] as ActiveAlert[],
          hotEngrams: [] as HotEngramEntry[],
        },
    ]);

    // L4→L1 promotion: горячие энграммы в Redis
    if (this.workingMemoryService && engrams.length > 0) {
      for (const engram of engrams.slice(0, 3)) {
        void this.workingMemoryService
          .promoteEngram(companyId, {
            engramId: engram.id,
            compositeScore: engram.compositeScore,
            category: engram.category,
            contentPreview: engram.content.slice(0, 200),
            activationCount: engram.activationCount,
            promotedAt: new Date().toISOString(),
          })
          .catch(() => { });
      }
    }

    this.logger.debug(
      `memory_recall_full companyId=${companyId} traceId=${traceId} episodes=${recall.items.length} engrams=${engrams.length} hot=${l1Context.hotEngrams.length} alerts=${l1Context.activeAlerts.length}`,
    );

    return {
      recall,
      profile,
      engrams,
      hotEngrams: l1Context.hotEngrams,
      activeAlerts: l1Context.activeAlerts,
    };
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

    // L1: обновить Working Memory
    if (this.workingMemoryService) {
      void this.workingMemoryService
        .setWorkingMemory(threadId, {
          sessionId: threadId,
          agentRole: 'supervisor',
          currentTask: sanitized.value.slice(0, 100),
          activeContext: {},
          recentToolResults: [],
        })
        .catch(() => { });
    }
  }
}
