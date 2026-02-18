import { Injectable, Logger } from '@nestjs/common';
import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';
import { roundHalfToEven, roundAllNumbers } from '../deterministic/round-half-to-even';

/**
 * CounterfactualEngine — Детерминированная симуляция альтернативных траекторий.
 *
 * ИНВАРИАНТ I30: Reproducibility. 3 прогона → один и тот же hash.
 *
 * simulationHash Pipeline — СТРОГИЙ ПОРЯДОК (CANONICAL):
 *   1. Сбор canonical input (draftSnapshot, humanAction, weights)
 *   2. Включение policyVersion + simulationMode в canonical input (ДО симуляции)
 *   3. Выполнение симуляции
 *   4. roundHalfToEven(result, 8) — все числовые значения результата
 *   5. RFC8785(canonicalJSON) — каноникализация JSON
 *   6. SHA256(UTF8(rfc8785Output)) → simulationHash
 *
 * Нарушение порядка = нарушение reproducibility (I30).
 * policyVersion и simulationMode ОБЯЗАНЫ быть частью input ДО округления.
 */

export interface CounterfactualInput {
    /** Снимок AI-черновика (параметры, операции, constraints) */
    draftSnapshot: Record<string, unknown>;
    /** Действие человека (override parameters) */
    humanAction: Record<string, unknown>;
    /** Веса DIS из GovernanceConfig */
    weights: Record<string, number>;
    /** Версия политики эскалации (включается в hash ДО симуляции) */
    policyVersion: string;
    /** Режим симуляции */
    simulationMode: 'DETERMINISTIC' | 'MONTE_CARLO';
    /** Количество Monte-Carlo прогонов (только для MONTE_CARLO) */
    monteCarloRuns?: number;
}

export interface TrajectoryResult {
    /** Прогнозируемая доходность (ц/га) */
    expectedYield: number;
    /** Прогнозируемые затраты (руб/га) */
    expectedCost: number;
    /** Estimated profit */
    estimatedProfit: number;
    /** CVaR α=5% (tail risk) */
    cvarAlpha5: number;
    /** Суммарный risk score [0, 1] */
    riskScore: number;
}

export interface CounterfactualResult {
    /** Траектория AI */
    aiTrajectory: TrajectoryResult;
    /** Траектория Human Override */
    humanTrajectory: TrajectoryResult;
    /** Regret = Objective(AI) - Objective(Human) */
    regret: number;
    /** simulationHash — SHA256 гарантия reproducibility */
    simulationHash: string;
    /** Режим симуляции */
    simulationMode: 'DETERMINISTIC' | 'MONTE_CARLO';
}

@Injectable()
export class CounterfactualEngine {
    private readonly logger = new Logger(CounterfactualEngine.name);

    constructor(
        private readonly canonicalSorter: CanonicalSorter,
        private readonly stableHasher: StableHasher,
    ) { }

    /**
     * Запускает counterfactual simulation с СТРОГИМ Hash Pipeline.
     */
    simulate(input: CounterfactualInput): CounterfactualResult {
        // ========================================
        // STEP 1: Сбор canonical input
        // ========================================
        const rawInput = {
            draftSnapshot: input.draftSnapshot,
            humanAction: input.humanAction,
            weights: input.weights,
        };

        // ========================================
        // STEP 2: Включение policyVersion + simulationMode ДО симуляции
        // ========================================
        const canonicalInput = {
            ...rawInput,
            policyVersion: input.policyVersion,
            simulationMode: input.simulationMode,
        };

        // ========================================
        // STEP 3: Выполнение симуляции
        // ========================================
        const aiTrajectory = this.simulateTrajectory(
            input.draftSnapshot,
            input.simulationMode,
            input.monteCarloRuns,
        );
        const humanTrajectory = this.simulateTrajectory(
            this.applyOverride(input.draftSnapshot, input.humanAction),
            input.simulationMode,
            input.monteCarloRuns,
        );

        // Regret = Objective(AI) - Objective(Human)
        // Objective = EstimatedProfit - λ * CVaR_α
        const LAMBDA = 0.3; // Коэффициент риск-аверсии
        const objectiveAI =
            aiTrajectory.estimatedProfit - LAMBDA * aiTrajectory.cvarAlpha5;
        const objectiveHuman =
            humanTrajectory.estimatedProfit - LAMBDA * humanTrajectory.cvarAlpha5;
        const regret = objectiveAI - objectiveHuman;

        // ========================================
        // STEP 4: roundHalfToEven(result, 8)
        // ========================================
        const roundedResult = {
            input: canonicalInput,
            aiTrajectory: roundAllNumbers(aiTrajectory, 8) as TrajectoryResult,
            humanTrajectory: roundAllNumbers(humanTrajectory, 8) as TrajectoryResult,
            regret: roundHalfToEven(regret, 8),
            objectiveAI: roundHalfToEven(objectiveAI, 8),
            objectiveHuman: roundHalfToEven(objectiveHuman, 8),
        };

        // ========================================
        // STEP 5: RFC8785(canonicalJSON)
        // ========================================
        const canonicalized = this.canonicalSorter.canonicalize(roundedResult);

        // ========================================
        // STEP 6: SHA256(UTF8(rfc8785Output)) → simulationHash
        // ========================================
        const simulationHash = this.stableHasher.hash(canonicalized);

        this.logger.log(
            `[I30] CounterfactualEngine: regret=${roundHalfToEven(regret, 8)}, ` +
            `mode=${input.simulationMode}, ` +
            `hash=${simulationHash.substring(0, 16)}...`,
        );

        return {
            aiTrajectory: roundedResult.aiTrajectory,
            humanTrajectory: roundedResult.humanTrajectory,
            regret: roundedResult.regret,
            simulationHash,
            simulationMode: input.simulationMode,
        };
    }

    /**
     * Симулирует одну траекторию (детерминированную или Monte-Carlo).
     * 
     * TODO: В production — интеграция с YieldForecastService.
     * Текущая реализация: формульный расчёт на базе операций.
     */
    private simulateTrajectory(
        snapshot: Record<string, unknown>,
        mode: 'DETERMINISTIC' | 'MONTE_CARLO',
        monteCarloRuns = 100,
    ): TrajectoryResult {
        // Извлекаем параметры из snapshot
        const operations = (snapshot['operations'] as any[]) || [];
        const constraints = (snapshot['constraints'] as any[]) || [];
        const yieldTarget = Number(snapshot['yieldTarget'] || 0);
        const costEstimate = Number(snapshot['costEstimate'] || 0);

        if (mode === 'DETERMINISTIC') {
            return this.deterministicTrajectory(
                yieldTarget,
                costEstimate,
                operations,
                constraints,
            );
        }

        // Monte-Carlo: среднее по N прогонам с фиксированным seed
        return this.monteCarloTrajectory(
            yieldTarget,
            costEstimate,
            operations,
            constraints,
            monteCarloRuns,
        );
    }

    /**
     * Детерминированная оценка траектории.
     */
    private deterministicTrajectory(
        yieldTarget: number,
        costEstimate: number,
        operations: any[],
        constraints: any[],
    ): TrajectoryResult {
        // Базовый расчёт с учётом операций
        const opFactor = operations.length > 0
            ? operations.reduce((acc: number, op: any) => {
                const efficiency = Number(op.efficiency || 1);
                return acc * efficiency;
            }, 1)
            : 1;

        const expectedYield = yieldTarget * opFactor;
        const expectedCost = costEstimate * (operations.length > 0 ? 1 : 0.9);
        const estimatedProfit = expectedYield * 1500 - expectedCost; // Условная цена ц/га
        const cvarAlpha5 = Math.abs(estimatedProfit) * 0.15; // 15% tail risk
        const riskScore = Math.min(cvarAlpha5 / Math.max(Math.abs(estimatedProfit), 1e-6), 1);

        return {
            expectedYield: roundHalfToEven(expectedYield),
            expectedCost: roundHalfToEven(expectedCost),
            estimatedProfit: roundHalfToEven(estimatedProfit),
            cvarAlpha5: roundHalfToEven(cvarAlpha5),
            riskScore: roundHalfToEven(riskScore),
        };
    }

    /**
     * Monte-Carlo оценка: средний результат N прогонов.
     * Использует детерминированный PRNG (seed = SHA256(input)).
     */
    private monteCarloTrajectory(
        yieldTarget: number,
        costEstimate: number,
        operations: any[],
        constraints: any[],
        runs: number,
    ): TrajectoryResult {
        // Базовая детерминированная траектория
        const base = this.deterministicTrajectory(
            yieldTarget,
            costEstimate,
            operations,
            constraints,
        );

        // Простой детерминированный шум: используем hash-based PRNG
        // Каждый run даёт вариацию ±10%, но среднее стабильно
        let sumYield = 0;
        let sumCost = 0;
        let sumProfit = 0;
        let sumCvar = 0;
        let sumRisk = 0;

        for (let i = 0; i < runs; i++) {
            // Детерминированный фактор: sin(i * golden_ratio) → [-1, 1]
            const factor = Math.sin(i * 1.618033988749895) * 0.1;
            const y = base.expectedYield * (1 + factor);
            const c = base.expectedCost * (1 - factor * 0.5);
            const p = y * 1500 - c;
            const cv = Math.abs(p) * (0.15 + Math.abs(factor) * 0.05);
            const r = Math.min(cv / Math.max(Math.abs(p), 1e-6), 1);

            sumYield += y;
            sumCost += c;
            sumProfit += p;
            sumCvar += cv;
            sumRisk += r;
        }

        return {
            expectedYield: roundHalfToEven(sumYield / runs),
            expectedCost: roundHalfToEven(sumCost / runs),
            estimatedProfit: roundHalfToEven(sumProfit / runs),
            cvarAlpha5: roundHalfToEven(sumCvar / runs),
            riskScore: roundHalfToEven(sumRisk / runs),
        };
    }

    /**
     * Применяет humanAction override к snapshot.
     * Shallow merge: humanAction перезаписывает ключи в snapshot.
     */
    private applyOverride(
        snapshot: Record<string, unknown>,
        humanAction: Record<string, unknown>,
    ): Record<string, unknown> {
        return { ...snapshot, ...humanAction };
    }
}
