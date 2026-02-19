/**
 * NSGA-II (Non-dominated Sorting Genetic Algorithm II) Core
 * Designed for Level E Constitutional Optimization.
 * Complexity: O(M * N^2)
 */

export interface ObjectiveVector {
    values: number[]; // [Efficiency, Regeneration]
    constraintViolation: number; // Sum of max(0, g_k(x))
}

export interface Individual {
    id: string;
    genome: any; // Strategy parameters
    objectives: ObjectiveVector;
    rank?: number;
    crowdingDistance?: number;
}

export class NSGA2Engine {
    /**
     * Fast Non-dominated Sort
     */
    static fastNonDominatedSort(population: Individual[]): Individual[][] {
        const fronts: Individual[][] = [[]];
        const n = population.length;
        const dominationCount = new Array(n).fill(0);
        const dominatedSet: number[][] = Array.from({ length: n }, () => []);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;

                if (this.dominates(population[i], population[j])) {
                    dominatedSet[i].push(j);
                } else if (this.dominates(population[j], population[i])) {
                    dominationCount[i]++;
                }
            }

            if (dominationCount[i] === 0) {
                population[i].rank = 1;
                fronts[0].push(population[i]);
            }
        }

        let i = 0;
        while (fronts[i].length > 0) {
            const nextFront: Individual[] = [];
            for (const p of fronts[i]) {
                const pIdx = population.indexOf(p);
                for (const qIdx of dominatedSet[pIdx]) {
                    dominationCount[qIdx]--;
                    if (dominationCount[qIdx] === 0) {
                        population[qIdx].rank = i + 2;
                        nextFront.push(population[qIdx]);
                    }
                }
            }
            i++;
            fronts[i] = nextFront;
        }

        return fronts.filter(f => f.length > 0);
    }

    /**
     * Constraint Dominance Principle
     * i dominates j iff:
     * 1. i is feasible and j is not
     * 2. i and j are both infeasible, but i has smaller CV
     * 3. both are feasible and i dominates j in objectives
     */
    static dominates(i: Individual, j: Individual): boolean {
        // 1 & 2. Constraint Dominance
        if (i.objectives.constraintViolation < j.objectives.constraintViolation) return true;
        if (i.objectives.constraintViolation > j.objectives.constraintViolation) return false;

        // 3. Objective Dominance (assuming maximization for all)
        let better = false;
        for (let k = 0; k < i.objectives.values.length; k++) {
            if (i.objectives.values[k] < j.objectives.values[k]) return false;
            if (i.objectives.values[k] > j.objectives.values[k]) better = true;
        }
        return better;
    }

    /**
     * Crowding Distance Assignment
     */
    static assignCrowdingDistance(front: Individual[]) {
        const n = front.length;
        if (n === 0) return;
        if (n <= 2) {
            front.forEach(p => p.crowdingDistance = Infinity);
            return;
        }

        front.forEach(p => p.crowdingDistance = 0);

        const numObjectives = front[0].objectives.values.length;
        for (let m = 0; m < numObjectives; m++) {
            front.sort((a, b) => a.objectives.values[m] - b.objectives.values[m]);
            front[0].crowdingDistance = Infinity;
            front[n - 1].crowdingDistance = Infinity;

            const range = front[n - 1].objectives.values[m] - front[0].objectives.values[m];
            if (range === 0) continue;

            for (let i = 1; i < n - 1; i++) {
                front[i].crowdingDistance! += (front[i + 1].objectives.values[m] - front[i - 1].objectives.values[m]) / range;
            }
        }
    }
}
