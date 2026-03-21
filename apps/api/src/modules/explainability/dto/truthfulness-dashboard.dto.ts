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

export class CriticalPathDashboardDto {
  @IsString()
  traceId: string;

  @IsString()
  phase: string;

  @IsNumber()
  durationMs: number;

  @IsNumber()
  @IsOptional()
  totalDurationMs: number | null;

  @IsISO8601()
  createdAt: string;
}

export class BranchTrustDashboardDto {
  @IsNumber()
  @Min(0)
  knownTraceCount: number;

  @IsNumber()
  @Min(0)
  pendingTraceCount: number;

  @IsNumber()
  @Min(0)
  verifiedBranchCount: number;

  @IsNumber()
  @Min(0)
  partialBranchCount: number;

  @IsNumber()
  @Min(0)
  unverifiedBranchCount: number;

  @IsNumber()
  @Min(0)
  conflictedBranchCount: number;

  @IsNumber()
  @Min(0)
  rejectedBranchCount: number;

  @IsNumber()
  @Min(0)
  crossCheckTraceCount: number;

  @IsNumber()
  @Min(0)
  withinBudgetTraceCount: number;

  @IsNumber()
  @Min(0)
  overBudgetTraceCount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  withinBudgetRate: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  avgLatencyMs: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  p95LatencyMs: number | null;
}

export class TruthfulnessDashboardResponseDto {
  @IsString()
  companyId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  avgBsScore: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  p95BsScore: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  avgEvidenceCoverage: number | null;

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

  @IsNumber()
  qualityKnownTraceCount: number;

  @IsNumber()
  qualityPendingTraceCount: number;

  @ValidateNested()
  @Type(() => BranchTrustDashboardDto)
  branchTrust: BranchTrustDashboardDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriticalPathDashboardDto)
  criticalPath: CriticalPathDashboardDto[];
}
