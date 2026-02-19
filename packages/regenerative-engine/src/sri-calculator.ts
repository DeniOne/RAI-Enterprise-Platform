/**
 * Soil Regeneration Index (SRI) Calculator
 * Implements Geometric Mean for non-compensatory weight property.
 * Range: [0.0, 1.0]
 */
export class ScienceCalculator {
    /**
     * Calculates SRI using geometric mean of three pillars.
     * If any pillar is 0, SRI becomes 0.
     */
    static calculateSRI(
        structural: number,
        chemical: number,
        biological: number
    ): number {
        // Basic validation and clipping
        const s = Math.max(0, Math.min(1, structural));
        const c = Math.max(0, Math.min(1, chemical));
        const b = Math.max(0, Math.min(1, biological));

        if (s === 0 || c === 0 || b === 0) {
            return 0;
        }

        // Geometric mean: (s * c * b)^(1/3)
        const rawSRI = Math.pow(s * c * b, 1 / 3);

        // High precision rounding (6 decimals for industrial grade)
        return Math.round(rawSRI * 1e6) / 1e6;
    }

    /**
     * Calculates Biodiversity Pressure Score (BPS)
     */
    static calculateBPS(shannonIndex: number, monoPenalty: number): number {
        const rawBPS = Math.max(0, Math.min(1, shannonIndex - monoPenalty));
        return Math.round(rawBPS * 1e6) / 1e6;
    }
}
