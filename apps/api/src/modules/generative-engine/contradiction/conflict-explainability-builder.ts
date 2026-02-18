import { Injectable, Logger } from '@nestjs/common';
import type { ConflictVector } from './conflict-matrix.service';

/**
 * ConflictExplainabilityBuilder — Объяснение расхождений Level C (I32).
 *
 * ИНВАРИАНТ I32:
 *   explanation ≠ empty string.
 *   Каждое расхождение должно быть объяснено человекочитаемым текстом.
 *
 * Timing: Post-analysis (после ConflictMatrix + OverrideRiskAnalyzer).
 */

export interface ConflictExplanation {
    summary: string;
    riskAssessment: string;
    conflictBreakdown: ConflictFactorExplanation[];
    recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
    recommendationReason: string;
    generatedAt: string;
}

export interface ConflictFactorExplanation {
    factor: string;
    value: number;
    weight: number;
    contribution: number;
    humanReadable: string;
}

export interface ConflictExplainInput {
    disScore: number;
    deltaRisk: number;
    conflictVector: ConflictVector;
    weights: { w1: number; w2: number; w3: number; w4: number };
    regret: number;
    simulationMode: string;
    humanAction: Record<string, unknown>;
    isSystemFallback: boolean;
}

@Injectable()
export class ConflictExplainabilityBuilder {
    private readonly logger = new Logger(ConflictExplainabilityBuilder.name);

    /**
     * Строит объяснение конфликта (I32).
     *
     * Результат ОБЯЗАН содержать non-empty summary.
     */
    buildExplanation(input: ConflictExplainInput): ConflictExplanation {
        const factors = this.buildFactorBreakdown(input);
        const recommendation = this.deriveRecommendation(input);
        const riskAssessment = this.buildRiskAssessment(input);

        const summary = this.buildSummary(input, recommendation);

        // I32: explanation ≠ empty string (paranoid guard)
        if (!summary || summary.trim().length === 0) {
            throw new Error(
                '[I32] ConflictExplainabilityBuilder: summary не может быть пустым.',
            );
        }

        return {
            summary,
            riskAssessment,
            conflictBreakdown: factors,
            recommendation,
            recommendationReason: this.buildRecommendationReason(
                input,
                recommendation,
            ),
            generatedAt: new Date().toISOString(),
        };
    }

    private buildSummary(
        input: ConflictExplainInput,
        recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT',
    ): string {
        const riskDirection =
            input.deltaRisk > 0 ? 'увеличивает' : input.deltaRisk < 0 ? 'снижает' : 'не изменяет';

        const disLevel =
            input.disScore > 0.7
                ? 'высокий'
                : input.disScore > 0.3
                    ? 'средний'
                    : 'низкий';

        return (
            `Человеческое решение ${riskDirection} риск на ${Math.abs(input.deltaRisk * 100).toFixed(1)}%. ` +
            `Уровень расхождения с AI: ${disLevel} (DIS=${input.disScore.toFixed(4)}). ` +
            `Рекомендация: ${recommendation}. ` +
            `Режим симуляции: ${input.simulationMode}.`
        );
    }

    private buildRiskAssessment(input: ConflictExplainInput): string {
        if (input.isSystemFallback) {
            return (
                'ВНИМАНИЕ: Анализ выполнен в режиме System Fallback. ' +
                'Результаты могут быть менее точными. Рекомендуется ручная проверка.'
            );
        }

        if (input.deltaRisk > 0.5) {
            return (
                `КРИТИЧЕСКИЙ РИСК: ΔRisk=${input.deltaRisk.toFixed(4)}. ` +
                'Человеческое решение значительно увеличивает риск. ' +
                'Настоятельно рекомендуется пересмотр.'
            );
        }

        if (input.deltaRisk > 0.2) {
            return (
                `ПОВЫШЕННЫЙ РИСК: ΔRisk=${input.deltaRisk.toFixed(4)}. ` +
                'Решение умеренно увеличивает риск. Рекомендуется экспертная оценка.'
            );
        }

        if (input.deltaRisk < -0.2) {
            return (
                `ПОЗИТИВНОЕ ОТКЛОНЕНИЕ: ΔRisk=${input.deltaRisk.toFixed(4)}. ` +
                'Человеческое решение снижает риск относительно AI-рекомендации.'
            );
        }

        return (
            `НОРМАЛЬНЫЙ УРОВЕНЬ: ΔRisk=${input.deltaRisk.toFixed(4)}. ` +
            'Отклонение в пределах допустимого.'
        );
    }

    private buildFactorBreakdown(
        input: ConflictExplainInput,
    ): ConflictFactorExplanation[] {
        const { conflictVector, weights } = input;

        return [
            {
                factor: 'Урожайность',
                value: conflictVector.yieldDivergence,
                weight: weights.w1,
                contribution: conflictVector.yieldDivergence * weights.w1,
                humanReadable: this.describeDeviation(
                    conflictVector.yieldDivergence,
                    'урожайности',
                ),
            },
            {
                factor: 'Затраты',
                value: conflictVector.costDivergence,
                weight: weights.w2,
                contribution: conflictVector.costDivergence * weights.w2,
                humanReadable: this.describeDeviation(
                    conflictVector.costDivergence,
                    'затрат',
                ),
            },
            {
                factor: 'Риск',
                value: conflictVector.riskDivergence,
                weight: weights.w3,
                contribution: conflictVector.riskDivergence * weights.w3,
                humanReadable: this.describeDeviation(
                    conflictVector.riskDivergence,
                    'рискового профиля',
                ),
            },
            {
                factor: 'Структура',
                value: conflictVector.structuralDivergence,
                weight: weights.w4,
                contribution: conflictVector.structuralDivergence * weights.w4,
                humanReadable: this.describeDeviation(
                    conflictVector.structuralDivergence,
                    'структуры операций',
                ),
            },
        ];
    }

    private describeDeviation(value: number, aspect: string): string {
        if (value < 0.1) return `Минимальное отклонение ${aspect}`;
        if (value < 0.3) return `Умеренное отклонение ${aspect}`;
        if (value < 0.6) return `Значительное отклонение ${aspect}`;
        return `Критическое отклонение ${aspect}`;
    }

    private deriveRecommendation(
        input: ConflictExplainInput,
    ): 'ACCEPT' | 'REVIEW' | 'REJECT' {
        // System fallback → всегда REVIEW
        if (input.isSystemFallback) return 'REVIEW';

        // Очень высокий DIS + высокий ΔRisk → REJECT
        if (input.disScore > 0.8 && input.deltaRisk > 0.5) return 'REJECT';

        // Средний+ DIS или повышенный ΔRisk → REVIEW
        if (input.disScore > 0.5 || input.deltaRisk > 0.3) return 'REVIEW';

        // Низкий DIS и ΔRisk → ACCEPT
        return 'ACCEPT';
    }

    private buildRecommendationReason(
        input: ConflictExplainInput,
        recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT',
    ): string {
        switch (recommendation) {
            case 'ACCEPT':
                return (
                    'Человеческое решение не создаёт значительного расхождения с AI. ' +
                    'Рекомендуется принять без дополнительной проверки.'
                );
            case 'REVIEW':
                return (
                    `DIS=${input.disScore.toFixed(4)}, ΔRisk=${input.deltaRisk.toFixed(4)}. ` +
                    'Рекомендуется рассмотрение экспертом перед подтверждением.'
                );
            case 'REJECT':
                return (
                    `ВЫСОКИЙ РИСК: DIS=${input.disScore.toFixed(4)}, ΔRisk=${input.deltaRisk.toFixed(4)}, ` +
                    `Regret=${input.regret.toFixed(2)}. ` +
                    'Настоятельно рекомендуется отклонить данное изменение.'
                );
        }
    }
}
