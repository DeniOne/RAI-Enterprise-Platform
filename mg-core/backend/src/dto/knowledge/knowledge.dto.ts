/**
 * Knowledge Base DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsDateString,
    IsNumber,
    IsArray,
} from 'class-validator';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Knowledge Search Request
 */
export class KnowledgeSearchRequestDto {
    @IsString()
    query: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsNumber()
    limit?: number;
}

/**
 * Knowledge Item Response
 */
export class KnowledgeItemResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsString()
    category: string;

    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @IsNumber()
    relevanceScore: number;

    @IsDateString()
    updatedAt: ISODateTime;
}
