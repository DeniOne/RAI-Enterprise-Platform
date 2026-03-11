import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EngramService } from '../../../shared/memory/engram.service';
import { MemoryFacade, AgentMemoryContext, FullRecallResult } from '../../../shared/memory/memory-facade.service';
import { WorkingMemoryService } from '../../../shared/memory/working-memory.service';
import { buildTextEmbedding } from '../../../shared/memory/signal-embedding.util';
import { RankedEngram, EngramRecallContext } from '../../../shared/memory/engram.types';

/**
 * ExpertInvocationEngine — Phase 3.1
 *
 * Отвечает за вызов expert-tier агентов (chief_agronomist, data_scientist)
 * вне стандартного orchestration spine.
 *
 * Триггеры вызова:
 *   1. Governed escalation от operational agent (agronomist → chief_agronomist)
 *   2. Direct request от supervisor (пользователь явно просит эксперта)
 *   3. Alert-triggered (monitoring alert → chief_agronomist Lightweight)
 *   4. Scheduled (cron → data_scientist Lightweight)
 */

export type ExpertRole = 'chief_agronomist' | 'data_scientist';
export type ExpertMode = 'lightweight' | 'full_pro';

export interface ExpertInvocationRequest {
    role: ExpertRole;
    mode: ExpertMode;
    companyId: string;
    traceId: string;
    sessionId?: string;
    userId?: string;

    /** Входное сообщение или задача */
    query: string;

    /** Контекст: конкретное поле, культура, сезон */
    context?: {
        fieldId?: string;
        cropZoneId?: string;
        seasonId?: string;
        crop?: string;
        alertId?: string;
        techMapId?: string;
    };

    /** Максимальное время (ms) */
    timeoutMs?: number;
}

export interface ExpertInvocationResult {
    role: ExpertRole;
    mode: ExpertMode;
    status: 'COMPLETED' | 'TIMEOUT' | 'INSUFFICIENT_DATA' | 'ERROR';
    traceId: string;

    /** Основной ответ */
    response: string;

    /** Структурированные данные */
    structuredOutput: Record<string, unknown>;

    /** Использованные энграммы */
    engramsUsed: Array<{
        id: string;
        category: string;
        compositeScore: number;
        content: string;
    }>;

    /** Confidence score */
    confidence: number;

    /** Evidence references */
    evidence: Array<{
        type: string;
        source: string;
        content: string;
    }>;

    /** Рекомендации */
    recommendations: Array<{
        action: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        rationale: string;
        alternatives?: string[];
    }>;

    /** Время исполнения */
    durationMs: number;
}

@Injectable()
export class ExpertInvocationEngine {
    private readonly logger = new Logger(ExpertInvocationEngine.name);

    /** Cost control: max calls per company per day */
    private readonly MAX_PRO_CALLS_PER_DAY = 10;

    constructor(
        private readonly prisma: PrismaService,
        @Optional() private readonly engramService?: EngramService,
        @Optional() private readonly workingMemoryService?: WorkingMemoryService,
    ) { }

    /**
     * Вызывает expert-tier агента.
     */
    async invoke(request: ExpertInvocationRequest): Promise<ExpertInvocationResult> {
        const startedAt = Date.now();
        const timeoutMs = request.timeoutMs ?? (request.mode === 'full_pro' ? 300_000 : 30_000);

        this.logger.log(
            `expert_invoke role=${request.role} mode=${request.mode} companyId=${request.companyId} traceId=${request.traceId}`,
        );

        try {
            // Cost control для PRO mode
            if (request.mode === 'full_pro') {
                const allowed = await this.checkCostBudget(request.companyId, request.role);
                if (!allowed) {
                    return this.buildResult(request, startedAt, {
                        status: 'ERROR',
                        response: `Превышен лимит вызовов ${request.role} PRO на сегодня (макс. ${this.MAX_PRO_CALLS_PER_DAY}).`,
                        confidence: 0,
                    });
                }
            }

            // Recall энграммы для контекста
            const engrams = await this.recallExpertEngrams(request);

            // Проверка достаточности данных
            if (engrams.length === 0 && request.mode === 'lightweight') {
                return this.buildResult(request, startedAt, {
                    status: 'INSUFFICIENT_DATA',
                    response: 'Недостаточно данных (энграмм) для формирования экспертного заключения.',
                    confidence: 0,
                });
            }

            // Формирование экспертного ответа
            const result = await this.executeExpertLogic(request, engrams);

            // Логирование в audit trail
            await this.logInvocation(request, result);

            return result;
        } catch (err) {
            this.logger.error(
                `expert_invoke_error role=${request.role} traceId=${request.traceId} error=${String(err)}`,
            );
            return this.buildResult(request, startedAt, {
                status: 'ERROR',
                response: `Ошибка выполнения expert invocation: ${String(err)}`,
                confidence: 0,
            });
        }
    }

    /**
     * Recall энграммы, релевантные запросу эксперта.
     */
    private async recallExpertEngrams(
        request: ExpertInvocationRequest,
    ): Promise<RankedEngram[]> {
        if (!this.engramService) return [];

        const embedding = buildTextEmbedding(request.query);

        const recallCtx: EngramRecallContext = {
            companyId: request.companyId,
            embedding,
            limit: request.mode === 'full_pro' ? 20 : 5,
            minSimilarity: 0.5,
        };

        if (request.context?.crop) {
            recallCtx.type = 'AGRO';
        }

        return this.engramService.recallEngrams(recallCtx).catch((err) => {
            this.logger.warn(`expert_engram_recall error=${String(err)}`);
            return [];
        });
    }

    /**
     * Основная логика expert-tier (deterministic, rule-based).
     * В будущем: LLM PRO-модель через OpenRouter.
     */
    private async executeExpertLogic(
        request: ExpertInvocationRequest,
        engrams: RankedEngram[],
    ): Promise<ExpertInvocationResult> {
        const startedAt = Date.now();

        // Формируем recommendations из энграмм
        const recommendations = engrams.slice(0, 5).map((engram) => ({
            action: engram.content.slice(0, 200),
            priority: (engram.compositeScore > 0.8 ? 'HIGH' : engram.compositeScore > 0.5 ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
            rationale: `Основано на ${engram.activationCount} активациях, success rate ${(engram.successRate * 100).toFixed(0)}%`,
            alternatives: engram.keyInsights?.slice(0, 2),
        }));

        // Формируем evidence
        const evidence = engrams.slice(0, 3).map((engram) => ({
            type: 'engram',
            source: `engram:${engram.id}`,
            content: `[${engram.category}] ${engram.content.slice(0, 150)}`,
        }));

        // Определяем confidence на основе качества энграмм
        const avgScore = engrams.length > 0
            ? engrams.reduce((sum, e) => sum + e.compositeScore, 0) / engrams.length
            : 0;

        // Строим ответ
        const responseParts: string[] = [];
        if (request.role === 'chief_agronomist') {
            responseParts.push(`## Экспертное заключение агронома`);
            responseParts.push(`**Запрос:** ${request.query}`);
            responseParts.push(`**Режим:** ${request.mode === 'full_pro' ? 'Полная экспертиза (PRO)' : 'Быстрый анализ'}`);
            responseParts.push(`**Уверенность:** ${(avgScore * 100).toFixed(0)}%`);
            responseParts.push(`**Использовано энграмм:** ${engrams.length}`);

            if (recommendations.length > 0) {
                responseParts.push(`\n### Рекомендации:`);
                recommendations.forEach((rec, i) => {
                    responseParts.push(`${i + 1}. [${rec.priority}] ${rec.action}`);
                    responseParts.push(`   _Обоснование:_ ${rec.rationale}`);
                });
            }
        } else {
            responseParts.push(`## Аналитическое заключение`);
            responseParts.push(`**Запрос:** ${request.query}`);
            responseParts.push(`**Данных проанализировано:** ${engrams.length} энграмм`);
        }

        return {
            role: request.role,
            mode: request.mode,
            status: 'COMPLETED',
            traceId: request.traceId,
            response: responseParts.join('\n'),
            structuredOutput: {
                engramCount: engrams.length,
                avgCompositeScore: avgScore,
                context: request.context,
            },
            engramsUsed: engrams.slice(0, 10).map((e) => ({
                id: e.id,
                category: e.category,
                compositeScore: e.compositeScore,
                content: e.content.slice(0, 200),
            })),
            confidence: avgScore,
            evidence,
            recommendations,
            durationMs: Date.now() - startedAt,
        };
    }

    /**
     * Проверяет лимит PRO-вызовов.
     */
    private async checkCostBudget(companyId: string, role: string): Promise<boolean> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await this.prisma.aiAuditEntry.count({
            where: {
                companyId,
                createdAt: { gte: today },
                metadata: {
                    path: ['expertRole'],
                    equals: role,
                },
            },
        });

        return count < this.MAX_PRO_CALLS_PER_DAY;
    }

    /**
     * Логирование вызова в AiAuditEntry.
     */
    private async logInvocation(
        request: ExpertInvocationRequest,
        result: ExpertInvocationResult,
    ): Promise<void> {
        await this.prisma.aiAuditEntry.create({
            data: {
                traceId: request.traceId,
                companyId: request.companyId,
                toolNames: [`expert:${request.role}:${request.mode}`],
                model: request.mode === 'full_pro' ? 'pro' : 'deterministic',
                intentMethod: 'expert_invocation',
                tokensUsed: 0,
                metadata: {
                    expertRole: request.role,
                    expertMode: request.mode,
                    engramsUsed: result.engramsUsed.length,
                    confidence: result.confidence,
                    status: result.status,
                    durationMs: result.durationMs,
                    context: request.context,
                } as any,
            },
        }).catch((err) => {
            this.logger.warn(`expert_audit_log error=${String(err)}`);
        });
    }

    /**
     * Utility: построение базового результата.
     */
    private buildResult(
        request: ExpertInvocationRequest,
        startedAt: number,
        overrides: Partial<ExpertInvocationResult>,
    ): ExpertInvocationResult {
        return {
            role: request.role,
            mode: request.mode,
            status: 'COMPLETED',
            traceId: request.traceId,
            response: '',
            structuredOutput: {},
            engramsUsed: [],
            confidence: 0,
            evidence: [],
            recommendations: [],
            durationMs: Date.now() - startedAt,
            ...overrides,
        };
    }
}
