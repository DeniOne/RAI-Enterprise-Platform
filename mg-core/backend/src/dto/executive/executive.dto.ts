/**
 * Executive Dashboard DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsDateString,
    IsNumber,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ISODateTime } from '../common/common.types';

/**
 * Insight Response
 */
export class InsightResponseDto {
    @IsString()
    id: string;

    @IsString()
    category: string;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    impact: 'high' | 'medium' | 'low';

    @IsDateString()
    generatedAt: ISODateTime;
}

/**
 * Executive Dashboard Response
 */
export class ExecutiveDashboardDto {
    @IsNumber()
    totalRevenue: number;

    @IsNumber()
    activeEmployees: number;

    @IsNumber()
    averageEfficiency: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InsightResponseDto)
    keyInsights: InsightResponseDto[];

    @IsArray()
    @IsString({ each: true })
    anomalies: string[];
}
