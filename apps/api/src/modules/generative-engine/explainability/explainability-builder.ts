import { Injectable, Logger } from '@nestjs/common';
import type { GeneratedDraft, GeneratedStage, GeneratedOperation } from '../domain/draft-factory';
import { FactorExtractor } from './factor-extractor';
import { RationaleGenerator } from './rationale-generator';

/**
 * ExplainabilityBuilder — Объяснение генерации (I24).
 * 
 * ИНВАРИАНТ I24 (Generation Explainability):
 * Каждая генерация должна быть объяснима:
 * - Какая стратегия была использована и почему
 * - Какие факторы повлияли на решения
 * - Какие ограничения были применены
 * 
 * Timing: Post-deterministic (после финальной генерации).
 * НЕ влияет на hash/seed, создаётся ПОСЛЕ.
 */

export interface ExplainabilityReport {
    summary: string;
    strategyRationale: string;
    factors: ExplainFactor[];
    constraints: ExplainConstraint[];
    stageBreakdown: StageExplanation[];
    limitations: string[];
    generatedAt: string;
}

export interface ExplainFactor {
    name: string;
    value: unknown;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
}

export interface ExplainConstraint {
    type: string;
    field: string;
    operator: string;
    value: unknown;
    status: 'SATISFIED' | 'NOT_APPLICABLE';
    message: string;
}

export interface StageExplanation {
    stageName: string;
    sequence: number;
    operationCount: number;
    rationale: string;
}

@Injectable()
export class ExplainabilityBuilder {
    private readonly logger = new Logger(ExplainabilityBuilder.name);

    constructor(
        private readonly factorExtractor: FactorExtractor,
        private readonly rationaleGenerator: RationaleGenerator,
    ) { }

    /**
     * Строит отчёт explainability для сгенерированного черновика (I24).
     */
    buildReport(
        draft: GeneratedDraft,
        strategyName: string,
        strategyDescription?: string,
    ): ExplainabilityReport {
        // 1. Extract factors
        const factors = this.factorExtractor.extractFactors(draft);

        // 2. Generate rationale
        const strategyRationale = this.rationaleGenerator.generateRationale(factors);

        // 3. Map constraints
        const constraints = this.mapConstraints(draft);

        // 4. Build stage breakdown
        const stageBreakdown = this.buildStageBreakdown(draft.stages);

        const report: ExplainabilityReport = {
            summary: this.buildSummary(draft, strategyName),
            strategyRationale: strategyDescription || strategyRationale,
            factors: factors.map(f => ({
                name: f.type,
                value: null,
                impact: f.impact,
                description: f.description
            })),
            constraints,
            stageBreakdown,
            limitations: [
                'Генерация основана на шаблонах стратегии',
                'Требуется проверка агрономом (I17)'
            ],
            generatedAt: new Date().toISOString(),
        };

        return report;
    }

    private buildSummary(draft: GeneratedDraft, strategyName: string): string {
        return `Draft for ${draft.crop} based on ${strategyName}. Stages: ${draft.stages.length}.`;
    }

    private mapConstraints(draft: GeneratedDraft): ExplainConstraint[] {
        return (draft.propagatedConstraints || []).map((c) => ({
            type: c.type,
            field: c.field,
            operator: c.operator,
            value: c.value,
            status: 'SATISFIED',
            message: c.message,
        }));
    }

    private buildStageBreakdown(stages: GeneratedStage[]): StageExplanation[] {
        return stages.map((stage) => ({
            stageName: stage.name,
            sequence: stage.sequence,
            operationCount: stage.operations.length,
            rationale: `Standard sequence`,
        }));
    }
}
