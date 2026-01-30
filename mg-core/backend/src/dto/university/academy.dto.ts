/**
 * Academy DTOs for Corporate University Module
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsBoolean,
    IsNumber,
} from 'class-validator';

/**
 * Academy Response DTO
 */
export class AcademyResponseDto {
    @IsUUID()
    id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    icon_url?: string;

    @IsBoolean()
    is_active: boolean;

    @IsNumber()
    coursesCount: number;

    @IsNumber()
    skillsCount: number;
}

/**
 * Create Academy Request DTO
 */
export class CreateAcademyDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    icon_url?: string;
}

/**
 * Update Academy Request DTO
 */
export class UpdateAcademyDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    icon_url?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

/**
 * Academy with Courses Response DTO
 */
export class AcademyWithCoursesDto extends AcademyResponseDto {
    courses: any[]; // Will be CourseResponseDto[]
}
