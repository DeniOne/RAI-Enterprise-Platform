/**
 * Department DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsInt,
    IsDateString,
    IsEnum,
    IsNumber,
    Matches,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID, ISODateTime, ISODate, EmotionalTone } from '../common/common.types';
import { KPIPeriod } from '../common/common.enums';

/**
 * Department response
 */
export class DepartmentResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    name: string;

    @IsString()
    @Matches(/^[A-Z]{2,5}$/, {
        message: 'Код департамента должен содержать 2-5 заглавных букв',
    })
    code: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    headId?: UUID;

    @IsOptional()
    @IsInt()
    @Min(0)
    employeeCount?: number;

    @IsDateString()
    createdAt: ISODateTime;

    @IsDateString()
    updatedAt: ISODateTime;
}

/**
 * Department KPI metrics
 */
export class DepartmentKPIMetricsDto {
    @IsOptional()
    @IsNumber()
    revenue?: number;

    @IsOptional()
    @IsInt()
    tasksCompleted?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    averageEmotionalTone?: EmotionalTone;

    @IsOptional()
    @IsNumber()
    employeeEngagement?: number;
}

/**
 * Department KPI response
 */
export class DepartmentKPIResponseDto {
    @IsUUID()
    departmentId: UUID;

    @IsEnum(KPIPeriod)
    period: KPIPeriod;

    @ValidateNested()
    @Type(() => DepartmentKPIMetricsDto)
    metrics: DepartmentKPIMetricsDto;
}

/**
 * Muda (waste) types for Lean analysis
 */
export class MudaTypesDto {
    @IsOptional()
    @IsNumber()
    overproduction?: number;

    @IsOptional()
    @IsNumber()
    waiting?: number;

    @IsOptional()
    @IsNumber()
    transportation?: number;

    @IsOptional()
    @IsNumber()
    overprocessing?: number;

    @IsOptional()
    @IsNumber()
    inventory?: number;

    @IsOptional()
    @IsNumber()
    motion?: number;

    @IsOptional()
    @IsNumber()
    defects?: number;

    @IsOptional()
    @IsNumber()
    unutilizedTalent?: number;
}

/**
 * Muda analysis response (8 types of waste)
 */
export class MudaAnalysisResponseDto {
    @IsUUID()
    departmentId: UUID;

    @IsDateString()
    period: ISODate;

    @ValidateNested()
    @Type(() => MudaTypesDto)
    mudaTypes: MudaTypesDto;

    @IsNumber()
    @Min(0)
    totalLoss: number;
}
