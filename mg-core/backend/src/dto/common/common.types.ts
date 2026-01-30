/**
 * Common TypeScript types and interfaces for MatrixGin v2.0 API
 * Based on OpenAPI specification
 */

import {
    IsString,
    IsUUID,
    IsDateString,
    IsBoolean,
    IsInt,
    IsEnum,
    IsOptional,
    Min,
    Max,
    ValidateNested,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * UUID string type
 * Pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export type UUID = string;

/**
 * ISO 8601 DateTime string
 * Example: 2025-11-21T15:30:00Z
 */
export type ISODateTime = string;

/**
 * ISO Date string
 * Pattern: YYYY-MM-DD
 * Example: 2025-11-21
 */
export type ISODate = string;

/**
 * Email address string
 * Example: ivan@photomatrix.ru
 */
export type Email = string;

/**
 * Emotional tone value (0.0-4.0)
 * - 0.0-0.5: Апатия/Горе
 * - 0.5-1.0: Страх/Тревога
 * - 1.0-1.5: Скрытая враждебность
 * - 1.5-2.0: Антагонизм
 * - 2.0-2.5: Скука
 * - 2.5-3.0: Консерватизм
 * - 3.0-3.5: Интерес
 * - 3.5-4.0: Действие/Игры
 */
export type EmotionalTone = number;

/**
 * Response metadata
 */
export class MetaInfoDto {
    @IsDateString()
    timestamp: ISODateTime;

    @IsUUID()
    requestId: UUID;

    @IsString()
    version: string;
}

/**
 * Generic API response wrapper
 */
export class ApiResponse<T = any> {
    @IsBoolean()
    success: boolean;

    data: T;

    @IsOptional()
    @ValidateNested()
    @Type(() => MetaInfoDto)
    meta?: MetaInfoDto;
}

/**
 * Error details object
 */
export class ErrorDetailsDto {
    [key: string]: any;
}

/**
 * Error object structure
 */
export class ErrorObjectDto {
    @IsString()
    code: string;

    @IsString()
    message: string;

    @IsOptional()
    @IsObject()
    details?: ErrorDetailsDto;
}

/**
 * API error response
 */
export class ApiErrorDto {
    @IsBoolean()
    success!: false;

    @ValidateNested()
    @Type(() => ErrorObjectDto)
    error: ErrorObjectDto;
}

/**
 * Pagination query parameters
 */
export class PaginationParamsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsEnum({ asc: 'asc', desc: 'desc' })
    sortOrder?: 'asc' | 'desc' = 'asc';
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
    @IsInt()
    @Min(1)
    page: number;

    @IsInt()
    @Min(1)
    limit: number;

    @IsInt()
    @Min(0)
    total: number;

    @IsInt()
    @Min(0)
    totalPages: number;
}

/**
 * Generic paginated response
 */
export class PaginatedResponse<T = any> {
    items: T[];

    @ValidateNested()
    @Type(() => PaginationMetaDto)
    pagination: PaginationMetaDto;
}
