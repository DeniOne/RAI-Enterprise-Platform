import { Injectable, Logger, Optional } from '@nestjs/common';
import { EngramService } from '../../../shared/memory/engram.service';
import { WorkingMemoryService, ActiveAlert } from '../../../shared/memory/working-memory.service';
import { buildTextEmbedding } from '../../../shared/memory/signal-embedding.util';
import { RankedEngram } from '../../../shared/memory/engram.types';
import {
    ExpertInvocationEngine,
    ExpertInvocationRequest,
    ExpertInvocationResult,
} from './expert-invocation.engine';

/**
 * ChiefAgronomistService — Phase 3.2 + 3.3
 *
 * Цифровой Мега-Агроном. Два режима:
 *
 * Lightweight (Engram Curator):
 *   - Потребляет алерты от monitoring + результаты от agronomist
 *   - Производит мини-типсы, обогащённые энграммами
 *   - Дешёвая модель, фоновый
 *
 * Full PRO (Deep Expert):
 *   - Активируется по запросу человека
 *   - Полный контекст: энграмы + knowledge corpus
 *   - Структурированные заключения с confidence scores
 */

export interface AgroTip {
    id: string;
    type: 'WARNING' | 'RECOMMENDATION' | 'INSIGHT';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    rationale: string;
    engramId?: string;
    confidence: number;
    actionRequired: boolean;
    bbchWindow?: string;
}

export interface ExpertOpinion {
    traceId: string;
    query: string;
    opinion: string;
    confidence: number;
    recommendations: ExpertInvocationResult['recommendations'];
    evidence: ExpertInvocationResult['evidence'];
    alternatives: Array<{
        product: string;
        isPartner: boolean;
        rationale: string;
        efficacy: number;
    }>;
    engramsUsed: number;
    durationMs: number;
}

@Injectable()
export class ChiefAgronomistService {
    private readonly logger = new Logger(ChiefAgronomistService.name);

    constructor(
        private readonly expertEngine: ExpertInvocationEngine,
        @Optional() private readonly engramService?: EngramService,
        @Optional() private readonly workingMemoryService?: WorkingMemoryService,
    ) { }

    // ========================================================================
    // LIGHTWEIGHT MODE — Engram Curator (фоновый, дешёвый)
    // ========================================================================

    /**
     * Генерирует мини-типсы по активным алертам (CA-3.2).
     */
    async generateAlertTips(
        companyId: string,
        traceId: string,
    ): Promise<AgroTip[]> {
        const tips: AgroTip[] = [];

        // 1. Получаем активные алерты
        const alerts = this.workingMemoryService
            ? await this.workingMemoryService.getActiveAlerts(companyId).catch(() => [])
            : [];

        if (alerts.length === 0) {
            this.logger.debug(`chief_tips no_alerts companyId=${companyId}`);
            return tips;
        }

        // 2. Для каждого алерта recall энграмм
        for (const alert of alerts.slice(0, 5)) {
            const alertTips = await this.generateTipForAlert(alert, companyId, traceId);
            tips.push(...alertTips);
        }

        this.logger.log(
            `chief_tips companyId=${companyId} alerts=${alerts.length} tips=${tips.length}`,
        );

        return tips;
    }

    /**
     * Генерирует типы для конкретного алерта на основе энграмм.
     */
    private async generateTipForAlert(
        alert: ActiveAlert,
        companyId: string,
        traceId: string,
    ): Promise<AgroTip[]> {
        if (!this.engramService) return [];

        const embedding = buildTextEmbedding(
            `${alert.type} ${alert.message} ${alert.severity}`,
        );

        const engrams = await this.engramService
            .recallEngrams({
                companyId,
                embedding,
                limit: 3,
                minSimilarity: 0.55,
                filters: { type: 'AGRO' },
            })
            .catch(() => [] as RankedEngram[]);

        return engrams.map((engram) => {
            const isNegative = engram.successRate < 0.5;
            return {
                id: `tip_${alert.id}_${engram.id}`,
                type: isNegative ? 'WARNING' as const : 'RECOMMENDATION' as const,
                severity: alert.severity === 'CRITICAL' ? 'HIGH' as const : 'MEDIUM' as const,
                message: isNegative
                    ? `⚠️ Из опыта: подобная ситуация в прошлом привела к проблемам (${(engram.successRate * 100).toFixed(0)}% успеха)`
                    : `💡 Рекомендация на основе ${engram.activationCount} случаев`,
                rationale: engram.content.slice(0, 300),
                engramId: engram.id,
                confidence: engram.compositeScore,
                actionRequired: isNegative && alert.severity === 'CRITICAL',
                bbchWindow: (engram as any).triggerConditions?.bbch,
            };
        });
    }

    /**
     * Обогащает техкарту энграммами (CA-3.2 extension).
     */
    async enrichTechMapContext(
        companyId: string,
        crop: string,
        traceId: string,
    ): Promise<RankedEngram[]> {
        if (!this.engramService) return [];

        const embedding = buildTextEmbedding(`техкарта ${crop} агрономия`);

        return this.engramService
            .recallEngrams({
                companyId,
                embedding,
                limit: 10,
                minSimilarity: 0.5,
                filters: { type: 'AGRO' },
            })
            .catch(() => []);
    }

    // ========================================================================
    // FULL PRO MODE — Deep Expert (on-demand, тяжёлый)
    // ========================================================================

    /**
     * Полная экспертиза по запросу (CA-3.3).
     */
    async deepExpertise(
        companyId: string,
        query: string,
        traceId: string,
        context?: ExpertInvocationRequest['context'],
        userId?: string,
    ): Promise<ExpertOpinion> {
        const startedAt = Date.now();

        const result = await this.expertEngine.invoke({
            role: 'chief_agronomist',
            mode: 'full_pro',
            companyId,
            traceId,
            userId,
            query,
            context,
        });

        // Ethical guardrail: ТОП-3 альтернативы (CA-3.5)
        const alternatives = this.generateAlternatives(result);

        return {
            traceId,
            query,
            opinion: result.response,
            confidence: result.confidence,
            recommendations: result.recommendations,
            evidence: result.evidence,
            alternatives,
            engramsUsed: result.engramsUsed.length,
            durationMs: Date.now() - startedAt,
        };
    }

    // ========================================================================
    // ETHICAL GUARDRAIL — Commercial Transparency (CA-3.5)
    // ========================================================================

    /**
     * Генерирует ТОП-3 альтернативы для каждой рекомендации.
     * Тег [ПАРТНЁР] на коммерческих продуктах.
     * «Наука побеждает партнёрство» правило.
     */
    private generateAlternatives(
        result: ExpertInvocationResult,
    ): ExpertOpinion['alternatives'] {
        // Placeholder: в production будет LLM + knowledge corpus
        return [
            {
                product: 'Вариант на основе энграмм системы',
                isPartner: false,
                rationale: `Рекомендация основана на ${result.engramsUsed.length} энграммах опыта`,
                efficacy: result.confidence,
            },
        ];
    }
}
