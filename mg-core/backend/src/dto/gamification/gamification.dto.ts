/**
 * Gamification DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsEnum,
    IsOptional,
    IsNumber,
    IsDateString,
    IsArray,
    Min,
} from 'class-validator';
import { EmployeeStatus, EmployeeRank } from '../common/common.enums';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * User status response
 */
export class StatusResponseDto {
    @IsUUID()
    userId: UUID;

    @IsEnum(EmployeeStatus)
    status: EmployeeStatus;

    @IsEnum(EmployeeRank)
    rank: EmployeeRank;

    @IsNumber()
    @Min(0)
    currentGMC: number;

    @IsNumber()
    @Min(0)
    nextStatusThreshold: number;

    @IsNumber()
    @Min(0)
    progressPercent: number;

    @IsArray()
    @IsString({ each: true })
    privileges: string[];
}

/**
 * Leaderboard entry
 */
export class LeaderboardEntryDto {
    @IsUUID()
    userId: UUID;

    @IsString()
    fullName: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsString()
    position: string;

    @IsNumber()
    score: number;

    @IsNumber()
    rankChange: number;
}

/**
 * Achievement response
 */
export class AchievementResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    icon: string;

    @IsEnum(EmployeeRank)
    requiredRank: EmployeeRank;

    @IsOptional()
    @IsNumber()
    mcReward?: number;

    @IsDateString()
    unlockedAt: ISODateTime;
}

/**
 * Claim reward request
 */
export class ClaimRewardRequestDto {
    @IsUUID()
    achievementId: UUID;
}
