import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EngramService } from '../../../shared/memory/engram.service';
import { buildTextEmbedding } from '../../../shared/memory/signal-embedding.util';
import { EngramCaseStudy } from '../../../shared/memory/engram.types';

/**
 * SeasonalLoopService — Phase 4
 *
 * Batch-процессы по завершении сезона:
 *   SL-4.1: End-of-Season Engram Formation
 *   SL-4.2: Cross-Partner Knowledge Sharing (network effect)
 *   SL-4.3: Engram-Backed Trust Score
 */

export interface SeasonalSummary {
    seasonId: string;
    companyId: string;
    engramsFormed: number;
    engramsStrengthened: number;
    engramsWeakened: number;
    avgYieldRatio: number;
    fieldsProcessed: number;
}

export interface TrustScore {
    companyId: string;
    seasonId: string;
    score: number;
    totalEngrams: number;
    avgSuccessRate: number;
    avgSynapticWeight: number;
    evidenceCount: number;
}

@Injectable()
export class SeasonalLoopService {
    private readonly logger = new Logger(SeasonalLoopService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly engramService: EngramService,
    ) { }

    // ========================================================================
    // SL-4.1: End-of-Season Engram Formation
    // ========================================================================

    /**
     * Batch-формирование энграмм из всех HarvestResults сезона.
     */
    async processEndOfSeason(
        seasonId: string,
        companyId: string,
    ): Promise<SeasonalSummary> {
        const startedAt = Date.now();
        let formed = 0;
        let strengthened = 0;
        let weakened = 0;
        let totalYieldRatio = 0;
        let fieldsProcessed = 0;

        // Загружаем все техкарты сезона с результатами
        const techMaps = (await this.prisma.techMap.findMany({
            where: {
                companyId,
                seasonId,
                status: { in: ['ACTIVE' as any, 'ARCHIVED' as any] },
            },
            include: {
                stages: { include: { operations: true } },
                cropZone: true,
                field: true,
            },
        })) as any[];

        for (const techMap of techMaps) {
            try {
                const attrs = techMap.attrs as any;
                const plannedYield = attrs?.plannedYield;
                const actualYield = attrs?.actualYield;

                if (!plannedYield || !actualYield) continue;

                const yieldRatio = actualYield / plannedYield;
                totalYieldRatio += yieldRatio;
                fieldsProcessed++;

                const wasSuccessful = yieldRatio >= 0.8;
                const allOps = (techMap.stages ?? []).flatMap((s: any) => s.operations ?? []);

                // Проверяем, есть ли уже энграмма для этой техкарты
                const existingEngrams = await this.engramService.recallEngrams({
                    companyId,
                    embedding: buildTextEmbedding(`${techMap.crop} сезон ${seasonId} поле ${(techMap.field as any)?.name ?? ''}`),
                    limit: 3,
                    minSimilarity: 0.9,
                });

                if (existingEngrams.length > 0) {
                    // Усиливаем/ослабляем существующую
                    for (const engram of existingEngrams) {
                        if (wasSuccessful) {
                            await this.engramService.strengthenEngram(engram.id, {
                                wasSuccessful: true,
                                description: `Сезон ${seasonId}: урожайность ${actualYield} ц/га (${(yieldRatio * 100).toFixed(0)}% от плана)`,
                                source: 'seasonal_loop',
                            });
                            strengthened++;
                        } else {
                            await this.engramService.strengthenEngram(engram.id, {
                                wasSuccessful: false,
                                description: `Сезон ${seasonId}: недобор — ${actualYield} ц/га (${(yieldRatio * 100).toFixed(0)}% от плана)`,
                                source: 'seasonal_loop',
                            });
                            weakened++;
                        }
                    }
                } else {
                    // Формируем новую энграмму
                    const caseStudy: EngramCaseStudy = {
                        companyId,
                        type: 'AGRO',
                        category: 'HARVEST',
                        triggerConditions: {
                            crop: techMap.crop,
                            season: seasonId,
                        },
                        actionTemplate: {
                            type: 'SEASONAL_RESULT',
                            parameters: {
                                techMapId: techMap.id,
                                operationCount: allOps.length,
                            },
                        },
                        expectedOutcome: {
                            description: `Урожайность ${actualYield} ц/га (${(yieldRatio * 100).toFixed(0)}% от плана ${plannedYield} ц/га)`,
                            metrics: { plannedYield, actualYield, yieldRatio },
                        },
                        wasSuccessful,
                        keyInsights: [],
                        fieldId: techMap.fieldId ?? null,
                        cropZoneId: techMap.cropZoneId ?? null,
                        seasonId,
                    };

                    await this.engramService.formEngram(caseStudy);
                    formed++;
                }
            } catch (err) {
                this.logger.warn(`seasonal_process techMapId=${techMap.id} error=${String(err)}`);
            }
        }

        const durationMs = Date.now() - startedAt;
        const avgYieldRatio = fieldsProcessed > 0 ? totalYieldRatio / fieldsProcessed : 0;

        this.logger.log(
            `seasonal_loop_complete season=${seasonId} company=${companyId} formed=${formed} strengthened=${strengthened} weakened=${weakened} fields=${fieldsProcessed} avgYield=${(avgYieldRatio * 100).toFixed(0)}% ms=${durationMs}`,
        );

        return {
            seasonId,
            companyId,
            engramsFormed: formed,
            engramsStrengthened: strengthened,
            engramsWeakened: weakened,
            avgYieldRatio,
            fieldsProcessed,
        };
    }

    // ========================================================================
    // SL-4.2: Cross-Partner Knowledge Sharing
    // ========================================================================

    /**
     * Собирает анонимизированные энграммы с высоким score для network knowledge.
     */
    async shareCrossPartnerKnowledge(
        seasonId: string,
    ): Promise<{ shared: number }> {
        // Находим энграммы с высоким score
        const topEngrams = await this.prisma.engram.findMany({
            where: {
                isActive: true,
                synapticWeight: { gte: 0.8 },
                successRate: { gte: 0.85 },
                activationCount: { gte: 5 },
                seasonId,
            },
            select: {
                id: true,
                type: true,
                category: true,
                content: true,
                synapticWeight: true,
                successRate: true,
                activationCount: true,
                cognitiveLevel: true,
                // НЕ берём companyId — анонимизация
            },
            take: 100,
        });

        // Создаём анонимизированные копии (companyId = null → глобальная энграмма)
        let shared = 0;
        for (const engram of topEngrams) {
            try {
                // Проверяем, есть ли уже глобальная копия
                const existing = await this.prisma.engram.findFirst({
                    where: {
                        companyId: null,
                        content: { contains: engram.content.slice(0, 100) },
                        isActive: true,
                    },
                });

                if (!existing) {
                    await this.prisma.engram.create({
                        data: {
                            type: engram.type,
                            category: engram.category,
                            triggerConditions: {},
                            actionTemplate: {},
                            expectedOutcome: {},
                            content: `[Network L6] ${engram.content}`,
                            synapticWeight: engram.synapticWeight * 0.8, // Снижаем немного
                            activationCount: engram.activationCount,
                            successRate: engram.successRate,
                            successCount: Math.floor(engram.activationCount * engram.successRate),
                            failureCount: Math.floor(engram.activationCount * (1 - engram.successRate)),
                            cognitiveLevel: Math.max(engram.cognitiveLevel, 3),
                            companyId: null, // Глобальная
                            attrs: {
                                provenance: 'network_sharing',
                                sourceSeasonId: seasonId,
                                sharedAt: new Date().toISOString(),
                            },
                            updatedAt: new Date(),
                        },
                    });
                    shared++;
                }
            } catch (err) {
                this.logger.warn(`network_share error=${String(err)}`);
            }
        }

        this.logger.log(`cross_partner_share season=${seasonId} candidates=${topEngrams.length} shared=${shared}`);
        return { shared };
    }

    // ========================================================================
    // SL-4.3: Engram-Backed Trust Score
    // ========================================================================

    /**
     * Рассчитывает Trust Score для конкретного клиента.
     * Для банков/страховых: «эта техкарта основана на N энграммах с avg score X»
     */
    async calculateTrustScore(
        companyId: string,
        seasonId: string,
    ): Promise<TrustScore> {
        const engrams = await this.prisma.engram.findMany({
            where: {
                isActive: true,
                OR: [
                    { companyId },
                    { companyId: null }, // Глобальные энграммы тоже считаем
                ],
            },
            select: {
                synapticWeight: true,
                successRate: true,
                activationCount: true,
            },
        });

        const totalEngrams = engrams.length;
        if (totalEngrams === 0) {
            return {
                companyId,
                seasonId,
                score: 0,
                totalEngrams: 0,
                avgSuccessRate: 0,
                avgSynapticWeight: 0,
                evidenceCount: 0,
            };
        }

        const avgSuccessRate = engrams.reduce((s, e) => s + e.successRate, 0) / totalEngrams;
        const avgSynapticWeight = engrams.reduce((s, e) => s + e.synapticWeight, 0) / totalEngrams;
        const evidenceCount = engrams.reduce((s, e) => s + e.activationCount, 0);

        // Trust Score: композитная метрика
        // Факторы: количество энграмм, средний success rate, средний вес, количество подтверждений
        const quantityFactor = Math.min(totalEngrams / 100, 1) * 0.2;
        const successFactor = avgSuccessRate * 0.35;
        const weightFactor = avgSynapticWeight * 0.25;
        const evidenceFactor = Math.min(evidenceCount / 500, 1) * 0.2;

        const score = quantityFactor + successFactor + weightFactor + evidenceFactor;

        this.logger.log(
            `trust_score companyId=${companyId} season=${seasonId} score=${score.toFixed(3)} engrams=${totalEngrams} evidence=${evidenceCount}`,
        );

        return {
            companyId,
            seasonId,
            score,
            totalEngrams,
            avgSuccessRate,
            avgSynapticWeight,
            evidenceCount,
        };
    }
}
