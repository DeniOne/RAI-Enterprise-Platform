import { IsEnum, IsNumber, IsString, IsArray, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AIExplainabilityDto } from '../../../shared/dto/explainability.dto';

export enum AdvisorySignalType {
    RISK = 'RISK',
    HEALTH = 'HEALTH',
    EFFICIENCY = 'EFFICIENCY',
    STABILITY = 'STABILITY',
}

export enum AdvisoryLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export enum AdvisoryTrend {
    IMPROVING = 'IMPROVING',
    WORSENING = 'WORSENING',
    STABLE = 'STABLE',
}

export class AdvisorySignalDto {
    @IsEnum(AdvisorySignalType)
    type: AdvisorySignalType;

    @IsEnum(AdvisoryLevel)
    level: AdvisoryLevel;

    @IsNumber()
    score: number; // 0-100

    @IsString()
    message: string;

    @IsNumber()
    confidence: number; // 0-1

    @IsEnum(AdvisoryTrend)
    trend: AdvisoryTrend;

    @IsArray()
    @IsString({ each: true })
    sources: string[];

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => AIExplainabilityDto)
    explainability?: AIExplainabilityDto;
}
