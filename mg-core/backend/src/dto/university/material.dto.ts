/**
 * Material DTOs for Corporate University Module
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    IsBoolean,
    Min,
} from 'class-validator';

/**
 * Material Type Enum
 */
export enum MaterialType {
    VIDEO = 'VIDEO',
    TEXT = 'TEXT',
    PDF = 'PDF',
    QUIZ = 'QUIZ',
    SIMULATION = 'SIMULATION',
}

/**
 * Material Status Enum
 */
export enum MaterialStatus {
    DRAFT = 'DRAFT',
    REVIEW = 'REVIEW',
    PUBLISHED = 'PUBLISHED',
}

/**
 * Material Response DTO
 */
export class MaterialResponseDto {
    @IsUUID()
    id: string;

    @IsEnum(MaterialType)
    type: MaterialType;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    contentUrl?: string;

    @IsOptional()
    @IsString()
    contentText?: string;

    @IsOptional()
    @IsNumber()
    durationMinutes?: number;

    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsOptional()
    @IsString()
    level?: string;

    @IsOptional()
    @IsString()
    academyId?: string;

    @IsOptional()
    @IsString()
    academyName?: string;

    @IsNumber()
    version: number;

    @IsEnum(MaterialStatus)
    status: MaterialStatus;

    @IsOptional()
    @IsString()
    createdBy?: string;

    @IsOptional()
    @IsString()
    reviewedBy?: string;
}

/**
 * Create Material Request DTO
 */
export class CreateMaterialDto {
    @IsEnum(MaterialType)
    type: MaterialType;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    contentUrl?: string;

    @IsOptional()
    @IsString()
    contentText?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    durationMinutes?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    level?: string; // A0, A1, B1, B2, C1, C2

    @IsOptional()
    @IsUUID()
    academyId?: string;
}

/**
 * Update Material Request DTO
 */
export class UpdateMaterialDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    contentUrl?: string;

    @IsOptional()
    @IsString()
    contentText?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    durationMinutes?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    level?: string;
}

/**
 * Update Material Status Request DTO
 */
export class UpdateMaterialStatusDto {
    @IsEnum(MaterialStatus)
    status: MaterialStatus;
}

/**
 * Material Query Filters DTO
 */
export class MaterialQueryDto {
    @IsOptional()
    @IsUUID()
    academyId?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(MaterialType, { each: true })
    type?: MaterialType[];

    @IsOptional()
    @IsString()
    level?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsEnum(MaterialStatus)
    status?: MaterialStatus;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;
}
