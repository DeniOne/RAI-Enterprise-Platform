import { describe, it, expect } from '@jest/globals';
import { ScienceCalculator } from './sri-calculator';

describe('ScienceCalculator', () => {
    describe('calculateSRI', () => {
        it('should calculate geometric mean correctly', () => {
            const result = ScienceCalculator.calculateSRI(0.8, 0.9, 0.7);
            expect(result).toBeCloseTo(0.795811, 4);
        });

        it('should return 0 if any pillar is 0', () => {
            expect(ScienceCalculator.calculateSRI(0, 0.9, 0.7)).toBe(0);
        });

        it('should clip values to [0,1]', () => {
            const result = ScienceCalculator.calculateSRI(1.5, -0.5, 0.5);
            expect(result).toBe(0); // -0.5 becomes 0
        });
    });

    describe('calculateBPS', () => {
        it('should calculate BPS with penalty', () => {
            expect(ScienceCalculator.calculateBPS(0.8, 0.2)).toBe(0.6);
        });

        it('should clip BPS to [0,1]', () => {
            expect(ScienceCalculator.calculateBPS(1.5, 0)).toBe(1);
            expect(ScienceCalculator.calculateBPS(0.5, 0.8)).toBe(0);
        });
    });
});
