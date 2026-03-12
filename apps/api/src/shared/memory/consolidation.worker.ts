import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@rai/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveMemoryLifecyclePause } from './memory-lifecycle-control.util';
import { buildTextEmbedding } from './signal-embedding.util';

interface ConsolidationRunOptions {
    companyId?: string;
}

/**
 * ConsolidationWorker — фоновый процесс консолидации S→M.
 *
 * Группирует сырые взаимодействия (MemoryInteraction / S-Tier) в
 * структурированные эпизоды (MemoryEpisode / M-Tier).
 *
 * Запускается по cron каждые 6 часов.
 */
@Injectable()
export class ConsolidationWorker implements OnApplicationBootstrap {
    private readonly logger = new Logger(ConsolidationWorker.name);
    private readonly memoryHygieneEnabled =
        (process.env.MEMORY_HYGIENE_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly consolidationBootstrapEnabled =
        (process.env.MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly pruningBootstrapEnabled =
        (process.env.MEMORY_PRUNING_BOOTSTRAP_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly consolidationBootstrapMaxRuns = Math.max(
        1,
        Number(process.env.MEMORY_CONSOLIDATION_BOOTSTRAP_MAX_RUNS || 3),
    );
    private readonly pruningBootstrapMaxRuns = Math.max(
        1,
        Number(process.env.MEMORY_PRUNING_BOOTSTRAP_MAX_RUNS || 3),
    );
    private readonly consolidationScheduleEnabled =
        (process.env.MEMORY_CONSOLIDATION_SCHEDULE_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly pruningScheduleEnabled =
        (process.env.MEMORY_PRUNING_SCHEDULE_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly consolidationCron =
        process.env.MEMORY_CONSOLIDATION_CRON || '0 */6 * * *';
    private readonly pruningCron =
        process.env.MEMORY_PRUNING_CRON || '0 3 * * *';
    private readonly consolidationPauseUntil =
        process.env.MEMORY_CONSOLIDATION_PAUSE_UNTIL;
    private readonly consolidationPauseReason =
        process.env.MEMORY_CONSOLIDATION_PAUSE_REASON;
    private readonly pruningPauseUntil =
        process.env.MEMORY_PRUNING_PAUSE_UNTIL;
    private readonly pruningPauseReason =
        process.env.MEMORY_PRUNING_PAUSE_REASON;

    /** Максимум записей за один batch */
    private readonly BATCH_SIZE = 100;

    /** Минимум взаимодействий для формирования эпизода */
    private readonly MIN_INTERACTIONS_FOR_EPISODE = 3;

    /** Retention S-Tier записей после консолидации (дни) */
    private readonly S_TIER_RETENTION_DAYS = 7;

    constructor(private readonly prisma: PrismaService) { }

    onApplicationBootstrap() {
        const consolidationPause = this.getConsolidationPauseState();
        const pruningPause = this.getPruningPauseState();
        this.logger.log(
            `memory_hygiene_initialized enabled=${this.memoryHygieneEnabled} consolidationBootstrapEnabled=${this.consolidationBootstrapEnabled} pruningBootstrapEnabled=${this.pruningBootstrapEnabled} consolidationBootstrapMaxRuns=${this.consolidationBootstrapMaxRuns} pruningBootstrapMaxRuns=${this.pruningBootstrapMaxRuns} consolidationScheduleEnabled=${this.consolidationScheduleEnabled} pruningScheduleEnabled=${this.pruningScheduleEnabled} consolidationCron="${this.consolidationCron}" pruningCron="${this.pruningCron}" consolidationPaused=${consolidationPause.paused} pruningPaused=${pruningPause.paused}`,
        );

        if (!this.memoryHygieneEnabled) {
            return;
        }

        if (!this.consolidationBootstrapEnabled && !this.pruningBootstrapEnabled) {
            return;
        }

        void this.runBootstrapMaintenance();
    }

    @Cron(process.env.MEMORY_CONSOLIDATION_CRON || '0 */6 * * *')
    async handleScheduledConsolidation(): Promise<void> {
        if (!this.memoryHygieneEnabled || !this.consolidationScheduleEnabled) {
            return;
        }

        const pause = this.getConsolidationPauseState();
        if (pause.paused) {
            this.logger.log(
                `memory_consolidation_paused_skip mode=schedule until=${pause.until} reason=${pause.reason ?? 'n/a'} remainingSeconds=${pause.remainingSeconds}`,
            );
            return;
        }

        await this.consolidate();
    }

    @Cron(process.env.MEMORY_PRUNING_CRON || '0 3 * * *')
    async handleScheduledPruning(): Promise<void> {
        if (!this.memoryHygieneEnabled || !this.pruningScheduleEnabled) {
            return;
        }

        const pause = this.getPruningPauseState();
        if (pause.paused) {
            this.logger.log(
                `memory_pruning_paused_skip mode=schedule until=${pause.until} reason=${pause.reason ?? 'n/a'} remainingSeconds=${pause.remainingSeconds}`,
            );
            return;
        }

        await this.pruneConsolidatedInteractions();
    }

    private async runBootstrapMaintenance(): Promise<void> {
        try {
            let consolidationRuns = 0;
            let consolidationInteractionsProcessed = 0;
            let pruningRuns = 0;
            let pruningDeleted = 0;
            const consolidationPause = this.getConsolidationPauseState();
            const pruningPause = this.getPruningPauseState();

            if (this.consolidationBootstrapEnabled && !consolidationPause.paused) {
                const consolidationSummary =
                    await this.runConsolidationBootstrapCatchup();
                consolidationRuns = consolidationSummary.runs;
                consolidationInteractionsProcessed =
                    consolidationSummary.interactionsProcessed;
            } else if (consolidationPause.paused) {
                this.logger.log(
                    `memory_consolidation_paused_skip mode=bootstrap until=${consolidationPause.until} reason=${consolidationPause.reason ?? 'n/a'} remainingSeconds=${consolidationPause.remainingSeconds}`,
                );
            }

            if (this.pruningBootstrapEnabled && !pruningPause.paused) {
                const pruningSummary = await this.runPruningBootstrapCatchup();
                pruningRuns = pruningSummary.runs;
                pruningDeleted = pruningSummary.deleted;
            } else if (pruningPause.paused) {
                this.logger.log(
                    `memory_pruning_paused_skip mode=bootstrap until=${pruningPause.until} reason=${pruningPause.reason ?? 'n/a'} remainingSeconds=${pruningPause.remainingSeconds}`,
                );
            }

            this.logger.log(
                `memory_hygiene_bootstrap_complete consolidationRuns=${consolidationRuns} consolidationInteractionsProcessed=${consolidationInteractionsProcessed} pruningRuns=${pruningRuns} pruningDeleted=${pruningDeleted}`,
            );
        } catch (err) {
            this.logger.error(`memory_hygiene_bootstrap_error error=${String(err)}`);
        }
    }

    private getConsolidationPauseState() {
        return resolveMemoryLifecyclePause(
            this.consolidationPauseUntil,
            this.consolidationPauseReason,
        );
    }

    private getPruningPauseState() {
        return resolveMemoryLifecyclePause(
            this.pruningPauseUntil,
            this.pruningPauseReason,
        );
    }

    private async runConsolidationBootstrapCatchup(): Promise<{
        runs: number;
        interactionsProcessed: number;
    }> {
        let runs = 0;
        let interactionsProcessed = 0;

        while (runs < this.consolidationBootstrapMaxRuns) {
            runs += 1;
            const result = await this.consolidate();
            interactionsProcessed += result.interactionsProcessed;

            if (result.episodesCreated === 0 && result.interactionsProcessed === 0) {
                break;
            }
        }

        return { runs, interactionsProcessed };
    }

    private async runPruningBootstrapCatchup(): Promise<{
        runs: number;
        deleted: number;
    }> {
        let runs = 0;
        let deleted = 0;

        while (runs < this.pruningBootstrapMaxRuns) {
            runs += 1;
            const pruned = await this.pruneConsolidatedInteractions();
            deleted += pruned;

            if (pruned === 0) {
                break;
            }
        }

        return { runs, deleted };
    }

    /**
     * Основной метод: группирует S-Tier записи по sessionId,
     * суммаризирует и формирует M-Tier эпизоды.
     */
    async consolidate(
        options: ConsolidationRunOptions = {},
    ): Promise<{ episodesCreated: number; interactionsProcessed: number }> {
        const startedAt = Date.now();
        let episodesCreated = 0;
        let interactionsProcessed = 0;

        try {
            const filters: Prisma.Sql[] = [
                Prisma.sql`"sessionId" IS NOT NULL`,
                Prisma.sql`("attrs"->>'consolidated')::boolean IS NOT TRUE`,
            ];
            if (options.companyId) {
                filters.push(Prisma.sql`"companyId" = ${options.companyId}`);
            }

            // 1. Находим сессии с необработанными взаимодействиями
            const sessions = await this.prisma.safeQueryRaw<
                Array<{ sessionId: string; companyId: string; cnt: bigint }>
            >(Prisma.sql`
        SELECT "sessionId", "companyId", COUNT(*) as cnt
        FROM memory_interactions
        WHERE ${Prisma.join(filters, ' AND ')}
        GROUP BY "sessionId", "companyId"
        HAVING COUNT(*) >= ${this.MIN_INTERACTIONS_FOR_EPISODE}
        ORDER BY MAX("createdAt") ASC
        LIMIT ${this.BATCH_SIZE}
      `);

            for (const session of sessions) {
                try {
                    const result = await this.consolidateSession(
                        session.sessionId,
                        session.companyId,
                    );
                    if (result) {
                        episodesCreated++;
                        interactionsProcessed += Number(session.cnt);
                    }
                } catch (err) {
                    this.logger.warn(
                        `consolidation_session_error sessionId=${session.sessionId} error=${String(err)}`,
                    );
                }
            }

            const durationMs = Date.now() - startedAt;
            this.logger.log(
                `consolidation_complete companyId=${options.companyId ?? 'ALL'} episodes=${episodesCreated} interactions=${interactionsProcessed} ms=${durationMs}`,
            );
        } catch (err) {
            this.logger.error(`consolidation_error error=${String(err)}`);
        }

        return { episodesCreated, interactionsProcessed };
    }

    /**
     * Консолидирует одну сессию: извлекает ключевые факты и решения.
     */
    private async consolidateSession(
        sessionId: string,
        companyId: string,
    ): Promise<boolean> {
        // Загружаем взаимодействия сессии
        const interactions = await this.prisma.memoryInteraction.findMany({
            where: {
                sessionId,
                companyId,
            },
            orderBy: { createdAt: 'asc' },
            take: 50,
        });

        if (interactions.length < this.MIN_INTERACTIONS_FOR_EPISODE) {
            return false;
        }

        // Извлекаем ключевую информацию rule-based
        const summary = this.extractSummary(interactions);
        const episodeType = this.classifyEpisodeType(interactions);
        const embedding = buildTextEmbedding(summary);

        // Создаём M-Tier эпизод
        const episode = await this.prisma.memoryEpisode.create({
            data: {
                content: summary,
                companyId,
                attrs: {
                    schemaKey: 'memory.episode.v2',
                    provenance: 'consolidation-worker',
                    confidence: 0.8,
                    episodeType,
                    interactionCount: interactions.length,
                    sessionId,
                    timeRange: {
                        from: interactions[0].createdAt.toISOString(),
                        to: interactions[interactions.length - 1].createdAt.toISOString(),
                    },
                },
            },
        });

        // Записываем embedding
        if (embedding.length > 0) {
            const vectorStr = `[${embedding.join(',')}]`;
            await this.prisma.safeExecuteRaw(
                Prisma.sql`UPDATE memory_episodes SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${episode.id}`,
            );
        }

        // Помечаем S-Tier записи как консолидированные
        const interactionIds = interactions.map((i) => i.id);
        await this.prisma.memoryInteraction.updateMany({
            where: {
                id: { in: interactionIds },
                companyId,
            },
            data: {
                attrs: {
                    consolidated: true,
                    consolidatedAt: new Date().toISOString(),
                    episodeId: episode.id,
                },
            },
        });

        this.logger.debug(
            `consolidation_session sessionId=${sessionId} interactions=${interactions.length} episodeId=${episode.id} type=${episodeType}`,
        );

        return true;
    }

    /**
     * Извлекает суммарное описание из набора взаимодействий (rule-based).
     */
    private extractSummary(
        interactions: Array<{ content: string; createdAt: Date }>,
    ): string {
        const parts: string[] = [];
        const firstTime = interactions[0].createdAt.toISOString().slice(0, 16);
        const lastTime =
            interactions[interactions.length - 1].createdAt.toISOString().slice(0, 16);

        parts.push(`Сессия ${firstTime} — ${lastTime}, ${interactions.length} взаимодействий.`);

        // Берём первое и последнее сообщения как ключевые
        const firstContent = interactions[0].content.slice(0, 300);
        const lastContent =
            interactions[interactions.length - 1].content.slice(0, 300);

        parts.push(`Начало: ${firstContent}`);
        if (interactions.length > 1) {
            parts.push(`Завершение: ${lastContent}`);
        }

        return parts.join(' ');
    }

    /**
     * Классифицирует тип эпизода по содержанию.
     */
    private classifyEpisodeType(
        interactions: Array<{ content: string; attrs: any }>,
    ): string {
        const allContent = interactions
            .map((i) => i.content.toLowerCase())
            .join(' ');

        if (allContent.includes('техкарт') || allContent.includes('tech_map')) {
            return 'DECISION';
        }
        if (allContent.includes('отклонен') || allContent.includes('deviation')) {
            return 'DEVIATION';
        }
        if (allContent.includes('урожай') || allContent.includes('harvest')) {
            return 'HARVEST';
        }
        if (allContent.includes('алерт') || allContent.includes('alert')) {
            return 'ALERT_RESPONSE';
        }
        return 'CONVERSATION';
    }

    /**
     * Очищает устаревшие S-Tier записи (уже консолидированные + старше N дней).
     */
    async pruneConsolidatedInteractions(
        options: ConsolidationRunOptions = {},
    ): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.S_TIER_RETENTION_DAYS);
        const filters: Prisma.Sql[] = [
            Prisma.sql`"createdAt" < ${cutoffDate}`,
            Prisma.sql`("attrs"->>'consolidated')::boolean = true`,
        ];
        if (options.companyId) {
            filters.push(Prisma.sql`"companyId" = ${options.companyId}`);
        }

        // Удаляем только те, что уже консолидированы И старше retention period
        const result = await this.prisma.safeExecuteRaw(Prisma.sql`
      DELETE FROM memory_interactions
      WHERE ${Prisma.join(filters, ' AND ')}
    `);

        this.logger.log(
            `s_tier_pruned companyId=${options.companyId ?? 'ALL'} count=${result} cutoff=${cutoffDate.toISOString()}`,
        );
        return result as number;
    }
}
