/**
 * Auction DTOs
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ GUARD: Auction — событие, не сервис
 */

import {
    IsString,
    IsUUID,
    IsNumber,
    IsDateString,
    IsEnum,
    IsOptional,
    Min,
} from 'class-validator';

import { AuctionEventStatus } from '../core/economy.enums';

/**
 * Auction Event Response DTO
 */
export class AuctionEventResponseDto {
    @IsUUID()
    id!: string;

    @IsString()
    title!: string;

    @IsString()
    description!: string;

    @IsEnum(AuctionEventStatus)
    status!: AuctionEventStatus;

    @IsNumber()
    @Min(0)
    gmcPool!: number;

    @IsNumber()
    @Min(0)
    minimumBid!: number;

    @IsDateString()
    startsAt!: string;

    @IsDateString()
    endsAt!: string;

    @IsOptional()
    @IsUUID()
    winnerId?: string | null;
}

/**
 * Place Bid Request DTO
 * ⚠️ GUARD: Только человек может делать ставки
 */
export class PlaceBidRequestDto {
    @IsUUID()
    eventId!: string;

    @IsNumber()
    @Min(1)
    mcAmount!: number;

    /**
     * ⚠️ GUARD: Должен быть ID человека
     */
    @IsUUID()
    initiatedBy!: string;
}
