/**
 * Economy API DTOs
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 * 
 * ⚠️ STRICT MAPPING: JSON -> Domain Types.
 * No logic, no validation beyond shape.
 */

import { IsString, IsArray, IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MCState } from '../core/mc.types';

export class MCStateDto {
    @IsString()
    id: string;

    @IsString()
    amount: number; // Decimal string or number handling

    @IsString()
    state: string; // Enum Check?

    @IsString()
    sourceType: string;

    @IsArray()
    history: any[];

    // ... complete mapping of MCState
}

export class EconomyUsageContextDto {
    @IsString()
    usageContextId: string;

    @IsString()
    userId: string;

    @IsString()
    domain: string;

    @IsString()
    operation: string;

    @IsArray()
    @ValidateNested({ each: true })
    // @Type(() => MCStateDto) // Simplified for adapter view, strict typing in Service
    mcSnapshot: MCState[]; // Expecting raw JSON array that matches interface

    @IsDateString()
    timestamp: string;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class ParticipateAuctionDto {
    @IsString()
    eventId: string;

    @ValidateNested()
    context: EconomyUsageContextDto;
}

export class EvaluateAccessDto {
    @IsString()
    storeId: string; // or generic resource ID

    @ValidateNested()
    context: EconomyUsageContextDto;
}
