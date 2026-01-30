/**
 * Kaizen DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsDateString,
    IsNumber,
    IsEnum,
    Min,
} from 'class-validator';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Improvement Proposal Request
 */
export class ImprovementProposalRequestDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    expectedImpact: string;

    @IsOptional()
    @IsString()
    category?: string;
}

/**
 * Improvement Response
 */
export class ImprovementResponseDto {
    @IsUUID()
    id: UUID;

    @IsUUID()
    authorId: UUID;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsEnum(['proposed', 'under_review', 'approved', 'implemented', 'rejected'])
    status: string;

    @IsNumber()
    @Min(0)
    votes: number;

    @IsOptional()
    @IsNumber()
    mcReward?: number;

    @IsDateString()
    createdAt: ISODateTime;
}
