/**
 * Feedback DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsOptional,
    IsDateString,
    IsNumber,
    IsArray,
    Min,
    Max,
} from 'class-validator';
import { ISODate } from '../common/common.types';

/**
 * Daily Plan Response
 */
export class DailyPlanResponseDto {
    @IsDateString()
    date: ISODate;

    @IsArray()
    @IsString({ each: true })
    tasks: string[];

    @IsArray()
    @IsString({ each: true })
    priorities: string[];

    @IsOptional()
    @IsString()
    aiRecommendation?: string;
}

/**
 * Morning Feedback Request
 */
export class MorningFeedbackRequestDto {
    @IsString()
    mood: string;

    @IsString()
    readinessLevel: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsArray()
    @IsString({ each: true })
    plannedTasks: string[];
}

/**
 * Evening Feedback Request
 */
export class EveningFeedbackRequestDto {
    @IsArray()
    @IsString({ each: true })
    completedTasks: string[];

    @IsNumber()
    @Min(0)
    @Max(100)
    planCompletionPercent: number;

    @IsString()
    blockers: string;

    @IsString()
    achievements: string;
}

/**
 * SMART Report Request
 */
export class SMARTReportRequestDto {
    @IsString()
    specific: string;

    @IsString()
    measurable: string;

    @IsString()
    achievable: string;

    @IsString()
    relevant: string;

    @IsString()
    timeBound: string;
}
