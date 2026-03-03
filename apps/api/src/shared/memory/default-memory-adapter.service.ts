import { Injectable, Logger } from "@nestjs/common";
import {
    MemoryAdapter,
    MemoryContext,
    MemoryInteraction,
    MemoryRetrieveOptions,
} from "./memory-adapter.interface";
import { MemoryManager } from "./memory-manager.service";
import {
    EpisodicRetrievalResponse,
    EpisodicRetrievalService,
} from "./episodic-retrieval.service";
import { RaiChatMemoryPolicy } from "./rai-chat-memory.policy";

@Injectable()
export class DefaultMemoryAdapter implements MemoryAdapter {
    private readonly logger = new Logger(DefaultMemoryAdapter.name);

    constructor(
        private readonly memoryManager: MemoryManager,
        private readonly episodicRetrieval: EpisodicRetrievalService,
    ) { }

    async appendInteraction(
        ctx: MemoryContext,
        interaction: MemoryInteraction,
    ): Promise<void> {
        const { companyId, traceId, sessionId, metadata } = ctx;

        try {
            await this.memoryManager.store(
                interaction.userMessage,
                interaction.embedding,
                {
                    companyId,
                    traceId,
                    sessionId,
                    source: (metadata?.source as string) || "rai-chat",
                    memoryType: (metadata?.memoryType as string) || "EPISODIC",
                    metadata: {
                        ...metadata,
                        agentResponse: interaction.agentResponse.slice(0, 500), // Сохраняем кусок ответа для контекста
                    },
                },
                RaiChatMemoryPolicy,
            );

            this.logger.debug(
                `memory_interaction_appended companyId=${companyId} traceId=${traceId}`,
            );
        } catch (err) {
            this.logger.warn(
                `memory_interaction_append_error companyId=${companyId} traceId=${traceId} message=${String(
                    err?.message ?? err,
                )}`,
            );
        }
    }

    async retrieve(
        ctx: MemoryContext,
        embedding: number[],
        options: MemoryRetrieveOptions,
    ): Promise<EpisodicRetrievalResponse> {
        const { companyId, traceId } = ctx;

        try {
            return await this.episodicRetrieval.retrieve({
                companyId,
                embedding,
                traceId,
                limit: options.limit,
                minSimilarity: options.minSimilarity,
            });
        } catch (err) {
            this.logger.warn(
                `memory_retrieve_error companyId=${companyId} traceId=${traceId} message=${String(
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
        }
    }

    async getProfile(ctx: MemoryContext): Promise<Record<string, unknown>> {
        this.logger.debug(
            `get_profile_stub companyId=${ctx.companyId} traceId=${ctx.traceId}`,
        );
        return {};
    }

    async updateProfile(
        ctx: MemoryContext,
        patch: Record<string, unknown>,
    ): Promise<void> {
        this.logger.debug(
            `update_profile_stub companyId=${ctx.companyId} traceId=${ctx.traceId}`,
        );
    }
}
