/**
 * Velocity Calculator for Soil Regeneration Index (SRI)
 */
export class VelocityCalculator {
    /**
     * Calculates SRI Velocity: ΔSRI / Δt (per year)
     * Result > 0 means Regeneration (Level E goal)
     * Result < 0 means Degradation (Invariant I41 trigger)
     */
    static calculateVelocity(
        initialSri: number,
        currentSri: number,
        yearsDelta: number
    ): number {
        if (yearsDelta <= 0) return 0;
        const delta = currentSri - initialSri;
        const velocity = delta / yearsDelta;
        return Math.round(velocity * 1e6) / 1e6;
    }
}
