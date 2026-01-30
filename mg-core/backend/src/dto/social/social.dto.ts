/**
 * Social Monitoring DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsDateString,
    IsNumber,
    IsArray,
    IsUrl,
} from 'class-validator';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Social Screening Request
 */
export class SocialScreeningRequestDto {
    @IsString()
    candidateName: string;

    @IsArray()
    @IsUrl({}, { each: true })
    socialLinks: string[];
}

/**
 * Social Mood Response
 */
export class SocialMoodResponseDto {
    @IsUUID()
    userId: UUID;

    @IsString()
    platform: string;

    @IsString()
    mood: string; // e.g., 'positive', 'negative', 'neutral'

    @IsNumber()
    confidenceScore: number;

    @IsDateString()
    analyzedAt: ISODateTime;
}
