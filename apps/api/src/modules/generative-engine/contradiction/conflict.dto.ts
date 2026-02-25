import {
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Min,
  Max,
} from "class-validator";

/**
 * DTO для подтверждения Human Override.
 *
 * Используется в POST /api/v1/generative-engine/contradiction/confirm-override
 */
export class ConfirmOverrideDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  draftId: string;

  @IsNumber()
  @Min(1)
  draftVersion: number;

  @IsString()
  @IsNotEmpty()
  disVersion: string;

  @IsObject()
  @IsNotEmpty()
  humanAction: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsString()
  @IsIn(["DETERMINISTIC", "MONTE_CARLO"])
  simulationMode: "DETERMINISTIC" | "MONTE_CARLO";

  @IsString()
  @IsOptional()
  policyVersion?: string;
}

/**
 * Response DTO для результата Override-анализа.
 */
export class OverrideResultDto {
  divergenceRecordId: string;
  disScore: number;
  deltaRisk: number;
  simulationHash: string;
  regret: number;
  conflictVector: Record<string, number>;
  isSystemFallback: boolean;
}

/**
 * DTO для запроса корреляции DIS↔Regret.
 */
export class CorrelationQueryDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsNumber()
  @IsOptional()
  @Min(7)
  @Max(365)
  windowDays?: number;
}
