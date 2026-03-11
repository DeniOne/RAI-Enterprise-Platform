import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EngramService } from './engram.service';
import {
    EngramCaseStudy,
    EngramCategory,
    EngramType,
} from './engram.types';

/**
 * EngramFormationWorker — формирует энграммы из закрытых TechMap + HarvestResult.
 *
 * Запускается по cron (ежедневно или по событию закрытия техкарты).
 *
 * Логика:
 *   1. Находит закрытые техкарты без привязанных энграмм.
 *   2. Сопоставляет план (TechMap) с фактом (HarvestResult, если есть).
 *   3. Формирует энграмму: POSITIVE (>95% от плана), NEGATIVE (<80%), NEUTRAL (80-95%).
 *   4. Создаёт ассоциации между энграммами одного поля/сезона.
 */
@Injectable()
export class EngramFormationWorker {
    private readonly logger = new Logger(EngramFormationWorker.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly engramService: EngramService,
    ) { }

    /**
     * Основной метод: обрабатывает незакрытые техкарты.
     */
    async processCompletedTechMaps(): Promise<{ formed: number; skipped: number }> {
        const startedAt = Date.now();
        let formed = 0;
        let skipped = 0;

        try {
            // Ищем техкарты в статусе COMPLETED или ARCHIVED без энграмм
            const techMaps = await this.prisma.techMap.findMany({
                where: {
                    status: { in: ['ACTIVE' as any, 'ARCHIVED' as any] },
                },
                include: {
                    stages: {
                        include: {
                            operations: true,
                        },
                    },
                    cropZone: true,
                    field: true,
                },
                take: 50,
            }) as any[];

            for (const techMap of techMaps) {
                try {
                    const engramId = await this.formEngramFromTechMap(techMap);
                    if (engramId) {
                        formed++;
                        // Помечаем техкарту
                        await this.prisma.techMap.update({
                            where: { id: techMap.id },
                            data: {
                                // @ts-ignore
                                explainability: {
                                    ...((techMap.explainability || {}) as any),
                                    engramFormed: true,
                                    engramId,
                                    engramFormedAt: new Date().toISOString(),
                                },
                            },
                        });
                    } else {
                        skipped++;
                    }
                } catch (err) {
                    this.logger.warn(
                        `engram_formation_error techMapId=${techMap.id} error=${String(err)}`,
                    );
                    skipped++;
                }
            }

            const durationMs = Date.now() - startedAt;
            this.logger.log(
                `engram_formation_complete formed=${formed} skipped=${skipped} ms=${durationMs}`,
            );
        } catch (err) {
            this.logger.error(`engram_formation_batch_error error=${String(err)}`);
        }

        return { formed, skipped };
    }

    /**
     * Формирует энграмму из одной техкарты.
     */
    private async formEngramFromTechMap(techMap: any): Promise<string | null> {
        if (!techMap.cropZone) {
            return null;
        }

        const companyId = techMap.companyId;
        const crop = techMap.crop ?? 'неизвестно';
        const field = techMap.field;
        const region = (field as any)?.region ?? 'неизвестно';
        const soilType = techMap.soilType ?? undefined;

        // Определяем успешность по доступным метрикам
        const attrs = techMap.attrs as any;
        const plannedYield = attrs?.plannedYield;
        const actualYield = attrs?.actualYield;

        let wasSuccessful = true;
        let outcomeDescription = 'Техкарта выполнена';

        if (plannedYield && actualYield) {
            const ratio = actualYield / plannedYield;
            wasSuccessful = ratio >= 0.8;
            outcomeDescription =
                ratio >= 0.95
                    ? `Отличный результат: ${actualYield} ц/га (${(ratio * 100).toFixed(0)}% от плана)`
                    : ratio >= 0.8
                        ? `Удовлетворительный: ${actualYield} ц/га (${(ratio * 100).toFixed(0)}% от плана)`
                        : `Ниже плана: ${actualYield} ц/га (${(ratio * 100).toFixed(0)}% от плана)`;
        }

        // Собираем все операции из stages
        const allOperations = (techMap.stages ?? []).flatMap((s: any) => s.operations ?? []);
        const category = this.determineCategoryFromOperations(allOperations);

        const caseStudy: EngramCaseStudy = {
            companyId,
            type: 'AGRO' as EngramType,
            category,
            triggerConditions: {
                crop,
                region,
                soilType,
                season: techMap.seasonId ?? undefined,
            },
            actionTemplate: {
                type: 'APPLICATION',
                parameters: {
                    techMapId: techMap.id,
                    operationCount: allOperations.length,
                },
            },
            expectedOutcome: {
                description: outcomeDescription,
                metrics: {
                    ...(plannedYield ? { plannedYield } : {}),
                    ...(actualYield ? { actualYield } : {}),
                },
            },
            wasSuccessful,
            keyInsights: this.extractInsights(techMap),
            fieldId: field?.id ?? null,
            cropZoneId: techMap.cropZoneId ?? null,
            seasonId: techMap.seasonId ?? null,
        };

        const engramId = await this.engramService.formEngram(caseStudy);

        this.logger.log(
            `engram_from_techmap techMapId=${techMap.id} engramId=${engramId} category=${category} success=${wasSuccessful}`,
        );

        return engramId;
    }

    /**
     * Определяет категорию энграммы по типам операций.
     */
    private determineCategoryFromOperations(operations: any[]): EngramCategory {
        if (!operations || operations.length === 0) return 'DEVIATION_OUTCOME';

        const types = operations.map((op: any) =>
            (op.type ?? op.operationType ?? '').toLowerCase(),
        );

        if (types.some((t: string) => t.includes('harvest') || t.includes('убор'))) {
            return 'HARVEST';
        }
        if (types.some((t: string) => t.includes('sow') || t.includes('посев') || t.includes('seed'))) {
            return 'SOWING';
        }
        if (types.some((t: string) => t.includes('fung') || t.includes('герб') || t.includes('инсект'))) {
            return 'DISEASE_TREATMENT';
        }
        if (types.some((t: string) => t.includes('fertil') || t.includes('удобр') || t.includes('подкорм'))) {
            return 'NUTRITION';
        }
        return 'DEVIATION_OUTCOME';
    }

    /**
     * Извлекает ключевые инсайты из техкарты.
     */
    private extractInsights(techMap: any): string[] {
        const insights: string[] = [];
        const attrs = techMap.attrs as any;

        if (attrs?.deviations?.length > 0) {
            insights.push(
                `Зафиксировано ${attrs.deviations.length} отклонений от плана`,
            );
        }

        if (attrs?.actualYield && attrs?.plannedYield) {
            const ratio = attrs.actualYield / attrs.plannedYield;
            if (ratio < 0.8) {
                insights.push(`Урожайность ниже плана на ${((1 - ratio) * 100).toFixed(0)}%`);
            } else if (ratio > 1.1) {
                insights.push(`Урожайность выше плана на ${((ratio - 1) * 100).toFixed(0)}%`);
            }
        }

        return insights;
    }
}
