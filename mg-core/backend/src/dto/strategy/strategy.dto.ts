/**
 * Strategy & Management DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsDateString,
    IsNumber,
    IsArray,
    Min,
    Max,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Key Result DTO
 */
export class KeyResultDto {
    @IsUUID()
    @IsOptional()
    id?: UUID;

    @IsString()
    title: string;

    @IsNumber()
    targetValue: number;

    @IsNumber()
    currentValue: number;

    @IsString()
    unit: string;
}

/**
 * OKR Response
 */
export class OKRResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    objective: string;

    @IsString()
    period: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    progress: number;

    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsUUID()
    ownerId?: UUID;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => KeyResultDto)
    keyResults: KeyResultDto[];

    @IsDateString()
    createdAt: ISODateTime;
}

/**
 * Create OKR Request
 */
export class CreateOKRRequestDto {
    @IsString()
    objective: string;

    @IsString()
    period: string;

    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => KeyResultDto)
    keyResults: KeyResultDto[];
}

/**
 * Update OKR Request
 */
export class UpdateOKRRequestDto {
    @IsOptional()
    @IsString()
    objective?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    progress?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => KeyResultDto)
    keyResults?: KeyResultDto[];
}

/**
 * CTM (Transformation) Dashboard
 */
export class CTMDashboardDto {
    @IsNumber()
    transformationIndex: number;

    @IsNumber()
    digitalAdoptionRate: number;

    @IsNumber()
    processAutomationLevel: number;

    @IsArray()
    @IsString({ each: true })
    activeInitiatives: string[];
}
