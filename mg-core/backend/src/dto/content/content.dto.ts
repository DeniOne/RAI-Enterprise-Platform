/**
 * Content Factory DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsEnum,
} from 'class-validator';
import { UUID } from '../common/common.types';

/**
 * Generate Content Request
 */
export class GenerateContentRequestDto {
    @IsString()
    prompt: string;

    @IsEnum(['text', 'image', 'video'])
    type: 'text' | 'image' | 'video';

    @IsOptional()
    @IsString()
    style?: string;

    @IsOptional()
    @IsString()
    platform?: string; // e.g., 'instagram', 'telegram'
}

/**
 * Content Engagement Stats
 */
export class ContentEngagementStatsDto {
    @IsUUID()
    contentId: UUID;

    @IsNumber()
    views: number;

    @IsNumber()
    likes: number;

    @IsNumber()
    shares: number;

    @IsNumber()
    comments: number;

    @IsNumber()
    engagementRate: number;
}
