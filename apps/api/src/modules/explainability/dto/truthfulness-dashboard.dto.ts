import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class TruthfulnessWorstTraceDto {
  @IsString()
  traceId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  bsScorePct: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  evidenceCoveragePct: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  invalidClaimsPct?: number | null;

  @IsISO8601()
  createdAt: string;
}

export class TruthfulnessDashboardResponseDto {
  @IsString()
  companyId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  avgBsScore: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  p95BsScore: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  avgEvidenceCoverage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  acceptanceRate: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  correctionRate: number | null;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TruthfulnessWorstTraceDto)
  worstTraces: TruthfulnessWorstTraceDto[];
}

