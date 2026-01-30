/**
 * Course DTOs for Corporate University Module
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsEnum,
    IsArray,
    ValidateNested,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Course Grade Enum
 */
export enum CourseGrade {
    INTERN = 'INTERN',
    SPECIALIST = 'SPECIALIST',
    PROFESSIONAL = 'PROFESSIONAL',
    EXPERT = 'EXPERT',
    MASTER = 'MASTER',
}

/**
 * Material Info DTO
 */
export class MaterialInfoDto {
    @IsUUID()
    id: string;

    @IsString()
    type: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsNumber()
    durationMinutes?: number;
}

/**
 * Course Module Response DTO
 */
export class CourseModuleResponseDto {
    @IsUUID()
    id: string;

    @IsNumber()
    order: number;

    @ValidateNested()
    @Type(() => MaterialInfoDto)
    material: MaterialInfoDto;

    @IsBoolean()
    isRequired: boolean;
}

/**
 * Course Response DTO
 */
export class CourseResponseDto {
    @IsUUID()
    id: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    academyId?: string;

    @IsOptional()
    @IsString()
    academyName?: string;

    @IsOptional()
    @IsEnum(CourseGrade)
    requiredGrade?: CourseGrade;

    @IsNumber()
    rewardMC: number;

    @IsNumber()
    rewardGMC: number;

    @IsBoolean()
    isMandatory: boolean;

    @IsBoolean()
    isActive: boolean;

    @IsOptional()
    @IsNumber()
    totalDuration?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CourseModuleResponseDto)
    modules?: CourseModuleResponseDto[];
}

/**
 * Create Course Request DTO
 */
export class CreateCourseDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    academyId?: string;

    @IsOptional()
    @IsEnum(CourseGrade)
    requiredGrade?: CourseGrade;

    @IsOptional()
    @IsNumber()
    @Min(0)
    rewardMC?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    rewardGMC?: number;

    @IsOptional()
    @IsBoolean()
    isMandatory?: boolean;
}

/**
 * Update Course Request DTO
 */
export class UpdateCourseDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(CourseGrade)
    requiredGrade?: CourseGrade;

    @IsOptional()
    @IsNumber()
    @Min(0)
    rewardMC?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    rewardGMC?: number;

    @IsOptional()
    @IsBoolean()
    isMandatory?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

/**
 * Add Module to Course Request DTO
 */
export class AddCourseModuleDto {
    @IsUUID()
    materialId: string;

    @IsNumber()
    @Min(1)
    order: number;

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;
}
