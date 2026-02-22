import {
    IsString,
    IsNumber,
    IsArray,
    IsObject,
    IsOptional,
    IsBoolean,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Analytical Factor: Weight-Impact pair for decision reasoning.
 */
export class ExplainabilityFactorDto {
    @IsString()
    name: string;

    @IsNumber()
    weight: number; // 0-1

    @IsNumber()
    impact: number; // -1 to 1

    @IsString()
    @IsOptional()
    description?: string;
}

/**
 * Counterfactual Scenario: "What if" alternative analysis.
 */
export class CounterfactualDto {
    @IsString()
    scenarioName: string;

    @IsObject()
    deltaInput: Record<string, any>;

    @IsString()
    expectedOutcome: string;

    @IsNumber()
    probabilityShift: number;
}

/**
 * Forensic Metadata: Reproducibility and Audit Trail.
 */
export class ForensicMetadataDto {
    @IsString()
    modelVersion: string;

    @IsString()
    canonicalHash: string;

    @IsString()
    seed: string;

    @IsString()
    ledgerId: string;

    @IsString()
    @IsOptional()
    signature?: string;
}

/**
 * Standardized AI Explainability Structure (Phase 5).
 */
export class AIExplainabilityDto {
    // Level 1: Surface
    @IsNumber()
    confidence: number;

    @IsString()
    verdict: string;

    // Level 2: Analytical
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExplainabilityFactorDto)
    factors: ExplainabilityFactorDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CounterfactualDto)
    counterfactuals?: CounterfactualDto[];

    // Level 3: Forensic
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => ForensicMetadataDto)
    forensic?: ForensicMetadataDto;

    @IsBoolean()
    limitationsDisclosed: boolean = true;
}
