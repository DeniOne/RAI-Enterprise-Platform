/**
 * GMC DTOs
 * Module 08 — MatrixCoin-Economy
 * 
 * Data Transfer Objects для GMC операций.
 * ⛔ ABSOLUTE GUARD: GMC признаётся только человеком
 */

import {
    IsString,
    IsUUID,
    IsNumber,
    IsDateString,
    IsEnum,
    MinLength,
    Min,
} from 'class-validator';

import type { GMCRecognitionCategory } from '../core/gmc.types';

/**
 * GMC State Response DTO
 */
export class GMCStateResponseDto {
    @IsUUID()
    id!: string;

    @IsUUID()
    userId!: string;

    @IsNumber()
    @Min(0)
    amount!: number;

    @IsDateString()
    recognizedAt!: string;

    @IsUUID()
    recognizedBy!: string;

    @IsString()
    category!: GMCRecognitionCategory;

    @IsString()
    justification!: string;
}

/**
 * GMC Summary Response DTO
 */
export class GMCSummaryResponseDto {
    @IsNumber()
    @Min(0)
    totalBalance!: number;

    byCategory!: Record<GMCRecognitionCategory, number>;

    @IsDateString()
    lastRecognizedAt!: string | null;
}

/**
 * Recognize GMC Request DTO
 * ⛔ ABSOLUTE GUARD: Только человек может признать GMC
 */
export class RecognizeGMCRequestDto {
    @IsUUID()
    userId!: string;

    @IsNumber()
    @Min(1)
    amount!: number;

    @IsString()
    category!: GMCRecognitionCategory;

    /**
     * ⚠️ GUARD: Минимум 50 символов
     */
    @IsString()
    @MinLength(50)
    justification!: string;

    /**
     * ⛔ ABSOLUTE GUARD: Должен быть ID человека с полномочиями
     * AI/SYSTEM/AUTO запрещены на уровне guard
     */
    @IsUUID()
    recognizedBy!: string;
}
