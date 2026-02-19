/**
 * TrustEngine - Calculates Data Integrity Trust Score
 * Inputs:
 * - Signature Validity (Binary)
 * - Source Reputation (0-1)
 * - Data Staleness (Days)
 * - Drift History Penalty (PSI/KL)
 */

export interface TrustInput {
    isSignatureVerified: boolean;
    sourceReputation: number; // [0,1]
    dataAgeDays: number;
    driftPenalty?: number; // Calculated from KL Divergence or PSI
}

export class TrustEngine {
    private static readonly STALENESS_THRESHOLD = 30; // 30 days
    private static readonly BASE_STALENESS_PENALTY = 0.02; // 2% per day after threshold

    static calculateTrustScore(input: TrustInput): number {
        let score = input.sourceReputation;

        // 1. Signature Hardening (Prerequisite for high trust)
        if (!input.isSignatureVerified) {
            // In SHADOW mode we might still use it, but trust is minimal
            score *= 0.1;
        }

        // 2. Staleness Adjustment
        if (input.dataAgeDays > this.STALENESS_THRESHOLD) {
            const extraDays = input.dataAgeDays - this.STALENESS_THRESHOLD;
            const penalty = Math.min(0.5, extraDays * this.BASE_STALENESS_PENALTY);
            score *= (1 - penalty);
        }

        // 3. Drift Compensation
        if (input.driftPenalty) {
            score *= (1 - Math.min(0.8, input.driftPenalty));
        }

        // Ensure boundedness
        const finalScore = Math.max(0.1, Math.min(1.0, score));
        return Math.round(finalScore * 1e6) / 1e6;
    }
}
