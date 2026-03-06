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
}
