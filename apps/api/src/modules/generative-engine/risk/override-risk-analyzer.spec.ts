import { OverrideRiskAnalyzer, OverrideAnalysisInput } from './override-risk-analyzer';
import { RiskMetricCalculator } from './risk-metric-calculator';
import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';

/**
 * Тесты OverrideRiskAnalyzer — ΔRisk и Hash Pipeline.
 */
describe('OverrideRiskAnalyzer', () => {
    let analyzer: OverrideRiskAnalyzer;

    const DEFAULT_INPUT: OverrideAnalysisInput = {
        aiDraft: {
            yieldExpected: 30,
            yieldOverride: 30,
            costExpected: 45000,
            costOverride: 45000,
            complianceScore: 1.0,
        },
        humanOverride: {
            yieldExpected: 30,
            yieldOverride: 25,
            costExpected: 45000,
            costOverride: 50000,
            complianceScore: 0.9,
        },
        policyVersion: 'v1.0.0',
        simulationMode: 'DETERMINISTIC',
    };

    beforeEach(() => {
        const riskCalc = new RiskMetricCalculator();
        const canonicalSorter = new CanonicalSorter();
        const stableHasher = new StableHasher();
        analyzer = new OverrideRiskAnalyzer(riskCalc, canonicalSorter, stableHasher);
    });

    describe('ΔRisk нормализация', () => {
        it('ΔRisk ∈ [-1, 1]', () => {
            const result = analyzer.analyze(DEFAULT_INPUT);
            expect(result.deltaRisk).toBeGreaterThanOrEqual(-1);
            expect(result.deltaRisk).toBeLessThanOrEqual(1);
        });

        it('идентичные AI и Human → ΔRisk = 0', () => {
            const sameInput: OverrideAnalysisInput = {
                ...DEFAULT_INPUT,
                humanOverride: { ...DEFAULT_INPUT.aiDraft },
            };
            const result = analyzer.analyze(sameInput);
            expect(result.deltaRisk).toBe(0);
        });

        it('увеличение риска → ΔRisk > 0', () => {
            const result = analyzer.analyze(DEFAULT_INPUT);
            // humanOverride с меньшим yield и большим cost → больший риск
            expect(result.deltaRisk).toBeGreaterThan(0);
        });
    });

    describe('Hash Pipeline', () => {
        it('пожалуйста, simulationHash — 64 hex chars', () => {
            const result = analyzer.analyze(DEFAULT_INPUT);
            expect(result.simulationHash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('детерминизм: 3 прогона → один hash', () => {
            const r1 = analyzer.analyze(DEFAULT_INPUT);
            const r2 = analyzer.analyze(DEFAULT_INPUT);
            const r3 = analyzer.analyze(DEFAULT_INPUT);
            expect(r1.simulationHash).toBe(r2.simulationHash);
            expect(r2.simulationHash).toBe(r3.simulationHash);
        });

        it('policyVersion влияет на hash', () => {
            const r1 = analyzer.analyze(DEFAULT_INPUT);
            const r2 = analyzer.analyze({
                ...DEFAULT_INPUT,
                policyVersion: 'v2.0.0',
            });
            expect(r1.simulationHash).not.toBe(r2.simulationHash);
        });
    });

    describe('System Fallback', () => {
        it('нормальный расчёт → isSystemFallback = false', () => {
            const result = analyzer.analyze(DEFAULT_INPUT);
            expect(result.isSystemFallback).toBe(false);
        });
    });
});
