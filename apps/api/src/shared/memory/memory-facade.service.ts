import { Injectable, Logger, Inject } from '@nestjs/common';
import { MemoryAdapter, MemoryContext, MemoryInteraction, MemoryRetrieveOptions } from './memory-adapter.interface';
import { EpisodicRetrievalResponse } from './episodic-retrieval.service';
import { EngramService } from './engram.service';
import {
    WorkingMemoryService,
    WorkingMemorySlot,
    ActiveAlert,
    HotEngramEntry,
    ActiveAgroContext,
} from './working-memory.service';
import {
    EngramCaseStudy,
    EngramRecallContext,
    RankedEngram,
    EngramEvidence,
} from './engram.types';

/**
 * MemoryFacade — единая точка входа для ВСЕХ слоёв когнитивной памяти.
 *
 * Агенты и сервисы работают ТОЛЬКО через фасад.
 * Фасад маршрутизирует запросы на нужный слой:
 *
 *   L1: WorkingMemoryService (Redis, <1ms)
 *   L2: MemoryAdapter (Episodic, vector search)
 *   L4: EngramService (Engrams, cognitive patterns)
 *
 * L3 (Semantic), L5 (Institutional), L6 (Network) — будут подключены позже.
 */

export interface AgentMemoryContext {
    sessionId: string;
    companyId: string;
    traceId: string;
    userId?: string;
    agentRole: string;
    agroContext?: ActiveAgroContext;
}

export interface FullRecallResult {
    /** L2: Эпизоды из episodic memory */
    episodes: EpisodicRetrievalResponse;
    /** L4: Релевантные энграммы */
    engrams: RankedEngram[];
    /** L1: Горячие энграммы из кеша */
    hotEngrams: HotEngramEntry[];
    /** L1: Активные алерты */
    activeAlerts: ActiveAlert[];
    /** L5: Профиль клиента */
    profile: Record<string, unknown>;
    /** L1: Рабочая память */
    workingMemory: WorkingMemorySlot | null;
}

@Injectable()
export class MemoryFacade {
    private readonly logger = new Logger(MemoryFacade.name);

    constructor(
        @Inject('MEMORY_ADAPTER')
        private readonly memoryAdapter: MemoryAdapter,
        private readonly engramService: EngramService,
        private readonly workingMemoryService: WorkingMemoryService,
    ) { }

    // ========================================================================
    // FULL RECALL: собирает контекст из ВСЕХ доступных слоёв
    // ========================================================================

    async fullRecall(
        ctx: AgentMemoryContext,
        embedding: number[],
        options?: { episodeLimit?: number; engramLimit?: number },
    ): Promise<FullRecallResult> {
        const startedAt = Date.now();

        const memCtx: MemoryContext = {
            companyId: ctx.companyId,
            traceId: ctx.traceId,
            sessionId: ctx.sessionId,
            userId: ctx.userId,
        };

        // Параллельный recall из всех слоёв
        const [episodes, engrams, l1Context, profile] = await Promise.all([
            // L2: Episodic recall
            this.memoryAdapter
                .retrieve(memCtx, embedding, {
                    limit: options?.episodeLimit ?? 5,
                    minSimilarity: 0.7,
                })
                .catch((err) => {
                    this.logger.warn(`full_recall L2 error: ${String(err)}`);
                    return {
                        traceId: ctx.traceId,
                        total: 0,
                        positive: 0,
                        negative: 0,
                        unknown: 0,
                        items: [],
                    } as EpisodicRetrievalResponse;
                }),

            // L4: Engram recall
            this.engramService
                .recallEngrams({
                    companyId: ctx.companyId,
                    embedding,
                    limit: options?.engramLimit ?? 5,
                })
                .catch((err) => {
                    this.logger.warn(`full_recall L4 error: ${String(err)}`);
                    return [] as RankedEngram[];
                }),

            // L1: Working Memory + Alerts + Hot Engrams
            this.workingMemoryService
                .getFullAgentContext(ctx.sessionId, ctx.companyId)
                .catch((err) => {
                    this.logger.warn(`full_recall L1 error: ${String(err)}`);
                    return {
                        workingMemory: null,
                        activeAlerts: [] as ActiveAlert[],
                        hotEngrams: [] as HotEngramEntry[],
                    };
                }),

            // L5: Profile
            this.memoryAdapter
                .getProfile(memCtx)
                .catch(() => ({} as Record<string, unknown>)),
        ]);

        // Promote горячие энграммы в L1
        for (const engram of engrams.slice(0, 3)) {
            await this.workingMemoryService
                .promoteEngram(ctx.companyId, {
                    engramId: engram.id,
                    compositeScore: engram.compositeScore,
                    category: engram.category,
                    contentPreview: engram.content.slice(0, 200),
                    activationCount: engram.activationCount,
                    promotedAt: new Date().toISOString(),
                })
                .catch(() => { });
        }

        const durationMs = Date.now() - startedAt;
        this.logger.debug(
            `full_recall companyId=${ctx.companyId} agent=${ctx.agentRole} episodes=${episodes.items.length} engrams=${engrams.length} hot=${l1Context.hotEngrams.length} alerts=${l1Context.activeAlerts.length} ms=${durationMs}`,
        );

        return {
            episodes,
            engrams,
            hotEngrams: l1Context.hotEngrams,
            activeAlerts: l1Context.activeAlerts,
            profile,
            workingMemory: l1Context.workingMemory,
        };
    }

    // ========================================================================
    // WRITE: сохранение взаимодействия (L1 + L2)
    // ========================================================================

    async commitInteraction(
        ctx: AgentMemoryContext,
        interaction: MemoryInteraction,
    ): Promise<void> {
        const memCtx: MemoryContext = {
            companyId: ctx.companyId,
            traceId: ctx.traceId,
            sessionId: ctx.sessionId,
            userId: ctx.userId,
        };

        // L2: сохранить взаимодействие
        await this.memoryAdapter.appendInteraction(memCtx, interaction);

        // L1: обновить working memory
        await this.workingMemoryService
            .setWorkingMemory(ctx.sessionId, {
                sessionId: ctx.sessionId,
                agentRole: ctx.agentRole,
                currentTask: interaction.userMessage.slice(0, 100),
                activeContext: ctx.agroContext ?? {},
                recentToolResults: [],
            })
            .catch(() => { });
    }

    // ========================================================================
    // L4: Engram Pass-through
    // ========================================================================

    async formEngram(caseStudy: EngramCaseStudy): Promise<string> {
        return this.engramService.formEngram(caseStudy);
    }

    async strengthenEngram(id: string, evidence: EngramEvidence): Promise<void> {
        return this.engramService.strengthenEngram(id, evidence);
    }

    async recallEngrams(context: EngramRecallContext): Promise<RankedEngram[]> {
        return this.engramService.recallEngrams(context);
    }

    // ========================================================================
    // L1: Working Memory Pass-through
    // ========================================================================

    async updateAgroContext(
        sessionId: string,
        patch: Partial<ActiveAgroContext>,
    ): Promise<void> {
        return this.workingMemoryService.updateAgroContext(sessionId, patch);
    }

    async addAlert(companyId: string, alert: ActiveAlert): Promise<void> {
        return this.workingMemoryService.addAlert(companyId, alert);
    }

    async getActiveAlerts(companyId: string): Promise<ActiveAlert[]> {
        return this.workingMemoryService.getActiveAlerts(companyId);
    }

    // ========================================================================
    // PROFILE: L5 Pass-through
    // ========================================================================

    async getProfile(ctx: MemoryContext): Promise<Record<string, unknown>> {
        return this.memoryAdapter.getProfile(ctx);
    }

    async updateProfile(
        ctx: MemoryContext,
        patch: Record<string, unknown>,
    ): Promise<void> {
        return this.memoryAdapter.updateProfile(ctx, patch);
    }

    // ========================================================================
    // HEALTH: общий статус когнитивной памяти
    // ========================================================================

    async getMemoryHealth(): Promise<Record<string, unknown>> {
        try {
            // Быстрые counts для health check
            const [
                engramCount,
                episodeCount,
                interactionCount,
                latestEpisode,
                latestEngram,
            ] = await Promise.all([
                this.engramService['prisma'].engram.count({ where: { isActive: true } }),
                this.engramService['prisma'].memoryEpisode.count(),
                this.engramService['prisma'].memoryInteraction.count(),
                this.engramService['prisma'].memoryEpisode.findFirst({
                    orderBy: { updatedAt: 'desc' },
                    select: { updatedAt: true },
                }),
                this.engramService['prisma'].engram.findFirst({
                    where: { isActive: true },
                    orderBy: { updatedAt: 'desc' },
                    select: { updatedAt: true },
                }),
            ]);

            const freshestTouch = latestEngram?.updatedAt ?? latestEpisode?.updatedAt ?? null;
            const freshnessMinutes = freshestTouch
                ? Math.max(0, Math.round((Date.now() - freshestTouch.getTime()) / 60000))
                : null;

            return {
                status: 'ok',
                degraded: false,
                layers: {
                    L1_reactive: 'active',
                    L2_episodic: { episodes: episodeCount, interactions: interactionCount },
                    L4_engrams: { active: engramCount },
                    L3_semantic: 'planned',
                    L5_institutional: 'basic',
                    L6_network: 'planned',
                },
                recallLatencyMs: null,
                episodeCount,
                engramCount,
                hotAlertCount: null,
                consolidationFreshness: freshnessMinutes,
                pruningStatus: engramCount > 50000 ? 'attention' : 'nominal',
                trustScore: freshnessMinutes === null ? null : Math.max(0.5, Math.min(0.98, 0.98 - freshnessMinutes / 10000)),
                timestamp: new Date().toISOString(),
            };
        } catch (err) {
            return {
                status: 'degraded',
                degraded: true,
                error: String(err),
                recallLatencyMs: null,
                episodeCount: null,
                engramCount: null,
                hotAlertCount: null,
                consolidationFreshness: null,
                pruningStatus: 'unknown',
                trustScore: null,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
