import { ISODateTime } from '../common/common.types';
export declare class InsightResponseDto {
    id: string;
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    generatedAt: ISODateTime;
}
export declare class ExecutiveDashboardDto {
    totalRevenue: number;
    activeEmployees: number;
    averageEfficiency: number;
    keyInsights: InsightResponseDto[];
    anomalies: string[];
}
//# sourceMappingURL=executive.dto.d.ts.map