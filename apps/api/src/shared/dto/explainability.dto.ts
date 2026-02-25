import {
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  ArrayMaxSize,
  ArrayMinSize,
  IsISO8601,
  IsIn,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Analytical Factor: Weight-Impact pair for decision reasoning.
 */
export class ExplainabilityFactorDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number; // 0-1

  @IsNumber()
  @Min(-1)
  @Max(1)
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
  @Min(-1)
  @Max(1)
  probabilityShift: number;
}

/**
 * Forensic Metadata: Reproducibility and Audit Trail.
 */
export class ForensicMetadataDto {
  @IsString()
  modelVersion: string;

  @IsString()
  @IsISO8601()
  inferenceTimestamp: string;

  @IsString()
  @Matches(/^(?:[a-fA-F0-9]{64,}|[A-Za-z0-9+/=]{32,})$/)
  inputCanonicalHash: string;

  @IsString()
  @IsOptional()
  @Matches(/^(?:[a-fA-F0-9]{64,}|[A-Za-z0-9+/=]{32,})$/)
  featureVectorHash?: string;

  @IsString()
  @Matches(/^(?:[a-fA-F0-9]{64,}|[A-Za-z0-9+/=]{32,})$/)
  explainabilityCanonicalHash: string;

  @IsString()
  ledgerTraceId: string;

  @IsString()
  @IsOptional()
  ledgerTxId?: string;

  @IsString()
  @IsOptional()
  merkleRoot?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  merkleProof?: string[];

  @IsString()
  @IsOptional()
  @IsIn(["prod", "staging", "dev"])
  environment?: "prod" | "staging" | "dev";

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
  @Min(0)
  @Max(1)
  confidence: number;

  @IsString()
  verdict: string;

  // Level 2: Analytical
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(32)
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
