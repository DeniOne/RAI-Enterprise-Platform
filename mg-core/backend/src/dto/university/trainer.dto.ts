/**
 * Trainer DTOs for Corporate University Module
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsEnum,
    IsDate,
    IsObject,
    ValidateNested,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Trainer Specialty Enum
 */
export enum TrainerSpecialty {
    PHOTOGRAPHER = 'PHOTOGRAPHER',
    SALES = 'SALES',
    DESIGNER = 'DESIGNER',
}

/**
 * Trainer Status Enum
 */
export enum TrainerStatus {
    CANDIDATE = 'CANDIDATE',
    TRAINER = 'TRAINER',
    ACCREDITED = 'ACCREDITED',
    SENIOR = 'SENIOR',
    METHODOLOGIST = 'METHODOLOGIST',
}

/**
 * Assignment Status Enum
 */
export enum AssignmentStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

/**
 * Trainer Statistics DTO
 */
export class TrainerStatisticsDto {
    @IsNumber()
    traineesTotal: number;

    @IsNumber()
    traineesSuccessful: number;

    @IsOptional()
    @IsNumber()
    avgNPS?: number;
}

/**
 * Trainer Response DTO
 */
export class TrainerResponseDto {
    @IsUUID()
    id: string;

    @IsUUID()
    userId: string;

    @IsOptional()
    @IsString()
    userName?: string;

    @IsEnum(TrainerSpecialty)
    specialty: TrainerSpecialty;

    @IsEnum(TrainerStatus)
    status: TrainerStatus;

    @IsOptional()
    @IsString()
    accreditationDate?: string;

    @IsOptional()
    @IsNumber()
    rating?: number;

    @ValidateNested()
    @Type(() => TrainerStatisticsDto)
    statistics: TrainerStatisticsDto;
}

/**
 * Create Trainer Request DTO
 */
export class CreateTrainerDto {
    @IsEnum(TrainerSpecialty)
    specialty: TrainerSpecialty;
}

/**
 * Accredit Trainer Request DTO
 */
export class AccreditTrainerDto {
    @IsUUID()
    trainerId: string;
}

/**
 * Training Plan DTO
 */
export class TrainingPlanDto {
    @IsOptional()
    @IsString()
    shift1?: string;

    @IsOptional()
    @IsString()
    shift2?: string;

    @IsOptional()
    @IsString()
    shift3?: string;

    @IsOptional()
    @IsString()
    shift4?: string;
}

/**
 * Assign Trainer Request DTO
 */
export class AssignTrainerDto {
    @IsUUID()
    trainerId: string;

    @IsUUID()
    traineeId: string;

    @IsString()
    startDate: string; // ISO date format

    @IsOptional()
    @ValidateNested()
    @Type(() => TrainingPlanDto)
    plan?: TrainingPlanDto;
}

/**
 * Trainer Assignment Response DTO
 */
export class TrainerAssignmentResponseDto {
    @IsUUID()
    id: string;

    @IsUUID()
    trainerId: string;

    @IsOptional()
    @IsString()
    trainerName?: string;

    @IsUUID()
    traineeId: string;

    @IsOptional()
    @IsString()
    traineeName?: string;

    @IsString()
    startDate: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsEnum(AssignmentStatus)
    status: AssignmentStatus;

    @IsOptional()
    @IsObject()
    plan?: any;
}

/**
 * Training Result Request DTO
 */
export class CreateTrainingResultDto {
    @IsUUID()
    assignmentId: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    kpiImprovement?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    npsScore?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    retentionDays?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    hotLeadsPercentage?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    qualityScore?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Training Result Response DTO
 */
export class TrainingResultResponseDto extends CreateTrainingResultDto {
    @IsUUID()
    id: string;

    @IsString()
    createdAt: string;
}
