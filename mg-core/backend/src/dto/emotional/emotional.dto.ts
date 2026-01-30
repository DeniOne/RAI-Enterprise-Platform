/**
 * Emotional Analytics DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsDateString,
    IsNumber,
    IsArray,
    Min,
    Max,
} from 'class-validator';
import { UUID, ISODateTime, EmotionalTone } from '../common/common.types';

/**
 * Company Mood Response
 */
export class CompanyMoodResponseDto {
    @IsNumber()
    @Min(0)
    @Max(4)
    averageTone: EmotionalTone;

    @IsString()
    dominantEmotion: string;

    @IsNumber()
    trend: number; // + or - change

    @IsDateString()
    calculatedAt: ISODateTime;
}

/**
 * Burnout Risk Response
 */
export class BurnoutRiskResponseDto {
    @IsUUID()
    employeeId: UUID;

    @IsString()
    employeeName: string;

    @IsNumber()
    @Min(0)
    @Max(1)
    riskScore: number;

    @IsArray()
    @IsString({ each: true })
    riskFactors: string[];

    @IsString()
    recommendation: string;
}
