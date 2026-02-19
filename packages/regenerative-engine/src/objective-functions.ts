/**
 * Objective functions and dynamic weighting for Level E MOS.
 */

export enum ContractType {
    SEASONAL_OPTIMIZATION = 'SEASONAL_OPTIMIZATION',
    MULTI_YEAR_ADVISORY = 'MULTI_YEAR_ADVISORY',
    MANAGED_REGENERATIVE = 'MANAGED_REGENERATIVE'
}

export interface StrategyMetrics {
    revenue: number;
    roi: number;
    deltaSri: number;
    bps: number;
    sri_t: number; // Current SRI at time t
}

export class ObjectiveFunctions {
    /**
     * Calculates the multi-objective vector: [Efficiency, Regeneration]
     */
    static evaluate(metrics: StrategyMetrics, contractType: ContractType = ContractType.SEASONAL_OPTIMIZATION): number[] {
        const sri = metrics.sri_t;

        // 1. Dynamic Weighting Policy (Hardened for Contract-Driven Model)
        // INVARIANT: Proportional override logic is EXCLUSIVE to MANAGED mode.
        let w_regeneration = 0.2; // Base penalty/incentive for SEASONAL/ADVISORY

        if (contractType === ContractType.MANAGED_REGENERATIVE) {
            // Managed Mode: Proportional override based on SRI safety
            if (sri < 0.4) {
                w_regeneration = 1.0; // Emergency Mode
            } else if (sri < 0.6) {
                w_regeneration = 0.8; // Recovery Mode
            } else {
                w_regeneration = 0.6; // High standard
            }
        } else if (contractType === ContractType.MULTI_YEAR_ADVISORY) {
            // Advisory: Enhanced weight but NOT absolute override
            w_regeneration = 0.4;
        } else {
            // Seasonal: SRI is a fixed penalty term, NEVER reaches 1.0 automatically.
            w_regeneration = 0.2;
        }

        const w_efficiency = 1.0 - w_regeneration;

        // 2. Efficiency Score (Revenue + ROI)
        const efficiency = metrics.revenue + metrics.roi;

        // 3. Regeneration Score (Soil Health + Biodiversity)
        const regeneration = metrics.deltaSri + (1.0 - metrics.bps);

        return [
            efficiency * w_efficiency,
            regeneration * w_regeneration
        ];
    }

    /**
     * Calculates Constraint Violation (CV)
     * Based on Invariants I34, I36, I41 (Contract-Driven)
     */
    static calculateCV(metrics: StrategyMetrics, contractType: ContractType = ContractType.SEASONAL_OPTIMIZATION): number {
        let cv = 0;

        // I36: Biodiversity Pressure Score (BPS) < 0.8 (Universal Guardrail)
        if (metrics.bps > 0.8) {
            cv += (metrics.bps - 0.8);
        }

        // I41: Regeneration Guard
        // INVARIANT: Hard blocking is EXCLUSIVE to MANAGED mode.
        if (contractType === ContractType.MANAGED_REGENERATIVE) {
            // Hard Guard: ΔSRI must be > 0 if soil is below recovery threshold (0.6)
            if (metrics.sri_t < 0.6 && metrics.deltaSri <= 0) {
                cv += (0.01 - metrics.deltaSri);
            }
        } else {
            // SEASONAL/ADVISORY: Advisory alerts only, no hard blocking of evolution.
            // Human decision remains sovereign per Level C consistency.
            if (metrics.sri_t < 0.3 && metrics.deltaSri <= -0.1) {
                cv += 0.001; // Negligible penalty to flag as "not optimal" but not "blocked"
            }
        }

        return cv;
    }
}
