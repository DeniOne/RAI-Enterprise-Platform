import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class AutonomyStatusDto {
  @IsString()
  companyId: string;

  @IsIn(["AUTONOMOUS", "TOOL_FIRST", "QUARANTINE"])
  level: "AUTONOMOUS" | "TOOL_FIRST" | "QUARANTINE";

  @IsNumber()
  @Min(0)
  @IsOptional()
  avgBsScorePct: number | null;

  @IsNumber()
  @Min(0)
  knownTraceCount: number;

  @IsIn([
    "QUALITY_ALERT",
    "BS_AVG_AUTONOMOUS",
    "BS_AVG_TOOL_FIRST",
    "BS_AVG_QUARANTINE",
    "NO_QUALITY_DATA",
    "MANUAL_OVERRIDE",
  ])
  driver:
    | "QUALITY_ALERT"
    | "BS_AVG_AUTONOMOUS"
    | "BS_AVG_TOOL_FIRST"
    | "BS_AVG_QUARANTINE"
    | "NO_QUALITY_DATA"
    | "MANUAL_OVERRIDE";

  @IsOptional()
  activeQualityAlert?: boolean;

  @IsOptional()
  manualOverride?: {
    active: boolean;
    level: "TOOL_FIRST" | "QUARANTINE";
    reason: string;
    createdAt: string;
    createdByUserId: string | null;
  } | null;
}
