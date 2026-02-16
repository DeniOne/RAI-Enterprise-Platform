export const MONEY_SCALE = 4;

/**
 * Canonical monetary rounding policy for finance ledger paths:
 * half-away-from-zero, fixed precision = 4 decimals.
 */
export function roundMoney(value: number, scale = MONEY_SCALE): number {
    if (!Number.isFinite(value)) {
        throw new Error(`Invalid monetary value: ${value}`);
    }
    const factor = 10 ** scale;
    const epsilon = 1 / (factor * 100);
    const rounded = Math.sign(value) * Math.round((Math.abs(value) + epsilon) * factor) / factor;
    return Number(rounded.toFixed(scale));
}
