import {
    ConflictExplainabilityBuilder,
    ConflictExplainInput,
} from './conflict-explainability-builder';

/**
 * Тесты ConflictExplainabilityBuilder — I32: explanation ≠ empty.
 */
describe('ConflictExplainabilityBuilder', () => {
    let builder: ConflictExplainabilityBuilder;

    const DEFAULT_INPUT: ConflictExplainInput = {
        disScore: 0.45,
        deltaRisk: 0.15,
        conflictVector: {
            yieldDivergence: 0.2,
            costDivergence: 0.3,
            riskDivergence: 0.15,
            structuralDivergence: 0.1,
        },
        weights: { w1: 0.3, w2: 0.3, w3: 0.2, w4: 0.2 },
        regret: -150,
        simulationMode: 'DETERMINISTIC',
        humanAction: { yieldTarget: 28 },
        isSystemFallback: false,
    };

    beforeEach(() => {
        builder = new ConflictExplainabilityBuilder();
    });

    describe('I32: explanation ≠ empty', () => {
        it('summary не пустая строка', () => {
            const result = builder.buildExplanation(DEFAULT_INPUT);
            expect(result.summary.length).toBeGreaterThan(0);
        });

        it('riskAssessment не пустая строка', () => {
            const result = builder.buildExplanation(DEFAULT_INPUT);
            expect(result.riskAssessment.length).toBeGreaterThan(0);
        });
    });

    describe('Recommendations', () => {
        it('низкий DIS + низкий ΔRisk → ACCEPT', () => {
            const result = builder.buildExplanation({
                ...DEFAULT_INPUT,
                disScore: 0.1,
                deltaRisk: 0.05,
            });
            expect(result.recommendation).toBe('ACCEPT');
        });

        it('средний DIS → REVIEW', () => {
            const result = builder.buildExplanation({
                ...DEFAULT_INPUT,
                disScore: 0.6,
                deltaRisk: 0.2,
            });
            expect(result.recommendation).toBe('REVIEW');
        });

        it('высокий DIS + высокий ΔRisk → REJECT', () => {
            const result = builder.buildExplanation({
                ...DEFAULT_INPUT,
                disScore: 0.9,
                deltaRisk: 0.7,
            });
            expect(result.recommendation).toBe('REJECT');
        });

        it('system fallback → REVIEW всегда', () => {
            const result = builder.buildExplanation({
                ...DEFAULT_INPUT,
                isSystemFallback: true,
            });
            expect(result.recommendation).toBe('REVIEW');
        });
    });

    describe('Factor breakdown', () => {
        it('содержит 4 фатора', () => {
            const result = builder.buildExplanation(DEFAULT_INPUT);
            expect(result.conflictBreakdown).toHaveLength(4);
        });

        it('каждый фактор имеет humanReadable', () => {
            const result = builder.buildExplanation(DEFAULT_INPUT);
            result.conflictBreakdown.forEach((f) => {
                expect(f.humanReadable.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Risk assessment levels', () => {
        it('критический ΔRisk → содержит КРИТИЧЕСКИЙ', () => {
            const result = builder.buildExplanation({
                ...DEFAULT_INPUT,
                deltaRisk: 0.7,
            });
            expect(result.riskAssessment).toContain('КРИТИЧЕСКИЙ');
        });

        it('отрицательный ΔRisk → ПОЗИТИВНОЕ', () => {
            const result = builder.buildExplanation({
                ...DEFAULT_INPUT,
                deltaRisk: -0.3,
            });
            expect(result.riskAssessment).toContain('ПОЗИТИВНОЕ');
        });
    });
});
