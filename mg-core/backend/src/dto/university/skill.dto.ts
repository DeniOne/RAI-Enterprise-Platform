/**
 * Skill DTOs for Corporate University Module
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsArray,
    IsObject,
    ValidateNested,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Skill Response DTO
 */
export class SkillResponseDto {
    @IsUUID()
    id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    category?: string; // hard, soft, technical

    @IsOptional()
    @IsString()
    levelRequired?: string; // A0, A1, B1, B2, C1, C2

    @IsOptional()
    @IsString()
    kpiImpact?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    academyId?: string;

    @IsOptional()
    @IsString()
    academyName?: string;
}

/**
 * User Skill Response DTO
 */
export class UserSkillResponseDto {
    @ValidateNested()
    @Type(() => SkillResponseDto)
    skill: SkillResponseDto;

    @IsNumber()
    @Min(0)
    @Max(100)
    myLevel: number;

    @IsOptional()
    @IsString()
    verifiedAt?: string;

    @IsOptional()
    @IsString()
    verifiedBy?: string;

    @IsOptional()
    @IsString()
    verifiedByName?: string;
}

/**
 * Create Skill Request DTO
 */
export class CreateSkillDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsUUID()
    academyId?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    levelRequired?: string;

    @IsOptional()
    @IsString()
    kpiImpact?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

/**
 * Update User Skill Request DTO
 */
export class UpdateUserSkillDto {
    @IsUUID()
    skillId: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    level: number;

    @IsOptional()
    @IsUUID()
    verifiedBy?: string;
}

/**
 * Missing Skill DTO
 */
export class MissingSkillDto {
    @IsUUID()
    skillId: string;

    @IsString()
    name: string;

    @IsNumber()
    currentLevel: number;

    @IsNumber()
    requiredLevel: number;

    @IsArray()
    @IsString({ each: true })
    recommendedCourses: string[];
}

/**
 * Skill Gap Analysis Response DTO
 */
export class SkillGapAnalysisDto {
    @IsString()
    targetRole: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    currentLevel: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MissingSkillDto)
    missingSkills: MissingSkillDto[];
}

/**
 * User Grade Response DTO
 */
export class UserGradeResponseDto {
    @IsUUID()
    userId: string;

    @IsString()
    currentGrade: string;

    @IsNumber()
    motivationCoefficient: number;

    @IsArray()
    gradeHistory: any[];

    @IsOptional()
    @IsObject()
    nextGrade?: {
        name: string;
        requirements: any;
    };
}

/**
 * Upgrade Grade Request DTO
 */
export class UpgradeGradeDto {
    @IsUUID()
    userId: string;

    @IsString()
    newGrade: string;

    @IsOptional()
    @IsString()
    reason?: string;
}
