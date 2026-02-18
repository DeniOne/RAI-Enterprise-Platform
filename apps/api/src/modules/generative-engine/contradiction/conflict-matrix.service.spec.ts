import { ConflictMatrixService, ConflictMatrixInput, DISWeights } from './conflict-matrix.service';

/**
 * Тесты ConflictMatrixService — DIS = clamp(Σ wᵢfᵢ, 0, 1).
 */
describe('ConflictMatrixService', () => {
    let service: ConflictMatrixService;

    const DEFAULT_WEIGHTS: DISWeights = {
        w1: 0.3, w2: 0.3, w3: 0.2, w4: 0.2,
    };

    beforeEach(() => {
        service = new ConflictMatrixService();
    });

    describe('DIS формула', () => {
        it('идентичные AI и Human → DIS ≈ 0', () => {
            const result = service.calculate({
                aiYield: 30, humanYield: 30,
                aiCost: 45000, humanCost: 45000,
                deltaRisk: 0,
                aiOperationCount: 5, humanOperationCount: 5,
                weights: DEFAULT_WEIGHTS,
            });
            expect(result.disScore).toBe(0);
        });

        it('полное расхождение → DIS > 0', () => {
            const result = service.calculate({
                aiYield: 30, humanYield: 15,
                aiCost: 45000, humanCost: 90000,
                deltaRisk: 0.8,
                aiOperationCount: 5, humanOperationCount: 10,
                weights: DEFAULT_WEIGHTS,
            });
            expect(result.disScore).toBeGreaterThan(0);
            expect(result.disScore).toBeLessThanOrEqual(1);
        });
    });

    describe('Clamp bounds', () => {
        it('DIS ∈ [0, 1]', () => {
            const extremeInput: ConflictMatrixInput = {
                aiYield: 0.001, humanYield: 100,
                aiCost: 1, humanCost: 100000,
                deltaRisk: 1,
                aiOperationCount: 1, humanOperationCount: 100,
                weights: { w1: 0.5, w2: 0.3, w3: 0.1, w4: 0.1 },
            };
            const result = service.calculate(extremeInput);
            expect(result.disScore).toBeLessThanOrEqual(1);
            expect(result.disScore).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Zero-Denominator Safeguard', () => {
        it('aiYield = 0 → f1 = 0, safeguard triggered', () => {
            const result = service.calculate({
                aiYield: 0, humanYield: 10,
                aiCost: 45000, humanCost: 45000,
                deltaRisk: 0,
                aiOperationCount: 5, humanOperationCount: 5,
                weights: DEFAULT_WEIGHTS,
            });
            expect(result.zeroSafeguardTriggered).toBe(true);
            expect(result.conflictVector.yieldDivergence).toBe(0);
        });

        it('aiCost = 0 → f2 = 0, safeguard triggered', () => {
            const result = service.calculate({
                aiYield: 30, humanYield: 30,
                aiCost: 0, humanCost: 10000,
                deltaRisk: 0,
                aiOperationCount: 5, humanOperationCount: 5,
                weights: DEFAULT_WEIGHTS,
            });
            expect(result.zeroSafeguardTriggered).toBe(true);
            expect(result.conflictVector.costDivergence).toBe(0);
        });
    });

    describe('ConflictVector structure', () => {
        it('содержит все 4 фактора', () => {
            const result = service.calculate({
                aiYield: 30, humanYield: 25,
                aiCost: 45000, humanCost: 50000,
                deltaRisk: 0.3,
                aiOperationCount: 5, humanOperationCount: 7,
                weights: DEFAULT_WEIGHTS,
            });
            expect(result.conflictVector).toHaveProperty('yieldDivergence');
            expect(result.conflictVector).toHaveProperty('costDivergence');
            expect(result.conflictVector).toHaveProperty('riskDivergence');
            expect(result.conflictVector).toHaveProperty('structuralDivergence');
        });
    });

    describe('Weight validation', () => {
        it('сумма весов = 1.0 → valid', () => {
            expect(service.validateWeights(DEFAULT_WEIGHTS)).toBe(true);
        });

        it('сумма весов ≠ 1.0 → invalid', () => {
            expect(service.validateWeights({ w1: 0.5, w2: 0.5, w3: 0.5, w4: 0.5 })).toBe(false);
        });
    });
});
