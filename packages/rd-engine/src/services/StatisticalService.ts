import { Measurement } from '@rai/prisma-client';

export interface StatsSummary {
    variable: string;
    mean: number;
    median: number;
    stdDev: number;
    count: number;
}

export class StatisticalService {
    /**
     * Базовая статистика по замеряемой переменной.
     */
    calculateSummary(variable: string, measurements: Measurement[]): StatsSummary {
        const values = measurements
            .filter((m: Measurement) => m.variable === variable)
            .map((m: Measurement) => m.value)
            .sort((a, b) => a - b);

        if (values.length === 0) {
            return { variable, mean: 0, median: 0, stdDev: 0, count: 0 };
        }

        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;

        const median = values.length % 2 === 0
            ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
            : values[Math.floor(values.length / 2)];

        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
            variable,
            mean,
            median,
            stdDev,
            count: values.length
        };
    }
}
