import { Individual, NSGA2Engine } from './mos-engine';
import { ObjectiveFunctions, StrategyMetrics, ContractType } from './objective-functions';

/**
 * MOS Orchestration Service
 */
export class MOSCoordinator {
    /**
     * Evolves a population of strategies for a given field context
     */
    static async evolve(
        fieldState: any,
        contractType: ContractType = ContractType.SEASONAL_OPTIMIZATION,
        generations: number = 50,
        populationSize: number = 500
    ): Promise<Individual[]> {
        const startTime = Date.now();
        let population = this.initializePopulation(populationSize, fieldState);

        for (let g = 0; g < generations; g++) {
            // 1. Evaluate Population (with Contract Support)
            this.evaluate(population, contractType);

            // 2. Fast Non-dominated Sort
            const fronts = NSGA2Engine.fastNonDominatedSort(population);

            // 3. Selection & Replacement (Elitism)
            const nextGen: Individual[] = [];
            let frontIdx = 0;

            while (nextGen.length + fronts[frontIdx]?.length <= populationSize) {
                NSGA2Engine.assignCrowdingDistance(fronts[frontIdx]);
                nextGen.push(...fronts[frontIdx]);
                frontIdx++;
                if (frontIdx >= fronts.length) break;
            }

            // Fill remaining spots using crowding distance
            if (nextGen.length < populationSize && frontIdx < fronts.length) {
                NSGA2Engine.assignCrowdingDistance(fronts[frontIdx]);
                fronts[frontIdx].sort((a, b) => (b.crowdingDistance || 0) - (a.crowdingDistance || 0));
                const needed = populationSize - nextGen.length;
                nextGen.push(...fronts[frontIdx].slice(0, needed));
            }

            // 4. Variation (Crossover & Mutation)
            if (g < generations - 1) {
                population = this.generateOffspring(nextGen, populationSize, fieldState);
            } else {
                population = nextGen;
            }

            // Yield event loop every few generations or if time exceeds limit
            const elapsed = Date.now() - startTime;
            if (elapsed > 3000) {
                console.warn(`[MOS] SLA Warning: Execution exceeded 3000ms. Returning current front.`);
                break;
            }

            if (g % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return population;
    }

    private static initializePopulation(size: number, context: any): Individual[] {
        // Generate random strategies based on context
        return Array.from({ length: size }, (_, i) => ({
            id: `init-${i}`,
            genome: { /* strategy params */ },
            objectives: { values: [0, 0], constraintViolation: 0 }
        }));
    }

    private static evaluate(population: Individual[], contractType: ContractType) {
        for (const ind of population) {
            // Simulated strategy metrics
            const metrics: StrategyMetrics = {
                revenue: Math.random(),
                roi: Math.random(),
                deltaSri: Math.random() * 0.1 - 0.02, // Range [-0.02, 0.08]
                bps: Math.random(),
                sri_t: 0.5 // Mock context
            };

            // Contract-Driven Evaluation
            ind.objectives.values = ObjectiveFunctions.evaluate(metrics, contractType);
            ind.objectives.constraintViolation = ObjectiveFunctions.calculateCV(metrics, contractType);
        }
    }

    private static generateOffspring(parents: Individual[], size: number, context: any): Individual[] {
        const offspring: Individual[] = [];

        while (offspring.length < size) {
            // Tournament Selection
            const p1 = this.tournamentSelection(parents);
            const p2 = this.tournamentSelection(parents);

            // Crossover (Arithmetic)
            const childGenome: any = {};
            const keys = Object.keys(p1.genome);
            for (const key of keys) {
                childGenome[key] = (p1.genome[key] + p2.genome[key]) / 2;

                // Mutation (Gaussian)
                if (Math.random() < 0.1) {
                    childGenome[key] += (Math.random() - 0.5) * 0.1;
                    childGenome[key] = Math.max(0, Math.min(1, childGenome[key]));
                }
            }

            offspring.push({
                id: `off-${offspring.length}-${Date.now()}`,
                genome: childGenome,
                objectives: { values: [0, 0], constraintViolation: 0 }
            });
        }

        return offspring;
    }

    private static tournamentSelection(population: Individual[]): Individual {
        const k = 2; // Tournament size
        let best: Individual | null = null;

        for (let i = 0; i < k; i++) {
            const candidate = population[Math.floor(Math.random() * population.length)];
            if (!best || candidate.rank! < best.rank! ||
                (candidate.rank === best.rank && candidate.crowdingDistance! > best.crowdingDistance!)) {
                best = candidate;
            }
        }
        return best!;
    }
}
