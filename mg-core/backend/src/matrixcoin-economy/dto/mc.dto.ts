/**
 * MC DTOs
 * Module 08 — MatrixCoin-Economy
 * 
 * Data Transfer Objects для MC операций.
 * ⚠️ GUARD: Все DTO следуют смысловым ограничениям, не финансовым
 */

import {
    IsString,
    IsUUID,
    IsNumber,
    IsDateString,
    IsOptional,
    IsBoolean,
    IsArray,
    ArrayNotEmpty,
    Min,
    MaxLength,
} from 'class-validator';

import type { MCSourceType, MCLifecycleState } from '../core/mc.types';

/**
 * MC State Response DTO
 */
export class MCStateResponseDto {
    @IsUUID()
    id!: string;

    @IsUUID()
    userId!: string;

    @IsNumber()
    @Min(0)
    amount!: number;

    @IsDateString()
    issuedAt!: string;

    @IsDateString()
    expiresAt!: string;

    @IsBoolean()
    isFrozen!: boolean;

    @IsString()
    sourceType!: MCSourceType;

    @IsString()
    sourceId!: string;

    @IsString()
    lifecycleState!: MCLifecycleState;
}

/**
 * MC Summary Response DTO
 * ⚠️ GUARD: Для отображения, не для расчётов
 */
export class MCSummaryResponseDto {
    @IsNumber()
    @Min(0)
    activeBalance!: number;

    @IsNumber()
    @Min(0)
    frozenBalance!: number;

    @IsNumber()
    @Min(0)
    expiringWithin30Days!: number;

    @IsDateString()
    updatedAt!: string;
}

/**
 * Grant MC Request DTO
 * ⚠️ GUARD: Требует человеческого действия
 */
export class GrantMCRequestDto {
    @IsUUID()
    userId!: string;

    @IsNumber()
    @Min(1)
    amount!: number;

    /**
     * ⚠️ GUARD: Должен быть ID человека, не AI/SYSTEM
     */
    @IsUUID()
    grantedBy!: string;

    /**
     * ⚠️ GUARD: MANUAL_GRANT | EVENT_PARTICIPATION | PEER_TRANSFER
     */
    @IsString()
    sourceType!: MCSourceType;

    @IsString()
    sourceId!: string;

    /**
     * ⚠️ GUARD: Обязательно, MC без срока истечения запрещён
     */
    @IsDateString()
    expiresAt!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}

/**
 * Freeze MC Request DTO
 */
export class FreezeMCRequestDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    mcIds!: string[];
}

/**
 * Transfer MC Request DTO
 */
export class TransferMCRequestDto {
    @IsUUID()
    toUserId!: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    mcIds!: string[];

    @IsString()
    @MaxLength(500)
    reason!: string;
}
