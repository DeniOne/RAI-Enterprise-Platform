import { EconomicEventType } from '@prisma/client';
import { CostAttributionRules } from './cost-attribution.rules';

describe('CostAttributionRules', () => {
    it('should be deterministic: same input produces same output', () => {
        const input = { type: EconomicEventType.COST_INCURRED, amount: 1000 };
        const result1 = CostAttributionRules.getAttributions(input);
        const result2 = CostAttributionRules.getAttributions(input);
        expect(result1).toEqual(result2);
    });

    it('should handle COST_INCURRED correctly', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.COST_INCURRED,
            amount: 500
        });
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ amount: 500, type: 'DEBIT', accountCode: 'OPERATIONAL_EXPENSE' });
        expect(result).toContainEqual({ amount: 500, type: 'CREDIT', accountCode: 'ACCOUNTS_PAYABLE' });
    });

    it('should handle REVENUE_RECOGNIZED correctly', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.REVENUE_RECOGNIZED,
            amount: 2000
        });
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ amount: 2000, type: 'DEBIT', accountCode: 'ACCOUNTS_RECEIVABLE' });
        expect(result).toContainEqual({ amount: 2000, type: 'CREDIT', accountCode: 'REVENUE' });
    });

    it('should handle OBLIGATION_CREATED correctly', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.OBLIGATION_CREATED,
            amount: 1500
        });
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ amount: 1500, type: 'DEBIT', accountCode: 'FUTURE_EXPENSE' });
        expect(result).toContainEqual({ amount: 1500, type: 'CREDIT', accountCode: 'OBLIGATION' });
    });

    it('should handle OBLIGATION_SETTLED correctly', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.OBLIGATION_SETTLED,
            amount: 1500
        });
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ amount: 1500, type: 'DEBIT', accountCode: 'OBLIGATION' });
        expect(result).toContainEqual({ amount: 1500, type: 'CREDIT', accountCode: 'CASH' });
    });

    it('should handle ADJUSTMENT correctly for positive amount', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.ADJUSTMENT,
            amount: 100
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ amount: 100, type: 'DEBIT', accountCode: 'ADJUSTMENT_ACCOUNT' });
    });

    it('should handle ADJUSTMENT correctly for negative amount', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.ADJUSTMENT,
            amount: -100
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ amount: 100, type: 'CREDIT', accountCode: 'ADJUSTMENT_ACCOUNT' });
    });

    it('should handle zero amounts correctly', () => {
        const result = CostAttributionRules.getAttributions({
            type: EconomicEventType.COST_INCURRED,
            amount: 0
        });
        expect(result).toHaveLength(2);
        expect(result[0].amount).toBe(0);
    });
});
