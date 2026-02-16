import { MONEY_SCALE, roundMoney } from './monetary-rounding.policy';

describe('monetary-rounding.policy', () => {
    it('rounds to canonical 4 decimals', () => {
        expect(roundMoney(12.345678)).toBe(12.3457);
        expect(roundMoney(12.34564)).toBe(12.3456);
    });

    it('uses half-away-from-zero for ties', () => {
        expect(roundMoney(1.23445)).toBe(1.2345);
        expect(roundMoney(-1.23445)).toBe(-1.2345);
    });

    it('accepts explicit precision', () => {
        expect(roundMoney(9.995, 2)).toBe(10.0);
        expect(MONEY_SCALE).toBe(4);
    });
});
