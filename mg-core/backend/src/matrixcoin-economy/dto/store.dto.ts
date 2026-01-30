/**
 * Store DTOs
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ GUARD: Store — немонетарный обмен, не магазин
 */

import {
    IsString,
    IsUUID,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsEnum,
    Min,
} from 'class-validator';

import { StoreItemCategory } from '../core/economy.enums';

/**
 * Store Item Response DTO
 * ⚠️ GUARD: Нет "цены" — есть "смысловой эквивалент участия"
 */
export class StoreItemResponseDto {
    @IsUUID()
    id!: string;

    @IsString()
    name!: string;

    @IsString()
    description!: string;

    @IsEnum(StoreItemCategory)
    category!: StoreItemCategory;

    /**
     * ⚠️ GUARD: Это НЕ цена, а смысловой эквивалент
     */
    @IsNumber()
    @Min(0)
    mcCost!: number;

    @IsBoolean()
    isAvailable!: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number | null;
}

/**
 * Exchange Request DTO
 * ⚠️ GUARD: Не "покупка", а "обмен"
 */
export class ExchangeRequestDto {
    @IsUUID()
    itemId!: string;

    /**
     * ⚠️ GUARD: Должен быть ID человека
     */
    @IsUUID()
    initiatedBy!: string;
}
