import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EngramService } from './engram.service';
import {
    EngramCaseStudy,
    EngramCategory,
    EngramType,
} from './engram.types';
import { resolveMemoryLifecyclePause } from './memory-lifecycle-control.util';

interface EngramLifecycleRunOptions {
    companyId?: string;
}

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
export class EngramFormationWorker implements OnApplicationBootstrap {
    private readonly logger = new Logger(EngramFormationWorker.name);
    private readonly memoryHygieneEnabled =
        (process.env.MEMORY_HYGIENE_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly formationBootstrapEnabled =
        (process.env.MEMORY_ENGRAM_FORMATION_BOOTSTRAP_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly formationScheduleEnabled =
        (process.env.MEMORY_ENGRAM_FORMATION_SCHEDULE_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly pruningBootstrapEnabled =
        (process.env.MEMORY_ENGRAM_PRUNING_BOOTSTRAP_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly pruningScheduleEnabled =
        (process.env.MEMORY_ENGRAM_PRUNING_SCHEDULE_ENABLED || 'true').toLowerCase() !== 'false';
    private readonly formationBootstrapMaxRuns = Math.max(
        1,
        Number(process.env.MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS || 3),
    );
    private readonly pruningBootstrapMaxRuns = Math.max(
        1,
        Number(process.env.MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS || 3),
    );
    private readonly formationCron =
        process.env.MEMORY_ENGRAM_FORMATION_CRON || '30 */4 * * *';
    private readonly pruningCron =
        process.env.MEMORY_ENGRAM_PRUNING_CRON || '0 4 * * *';
    private readonly pruningMinWeight = Number(
        process.env.MEMORY_ENGRAM_PRUNING_MIN_WEIGHT || 0.15,
    );
    private readonly pruningMaxInactiveDays = Number(
        process.env.MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS || 45,
    );
    private readonly formationPauseUntil =
        process.env.MEMORY_ENGRAM_FORMATION_PAUSE_UNTIL;
    private readonly formationPauseReason =
        process.env.MEMORY_ENGRAM_FORMATION_PAUSE_REASON;
    private readonly pruningPauseUntil =
        process.env.MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL;
    private readonly pruningPauseReason =
        process.env.MEMORY_ENGRAM_PRUNING_PAUSE_REASON;

    constructor(
        private readonly prisma: PrismaService,
        private readonly engramService: EngramService,
    ) { }

    onApplicationBootstrap() {
        const formationPause = this.getFormationPauseState();
        const pruningPause = this.getPruningPauseState();
        this.logger.log(
            `engram_lifecycle_initialized enabled=${this.memoryHygieneEnabled} formationBootstrapEnabled=${this.formationBootstrapEnabled} formationScheduleEnabled=${this.formationScheduleEnabled} pruningBootstrapEnabled=${this.pruningBootstrapEnabled} pruningScheduleEnabled=${this.pruningScheduleEnabled} formationBootstrapMaxRuns=${this.formationBootstrapMaxRuns} pruningBootstrapMaxRuns=${this.pruningBootstrapMaxRuns} formationCron="${this.formationCron}" pruningCron="${this.pruningCron}" pruningMinWeight=${this.pruningMinWeight} pruningMaxInactiveDays=${this.pruningMaxInactiveDays} formationPaused=${formationPause.paused} pruningPaused=${pruningPause.paused}`,
        );

        if (!this.memoryHygieneEnabled) {
            return;
        }

        if (!this.formationBootstrapEnabled && !this.pruningBootstrapEnabled) {
            return;
        }

        void this.runBootstrapLifecycleMaintenance();
    }

    @Cron(process.env.MEMORY_ENGRAM_FORMATION_CRON || '30 */4 * * *')
    async handleScheduledFormation(): Promise<void> {
        if (!this.memoryHygieneEnabled || !this.formationScheduleEnabled) {
            return;
        }

        const pause = this.getFormationPauseState();
        if (pause.paused) {
            this.logger.log(
                `memory_engram_formation_paused_skip mode=schedule until=${pause.until} reason=${pause.reason ?? 'n/a'} remainingSeconds=${pause.remainingSeconds}`,
            );
            return;
        }

        await this.processCompletedTechMaps();
    }

    @Cron(process.env.MEMORY_ENGRAM_PRUNING_CRON || '0 4 * * *')
    async handleScheduledPruning(): Promise<void> {
        if (!this.memoryHygieneEnabled || !this.pruningScheduleEnabled) {
            return;
        }

        const pause = this.getPruningPauseState();
        if (pause.paused) {
            this.logger.log(
                `memory_engram_pruning_paused_skip mode=schedule until=${pause.until} reason=${pause.reason ?? 'n/a'} remainingSeconds=${pause.remainingSeconds}`,
            );
            return;
        }

        await this.pruneInactiveEngrams();
    }

    async pruneInactiveEngrams(
        options: EngramLifecycleRunOptions = {},
    ): Promise<number> {
        return this.engramService.pruneEngrams({
            minWeight: this.pruningMinWeight,
            maxInactiveDays: this.pruningMaxInactiveDays,
            companyId: options.companyId,
        });
    }

    private async runBootstrapLifecycleMaintenance(): Promise<void> {
        try {
            let formationRuns = 0;
            let formationCreated = 0;
            let pruningRuns = 0;
            let pruningDeactivated = 0;
            const formationPause = this.getFormationPauseState();
            const pruningPause = this.getPruningPauseState();

            if (this.formationBootstrapEnabled && !formationPause.paused) {
                const formationSummary = await this.runFormationBootstrapCatchup();
                formationRuns = formationSummary.runs;
                formationCreated = formationSummary.formed;
            } else if (formationPause.paused) {
                this.logger.log(
                    `memory_engram_formation_paused_skip mode=bootstrap until=${formationPause.until} reason=${formationPause.reason ?? 'n/a'} remainingSeconds=${formationPause.remainingSeconds}`,
                );
            }

            if (this.pruningBootstrapEnabled && !pruningPause.paused) {
                const pruningSummary = await this.runPruningBootstrapCatchup();
                pruningRuns = pruningSummary.runs;
                pruningDeactivated = pruningSummary.pruned;
            } else if (pruningPause.paused) {
                this.logger.log(
                    `memory_engram_pruning_paused_skip mode=bootstrap until=${pruningPause.until} reason=${pruningPause.reason ?? 'n/a'} remainingSeconds=${pruningPause.remainingSeconds}`,
                );
            }

            this.logger.log(
                `engram_lifecycle_bootstrap_complete formationRuns=${formationRuns} formationCreated=${formationCreated} pruningRuns=${pruningRuns} pruningDeactivated=${pruningDeactivated}`,
            );
        } catch (err) {
            this.logger.error(`engram_lifecycle_bootstrap_error error=${String(err)}`);
        }
    }

    private getFormationPauseState() {
        return resolveMemoryLifecyclePause(
            this.formationPauseUntil,
            this.formationPauseReason,
        );
    }

    private getPruningPauseState() {
        return resolveMemoryLifecyclePause(
            this.pruningPauseUntil,
            this.pruningPauseReason,
        );
    }

    private async runFormationBootstrapCatchup(): Promise<{
        runs: number;
        formed: number;
    }> {
        let runs = 0;
        let formed = 0;

        while (runs < this.formationBootstrapMaxRuns) {
            runs += 1;
            const result = await this.processCompletedTechMaps();
            formed += result.formed;

            if (result.formed === 0) {
                break;
            }
        }

        return { runs, formed };
    }

    private async runPruningBootstrapCatchup(): Promise<{
        runs: number;
        pruned: number;
    }> {
        let runs = 0;
        let pruned = 0;

        while (runs < this.pruningBootstrapMaxRuns) {
            runs += 1;
            const result = await this.pruneInactiveEngrams();
            pruned += result;

            if (result === 0) {
                break;
            }
        }

        return { runs, pruned };
    }

    /**
     * Основной метод: обрабатывает незакрытые техкарты.
     */
    async processCompletedTechMaps(
        options: EngramLifecycleRunOptions = {},
    ): Promise<{ formed: number; skipped: number }> {
        const startedAt = Date.now();
        let formed = 0;
        let skipped = 0;

        try {
            // Ищем техкарты в статусе COMPLETED или ARCHIVED без энграмм
            const techMaps = await this.prisma.techMap.findMany({
                where: {
                    status: { in: ['ACTIVE' as any, 'ARCHIVED' as any] },
                    NOT: {
                        generationMetadata: {
                            path: ['memoryLifecycle', 'engramFormed'],
                            equals: true,
                        },
                    },
                    ...(options.companyId
                        ? { companyId: options.companyId }
                        : {}),
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
                        const existingGenerationMetadata =
                            ((techMap.generationMetadata || {}) as any);
                        const existingMemoryLifecycle =
                            ((existingGenerationMetadata.memoryLifecycle || {}) as any);
                        // Помечаем техкарту
                        await this.prisma.techMap.updateMany({
                            where: {
                                id: techMap.id,
                                ...(options.companyId
                                    ? { companyId: options.companyId }
                                    : {}),
                            },
                            data: {
                                generationMetadata: {
                                    ...existingGenerationMetadata,
                                    memoryLifecycle: {
                                        ...existingMemoryLifecycle,
                                        engramFormed: true,
                                        engramId,
                                        engramFormedAt: new Date().toISOString(),
                                    },
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
                `engram_formation_complete companyId=${options.companyId ?? 'ALL'} formed=${formed} skipped=${skipped} ms=${durationMs}`,
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
