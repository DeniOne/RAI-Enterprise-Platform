import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildTextEmbedding } from './signal-embedding.util';

/**
 * ConsolidationWorker — фоновый процесс консолидации S→M.
 *
 * Группирует сырые взаимодействия (MemoryInteraction / S-Tier) в
 * структурированные эпизоды (MemoryEpisode / M-Tier).
 *
 * Запускается по cron каждые 6 часов.
 */
@Injectable()
export class ConsolidationWorker {
    private readonly logger = new Logger(ConsolidationWorker.name);

    /** Максимум записей за один batch */
    private readonly BATCH_SIZE = 100;

    /** Минимум взаимодействий для формирования эпизода */
    private readonly MIN_INTERACTIONS_FOR_EPISODE = 3;

    /** Retention S-Tier записей после консолидации (дни) */
    private readonly S_TIER_RETENTION_DAYS = 7;

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Основной метод: группирует S-Tier записи по sessionId,
     * суммаризирует и формирует M-Tier эпизоды.
     */
    async consolidate(): Promise<{ episodesCreated: number; interactionsProcessed: number }> {
        const startedAt = Date.now();
        let episodesCreated = 0;
        let interactionsProcessed = 0;

        try {
            // 1. Находим сессии с необработанными взаимодействиями
            const sessions = await this.prisma.$queryRaw<
                Array<{ sessionId: string; companyId: string; cnt: bigint }>
            >`
        SELECT "sessionId", "companyId", COUNT(*) as cnt
        FROM memory_interactions
        WHERE "sessionId" IS NOT NULL
          AND ("attrs"->>'consolidated')::boolean IS NOT TRUE
        GROUP BY "sessionId", "companyId"
        HAVING COUNT(*) >= ${this.MIN_INTERACTIONS_FOR_EPISODE}
        ORDER BY MAX("createdAt") ASC
        LIMIT ${this.BATCH_SIZE}
      `;

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
                `consolidation_complete episodes=${episodesCreated} interactions=${interactionsProcessed} ms=${durationMs}`,
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
            await this.prisma.$executeRawUnsafe(
                `UPDATE memory_episodes SET embedding = $1::vector WHERE id = $2`,
                vectorStr,
                episode.id,
            );
        }

        // Помечаем S-Tier записи как консолидированные
        const interactionIds = interactions.map((i) => i.id);
        await this.prisma.memoryInteraction.updateMany({
            where: { id: { in: interactionIds } },
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
    async pruneConsolidatedInteractions(): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.S_TIER_RETENTION_DAYS);

        // Удаляем только те, что уже консолидированы И старше retention period
        const result = await this.prisma.$executeRaw`
      DELETE FROM memory_interactions
      WHERE "createdAt" < ${cutoffDate}
        AND ("attrs"->>'consolidated')::boolean = true
    `;

        this.logger.log(`s_tier_pruned count=${result} cutoff=${cutoffDate.toISOString()}`);
        return result as number;
    }
}
