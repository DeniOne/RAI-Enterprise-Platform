import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@rai/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { InvariantMetrics } from '../invariants/invariant-metrics';
import {
    EngramCaseStudy,
    EngramRecallContext,
    RankedEngram,
    EngramEvidence,
    AssociationType,
    PruneThreshold,
} from './engram.types';
import { buildTextEmbedding } from './signal-embedding.util';

/**
 * EngramService — ядро когнитивной памяти L4 (Procedural Memory).
 *
 * Энграмма = минимальная неделимая единица опыта:
 *   Триггер → Действие → Результат
 *
 * Правило Хебба: «нейроны, которые возбуждаются вместе, связываются вместе»
 *   weight_new = weight_old + 0.1 * (1 - weight_old)  при успехе
 *   weight_new = weight_old * 0.7                      при неудаче
 */
@Injectable()
export class EngramService {
    private readonly logger = new Logger(EngramService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ========================================================================
    // FORMATION: создание энграммы из кейса
    // ========================================================================

    async formEngram(caseStudy: EngramCaseStudy): Promise<string> {
        const content = this.buildEngramContent(caseStudy);
        const embedding = buildTextEmbedding(content);

        const initialWeight = caseStudy.wasSuccessful ? 0.6 : 0.3;
        const initialSuccessRate = caseStudy.wasSuccessful ? 1.0 : 0.0;
        const successCount = caseStudy.wasSuccessful ? 1 : 0;
        const failureCount = caseStudy.wasSuccessful ? 0 : 1;

        const engram = await this.prisma.engram.create({
            data: {
                type: caseStudy.type,
                category: caseStudy.category,
                triggerConditions: caseStudy.triggerConditions as any,
                actionTemplate: caseStudy.actionTemplate as any,
                expectedOutcome: caseStudy.expectedOutcome as any,
                content,
                synapticWeight: initialWeight,
                activationCount: 1,
                successRate: initialSuccessRate,
                successCount,
                failureCount,
                cognitiveLevel: 1,
                generalizability: 0.3,
                volatility: 0.5,
                associations: [],
                keyInsights: caseStudy.keyInsights ?? [],
                companyId: caseStudy.companyId ?? null,
                fieldId: caseStudy.fieldId ?? null,
                cropZoneId: caseStudy.cropZoneId ?? null,
                seasonId: caseStudy.seasonId ?? null,
                isActive: true,
                lastActivatedAt: new Date(),
                firstFormedAt: new Date(),
                attrs: {
                    schemaKey: 'memory.engram.v1',
                    provenance: 'engram-formation',
                    confidence: initialWeight,
                },
            },
        });

        // Записываем embedding через raw SQL (Prisma не поддерживает vector напрямую)
        if (embedding.length > 0) {
            const vectorStr = `[${embedding.join(',')}]`;
            await this.prisma.safeExecuteRaw(
                Prisma.sql`UPDATE engrams SET embedding = CAST(${vectorStr} AS vector) WHERE id = ${engram.id}`,
            );
        }

        this.logger.log(
            `engram_formed id=${engram.id} type=${caseStudy.type} category=${caseStudy.category} weight=${initialWeight} success=${caseStudy.wasSuccessful}`,
        );
        InvariantMetrics.increment('memory_engram_formations_total');

        return engram.id;
    }

    // ========================================================================
    // STRENGTHENING: усиление при повторном подтверждении (правило Хебба)
    // ========================================================================

    async strengthenEngram(id: string, evidence: EngramEvidence): Promise<void> {
        const engram = await this.prisma.engram.findUnique({ where: { id } });
        if (!engram) {
            this.logger.warn(`engram_strengthen_skip id=${id} reason=not_found`);
            return;
        }

        const isSuccess = evidence.wasSuccessful;
        const newSuccessCount = engram.successCount + (isSuccess ? 1 : 0);
        const newFailureCount = engram.failureCount + (isSuccess ? 0 : 1);
        const newTotalCount = newSuccessCount + newFailureCount;

        let newWeight: number;
        if (isSuccess) {
            // Правило Хебба: усиление
            newWeight = engram.synapticWeight + 0.1 * (1 - engram.synapticWeight);
        } else {
            // Ослабление при неудаче
            newWeight = engram.synapticWeight * 0.7;
        }

        // Деактивация при критически низком весе
        const shouldDeactivate = newWeight < 0.1;

        await this.prisma.engram.update({
            where: { id },
            data: {
                synapticWeight: newWeight,
                activationCount: engram.activationCount + 1,
                successRate: newSuccessCount / newTotalCount,
                successCount: newSuccessCount,
                failureCount: newFailureCount,
                isActive: shouldDeactivate ? false : engram.isActive,
                lastActivatedAt: new Date(),
                attrs: {
                    ...(engram.attrs as any),
                    lastEvidence: evidence.description,
                    lastEvidenceSource: evidence.source,
                    lastEvidenceAt: new Date().toISOString(),
                },
            },
        });

        this.logger.log(
            `engram_${isSuccess ? 'strengthened' : 'weakened'} id=${id} weight=${newWeight.toFixed(3)} rate=${(newSuccessCount / newTotalCount).toFixed(2)} active=${!shouldDeactivate}`,
        );
    }

    // ========================================================================
    // RECALL: поиск релевантных энграмм по контексту (vector + взвешивание)
    // ========================================================================

    async recallEngrams(context: EngramRecallContext): Promise<RankedEngram[]> {
        const limit = context.limit ?? 5;
        const minSimilarity = context.minSimilarity ?? 0.65;

        const vectorStr = `[${context.embedding.join(',')}]`;
        const whereConditions: Prisma.Sql[] = [
            Prisma.sql`e."isActive" = true`,
            Prisma.sql`(e."companyId" = ${context.companyId} OR e."companyId" IS NULL)`,
        ];

        if (context.filters?.type) {
            whereConditions.push(Prisma.sql`e.type = ${context.filters.type}`);
        }
        if (context.filters?.category) {
            whereConditions.push(Prisma.sql`e.category = ${context.filters.category}`);
        }

        // Vector search с фильтрами
        const results = await this.prisma.safeQueryRaw<Array<{
            id: string;
            type: string;
            category: string;
            content: string;
            triggerConditions: any;
            actionTemplate: any;
            expectedOutcome: any;
            keyInsights: string[];
            synapticWeight: number;
            successRate: number;
            activationCount: number;
            cognitiveLevel: number;
            similarity: number;
        }>>(Prisma.sql`
      SELECT
        e.id,
        e.type,
        e.category,
        e.content,
        e."triggerConditions",
        e."actionTemplate",
        e."expectedOutcome",
        e."keyInsights",
        e."synapticWeight",
        e."successRate",
        e."activationCount",
        e."cognitiveLevel",
        1 - (e.embedding <=> CAST(${vectorStr} AS vector)) AS similarity
      FROM engrams e
      WHERE ${Prisma.join(whereConditions, " AND ")}
        AND e.embedding IS NOT NULL
        AND 1 - (e.embedding <=> CAST(${vectorStr} AS vector)) >= ${minSimilarity}
      ORDER BY (
        e."synapticWeight" * 0.4 +
        e."successRate" * 0.3 +
        (1 - (e.embedding <=> CAST(${vectorStr} AS vector))) * 0.3
      ) DESC
      LIMIT ${limit}`);

        const ranked: RankedEngram[] = results.map((r) => ({
            id: r.id,
            type: r.type as any,
            category: r.category as any,
            content: r.content,
            triggerConditions: r.triggerConditions,
            actionTemplate: r.actionTemplate,
            expectedOutcome: r.expectedOutcome,
            keyInsights: r.keyInsights ?? [],
            compositeScore:
                r.synapticWeight * 0.4 + r.successRate * 0.3 + r.similarity * 0.3,
            synapticWeight: r.synapticWeight,
            successRate: r.successRate,
            similarity: r.similarity,
            activationCount: r.activationCount,
            cognitiveLevel: r.cognitiveLevel,
        }));

        // Обновляем lastActivatedAt для найденных энграмм
        if (ranked.length > 0) {
            const ids = ranked.map((r) => r.id);
            await this.prisma.engram.updateMany({
                where: { id: { in: ids } },
                data: {
                    lastActivatedAt: new Date(),
                    activationCount: { increment: 1 },
                },
            });
        }

        this.logger.debug(
            `engram_recall companyId=${context.companyId} found=${ranked.length} top_score=${ranked[0]?.compositeScore?.toFixed(3) ?? 'none'}`,
        );

        return ranked;
    }

    // ========================================================================
    // ASSOCIATION: создание синаптической связи
    // ========================================================================

    async associateEngrams(
        sourceId: string,
        targetId: string,
        type: AssociationType,
        initialStrength: number = 0.3,
    ): Promise<void> {
        const source = await this.prisma.engram.findUnique({ where: { id: sourceId } });
        if (!source) return;

        const currentAssociations = (source.associations as any[]) || [];

        // Проверяем, нет ли уже такой связи
        const existing = currentAssociations.find(
            (a: any) => a.engramId === targetId,
        );
        if (existing) {
            // Усиливаем существующую связь
            existing.strength = Math.min(
                1.0,
                existing.strength + 0.1 * (1 - existing.strength),
            );
        } else {
            currentAssociations.push({
                engramId: targetId,
                strength: initialStrength,
                type,
            });
        }

        await this.prisma.engram.update({
            where: { id: sourceId },
            data: { associations: currentAssociations as any },
        });

        this.logger.debug(
            `engram_associated source=${sourceId} target=${targetId} type=${type}`,
        );
    }

    // ========================================================================
    // PRUNING: деактивация слабых/устаревших энграмм
    // ========================================================================

    async pruneEngrams(threshold: PruneThreshold): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - threshold.maxInactiveDays);

        const result = await this.prisma.engram.updateMany({
            where: {
                isActive: true,
                ...(threshold.companyId
                    ? { companyId: threshold.companyId }
                    : {}),
                OR: [
                    { synapticWeight: { lt: threshold.minWeight } },
                    { lastActivatedAt: { lt: cutoffDate } },
                    { lastActivatedAt: null, createdAt: { lt: cutoffDate } },
                ],
            },
            data: { isActive: false },
        });

        this.logger.log(
            `engram_pruned companyId=${threshold.companyId ?? 'ALL'} count=${result.count} minWeight=${threshold.minWeight} maxInactiveDays=${threshold.maxInactiveDays}`,
        );
        if (result.count > 0) {
            InvariantMetrics.increment('memory_engram_pruned_total', result.count);
        }

        return result.count;
    }

    // ========================================================================
    // ABSTRACTION: повышение когнитивного уровня
    // ========================================================================

    async abstractEngram(id: string): Promise<void> {
        const engram = await this.prisma.engram.findUnique({ where: { id } });
        if (!engram) return;

        if (engram.cognitiveLevel >= 5) {
            this.logger.debug(`engram_abstract_skip id=${id} reason=max_level`);
            return;
        }

        if (engram.successRate < 0.9 || engram.activationCount < 10) {
            this.logger.debug(
                `engram_abstract_skip id=${id} reason=insufficient_evidence rate=${engram.successRate} count=${engram.activationCount}`,
            );
            return;
        }

        await this.prisma.engram.update({
            where: { id },
            data: {
                cognitiveLevel: engram.cognitiveLevel + 1,
                generalizability: Math.min(1.0, engram.generalizability + 0.2),
            },
        });

        this.logger.log(
            `engram_abstracted id=${id} newLevel=${engram.cognitiveLevel + 1}`,
        );
    }

    // ========================================================================
    // ПРИВАТНЫЕ УТИЛИТЫ
    // ========================================================================

    private buildEngramContent(caseStudy: EngramCaseStudy): string {
        const parts: string[] = [];

        const trigger = caseStudy.triggerConditions;
        if (trigger.crop) parts.push(`Культура: ${trigger.crop}`);
        if (trigger.bbchStage) parts.push(`Фаза: ${trigger.bbchStage}`);
        if (trigger.threat) parts.push(`Угроза: ${trigger.threat}`);
        if (trigger.severity) parts.push(`Поражение: ${trigger.severity}`);
        if (trigger.soilType) parts.push(`Почва: ${trigger.soilType}`);
        if (trigger.region) parts.push(`Регион: ${trigger.region}`);

        const action = caseStudy.actionTemplate;
        if (action.type) parts.push(`Действие: ${action.type}`);
        if (action.parameters) {
            parts.push(`Параметры: ${JSON.stringify(action.parameters)}`);
        }

        const outcome = caseStudy.expectedOutcome;
        if (outcome.description) parts.push(`Результат: ${outcome.description}`);

        parts.push(`Успех: ${caseStudy.wasSuccessful ? 'да' : 'нет'}`);

        if (caseStudy.keyInsights?.length) {
            parts.push(`Инсайты: ${caseStudy.keyInsights.join('; ')}`);
        }

        return parts.join('. ');
    }
}
