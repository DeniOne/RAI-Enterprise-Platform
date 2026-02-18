import { CounterfactualEngine, CounterfactualInput } from './counterfactual-engine';
import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';

/**
 * Тесты CounterfactualEngine — Детерминированная симуляция (I30).
 *
 * Критический тест: 3 прогона → один hash.
 * Hash Pipeline: input → policyVersion → simulate → round(8) → RFC8785 → SHA256
 */
describe('CounterfactualEngine', () => {
    let engine: CounterfactualEngine;
    let canonicalSorter: CanonicalSorter;
    let stableHasher: StableHasher;

    const DEFAULT_INPUT: CounterfactualInput = {
        draftSnapshot: {
            draftId: 'test-draft-1',
            operations: [{ name: 'Вспашка', efficiency: 0.95 }],
            constraints: [],
            yieldTarget: 30,
            costEstimate: 45000,
        },
        humanAction: {
            yieldTarget: 28,
            costEstimate: 42000,
        },
        weights: { w1: 0.3, w2: 0.3, w3: 0.2, w4: 0.2 },
        policyVersion: 'v1.0.0',
        simulationMode: 'DETERMINISTIC',
    };

    beforeEach(() => {
        canonicalSorter = new CanonicalSorter();
        stableHasher = new StableHasher();
        engine = new CounterfactualEngine(canonicalSorter, stableHasher);
    });

    describe('Детерминизм (I30) — 3 прогона → один hash', () => {
        it('DETERMINISTIC mode: 3 прогона дают идентичный simulationHash', () => {
            const r1 = engine.simulate(DEFAULT_INPUT);
            const r2 = engine.simulate(DEFAULT_INPUT);
            const r3 = engine.simulate(DEFAULT_INPUT);

            expect(r1.simulationHash).toBe(r2.simulationHash);
            expect(r2.simulationHash).toBe(r3.simulationHash);
            expect(r1.simulationHash).toHaveLength(64);
        });

        it('MONTE_CARLO mode: 3 прогона дают идентичный simulationHash', () => {
            const mcInput: CounterfactualInput = {
                ...DEFAULT_INPUT,
                simulationMode: 'MONTE_CARLO',
                monteCarloRuns: 50,
            };

            const r1 = engine.simulate(mcInput);
            const r2 = engine.simulate(mcInput);
            const r3 = engine.simulate(mcInput);

            expect(r1.simulationHash).toBe(r2.simulationHash);
            expect(r2.simulationHash).toBe(r3.simulationHash);
        });
    });

    describe('Hash Pipeline порядок', () => {
        it('policyVersion влияет на hash (включён ДО симуляции)', () => {
            const r1 = engine.simulate({
                ...DEFAULT_INPUT,
                policyVersion: 'v1.0.0',
            });
            const r2 = engine.simulate({
                ...DEFAULT_INPUT,
                policyVersion: 'v2.0.0',
            });

            expect(r1.simulationHash).not.toBe(r2.simulationHash);
        });

        it('simulationMode влияет на hash (включён ДО симуляции)', () => {
            const r1 = engine.simulate({
                ...DEFAULT_INPUT,
                simulationMode: 'DETERMINISTIC',
            });
            const r2 = engine.simulate({
                ...DEFAULT_INPUT,
                simulationMode: 'MONTE_CARLO',
                monteCarloRuns: 100,
            });

            expect(r1.simulationHash).not.toBe(r2.simulationHash);
        });
    });

    describe('Regret calculation', () => {
        it('regret — число', () => {
            const result = engine.simulate(DEFAULT_INPUT);
            expect(typeof result.regret).toBe('number');
            expect(isFinite(result.regret)).toBe(true);
        });

        it('идентичные AI и Human → regret ≈ 0', () => {
            const sameInput: CounterfactualInput = {
                ...DEFAULT_INPUT,
                humanAction: {}, // Без изменений
            };
            const result = engine.simulate(sameInput);
            expect(Math.abs(result.regret)).toBeLessThan(0.01);
        });
    });

    describe('Trajectory structure', () => {
        it('aiTrajectory содержит все поля', () => {
            const result = engine.simulate(DEFAULT_INPUT);
            expect(result.aiTrajectory).toHaveProperty('expectedYield');
            expect(result.aiTrajectory).toHaveProperty('expectedCost');
            expect(result.aiTrajectory).toHaveProperty('estimatedProfit');
            expect(result.aiTrajectory).toHaveProperty('cvarAlpha5');
            expect(result.aiTrajectory).toHaveProperty('riskScore');
        });

        it('humanTrajectory содержит все поля', () => {
            const result = engine.simulate(DEFAULT_INPUT);
            expect(result.humanTrajectory).toHaveProperty('expectedYield');
            expect(result.humanTrajectory).toHaveProperty('expectedCost');
        });

        it('simulationHash — 64 hex chars', () => {
            const result = engine.simulate(DEFAULT_INPUT);
            expect(result.simulationHash).toMatch(/^[a-f0-9]{64}$/);
        });
    });
});
