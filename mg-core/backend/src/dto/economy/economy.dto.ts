/**
 * Economy DTOs for MatrixGin v2.0 API (MatrixCoin, Auctions, Store)
 */

import {
    IsString,
    IsUUID,
    IsEnum,
    IsOptional,
    IsNumber,
    IsDateString,
    IsBoolean,
    IsInt,
    IsObject,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, TransactionType, AuctionStatus } from '../common/common.enums';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Wallet response
 */
export class WalletResponseDto {
    @IsUUID()
    userId: UUID;

    @IsNumber()
    @Min(0)
    mcBalance: number;

    @IsNumber()
    @Min(0)
    gmcBalance: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    mcFrozen?: number;

    @IsOptional()
    @IsDateString()
    safeActivatedAt?: ISODateTime;

    @IsOptional()
    @IsDateString()
    safeExpiresAt?: ISODateTime;

    @IsDateString()
    updatedAt: ISODateTime;
}

/**
 * Create transaction request
 */
export class CreateTransactionRequestDto {
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsEnum(Currency)
    currency: Currency;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsOptional()
    @IsUUID()
    recipientId?: UUID;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}

/**
 * Transaction response
 */
export class TransactionResponseDto {
    @IsUUID()
    id: UUID;

    @IsEnum(TransactionType)
    type: TransactionType;

    @IsEnum(Currency)
    currency: Currency;

    @IsNumber()
    amount: number;

    @IsOptional()
    @IsUUID()
    senderId?: UUID;

    @IsOptional()
    @IsUUID()
    recipientId?: UUID;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @IsDateString()
    createdAt: ISODateTime;
}

/**
 * Activate safe request (freeze MC)
 */
export class ActivateSafeRequestDto {
    @IsNumber()
    @Min(100)
    amount: number;
}

/**
 * Auction response
 */
export class AuctionResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    startingBid: number;

    @IsNumber()
    @Min(0)
    currentBid: number;

    @IsOptional()
    @IsUUID()
    currentBidderId?: UUID;

    @IsNumber()
    @Min(0)
    gmcAmount: number;

    @IsEnum(AuctionStatus)
    status: AuctionStatus;

    @IsDateString()
    startsAt: ISODateTime;

    @IsDateString()
    endsAt: ISODateTime;

    @IsDateString()
    createdAt: ISODateTime;
}

/**
 * Place bid request
 */
export class PlaceBidRequestDto {
    @IsNumber()
    @Min(0.01)
    amount: number;
}

/**
 * Rank discount configuration
 */
export class RankDiscountDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    'Инвестор'?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    'Магнат'?: number;
}

/**
 * Store item response
 */
export class StoreItemResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsEnum(Currency)
    currency: Currency;

    @IsOptional()
    @IsString()
    image?: string;

    @IsBoolean()
    available: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => RankDiscountDto)
    rankDiscount?: RankDiscountDto;
}

/**
 * Purchase item request
 */
export class PurchaseItemRequestDto {
    @IsUUID()
    itemId: UUID;

    @IsInt()
    @Min(1)
    quantity: number = 1;
}
