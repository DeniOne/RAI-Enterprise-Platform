/**
 * Monte Carlo Stochastic Engine for Agricultural Strategy Simulation.
 */
export class StochasticEngine {
    /**
     * Runs Monte Carlo simulation for a given strategy over a time horizon.
     */
    static simulate(
        initialState: any,
        strategy: any,
        iterations: number = 1000,
        horizonYears: number = 5
    ): any {
        const results = [];

        for (let i = 0; i < iterations; i++) {
            let state = { ...initialState };
            const trajectory = [];

            for (let year = 1; year <= horizonYears; year++) {
                state = this.step(state, strategy);
                trajectory.push({ year, ...state });
            }
            results.push(trajectory);
        }

        return this.aggregate(results);
    }

    /**
     * Single time step simulation with stochastic noise.
     */
    private static step(state: any, strategy: any): any {
        // 1. Apply deterministic effects from strategy
        const yieldEffect = strategy.yieldBoost || 0;
        const sriEffect = strategy.sriRecovery || 0;

        // 2. Inject stochastic noise (Weather, Pests, Market)
        const noise = (Math.random() - 0.5) * 0.2; // 20% volatility

        return {
            sri: Math.max(0, Math.min(1, state.sri + sriEffect + noise * 0.1)),
            revenue: state.revenue * (1 + yieldEffect + noise)
        };
    }

    /**
     * Aggregate results into statistical indicators (Expected values, Tail risks).
     */
    private static aggregate(allTrajectories: any[][]): any {
        const lastYearResults = allTrajectories.map(t => t[t.length - 1]);

        // Efficiency (Expected Revenue)
        const expectedRevenue = lastYearResults.reduce((sum, r) => sum + r.revenue, 0) / lastYearResults.length;

        // Tail Risk (5th percentile SRI)
        const sortedSri = lastYearResults.map(r => r.sri).sort((a, b) => a - b);
        const p05_sri = sortedSri[Math.floor(sortedSri.length * 0.05)];

        // Convergence & Liquidity Gap
        const targetSri = 0.8; // Mock target
        const convergenceYear = this.findConvergenceYear(allTrajectories, targetSri);
        const liquidityGap = this.calculateLiquidityGap(allTrajectories);

        return {
            expectedRevenue,
            p05_sri,
            convergenceYear,
            liquidityGap,
            confidenceInterval: [sortedSri[Math.floor(sortedSri.length * 0.05)], sortedSri[Math.floor(sortedSri.length * 0.95)]]
        };
    }

    private static findConvergenceYear(trajectories: any[][], target: number): number | null {
        const avgTrajectory = trajectories[0].map((_, yearIdx) => {
            const sum = trajectories.reduce((s, t) => s + t[yearIdx].sri, 0);
            return sum / trajectories.length;
        });

        const convYear = avgTrajectory.findIndex(sri => sri >= target);
        return convYear !== -1 ? convYear + 1 : null;
    }

    private static calculateLiquidityGap(trajectories: any[][]): number {
        // Gap = Difference between High-Efficiency (Profit-first) and current Balanced strategies
        // (Simplification for Level E Core)
        return Math.random() * 50000; // Mock gap in USD/Ha
    }
}
