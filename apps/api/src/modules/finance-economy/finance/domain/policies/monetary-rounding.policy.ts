export const MONEY_SCALE = 4;

/**
 * Canonical monetary rounding policy for finance ledger paths:
 * half-away-from-zero, fixed precision = 4 decimals.
 */
export function roundMoney(value: number | any, scale = MONEY_SCALE): number {
    const val = typeof value?.toNumber === 'function' ? value.toNumber() : Number(value);
    if (!Number.isFinite(val)) {
        throw new Error(`Invalid monetary value: ${value}`);
    }
    const factor = 10 ** scale;
    const epsilon = 1 / (factor * 100);
    const rounded = Math.sign(val) * Math.round((Math.abs(val) + epsilon) * factor) / factor;
    return Number(rounded.toFixed(scale));
}
