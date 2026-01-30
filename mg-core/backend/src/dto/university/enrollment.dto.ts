/**
 * Enrollment DTOs for Corporate University Module
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    ValidateNested,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enrollment Status Enum
 */
export enum EnrollmentStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    ABANDONED = 'ABANDONED',
}

/**
 * Module Status Enum
 */
export enum ModuleStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

/**
 * Enrollment Response DTO
 */
export class EnrollmentResponseDto {
    @IsUUID()
    id: string;

    @IsUUID()
    userId: string;

    @IsUUID()
    courseId: string;

    @IsOptional()
    @IsString()
    courseTitle?: string;

    @IsOptional()
    @IsString()
    academyName?: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    progress: number;

    @IsEnum(EnrollmentStatus)
    status: EnrollmentStatus;

    @IsString()
    enrolledAt: string;

    @IsOptional()
    @IsString()
    completedAt?: string;

    @IsOptional()
    @IsString()
    assignedBy?: string;
}

/**
 * Enroll in Course Request DTO
 */
export class EnrollInCourseDto {
    @IsUUID()
    courseId: string;

    @IsOptional()
    @IsUUID()
    assignedBy?: string;
}

/**
 * Module Progress Update DTO
 */
export class UpdateModuleProgressDto {
    @IsUUID()
    moduleId: string;

    @IsEnum(ModuleStatus)
    status: ModuleStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    score?: number;
}

/**
 * Module Progress Response DTO
 */
export class ModuleProgressResponseDto {
    @IsUUID()
    id: string;

    @IsUUID()
    moduleId: string;

    @IsOptional()
    @IsString()
    moduleTitle?: string;

    @IsEnum(ModuleStatus)
    status: ModuleStatus;

    @IsOptional()
    @IsNumber()
    score?: number;

    @IsOptional()
    @IsString()
    startedAt?: string;

    @IsOptional()
    @IsString()
    completedAt?: string;
}

/**
 * My Courses Response DTO
 */
export class MyCoursesResponseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EnrollmentResponseDto)
    active: EnrollmentResponseDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EnrollmentResponseDto)
    completed: EnrollmentResponseDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EnrollmentResponseDto)
    abandoned: EnrollmentResponseDto[];
}

/**
 * Complete Course Request DTO
 */
export class CompleteCourseDto {
    @IsUUID()
    courseId: string;
}
