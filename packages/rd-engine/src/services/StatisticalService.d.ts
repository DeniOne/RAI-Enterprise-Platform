import { Measurement } from '@rai/prisma-client';
export interface StatsSummary {
    variable: string;
    mean: number;
    median: number;
    stdDev: number;
    count: number;
}
export declare class StatisticalService {
    calculateSummary(variable: string, measurements: Measurement[]): StatsSummary;
}
