import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const NODE_KINDS = [
  "router",
  "agent",
  "tools",
  "composer",
  "trace_summary_record",
  "audit_write",
  "truthfulness",
  "quality_update",
  "pending_action",
  "decision",
  "quorum",
] as const;

export type ExplainabilityTimelineNodeKind = (typeof NODE_KINDS)[number];

export class ExplainabilityTimelineNodeDto {
  @IsIn(NODE_KINDS)
  kind: ExplainabilityTimelineNodeKind;

  @IsISO8601()
  timestamp: string;

  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ExplainabilityTimelineResponseDto {
  @IsString()
  traceId: string;

  @IsString()
  companyId: string;

  @IsArray()
  @ArrayMaxSize(64)
  @ValidateNested({ each: true })
  @Type(() => ExplainabilityTimelineNodeDto)
  nodes: ExplainabilityTimelineNodeDto[];
}

