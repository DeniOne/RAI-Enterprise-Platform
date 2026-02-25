import {
  IsString,
  IsNotEmpty,
  IsHexadecimal,
  IsNumber,
  IsEnum,
  IsOptional,
} from "class-validator";

export class CreateQuorumDto {
  @IsString()
  @IsNotEmpty()
  traceId: string;

  @IsString()
  @IsNotEmpty()
  committeeId: string;

  @IsNumber()
  committeeVersion: number;

  @IsOptional()
  @IsString()
  cmrRiskId?: string;

  @IsOptional()
  @IsString()
  decisionRecordId?: string;
}

export class SubmitSignatureDto {
  @IsString()
  @IsNotEmpty()
  traceId: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  pubKey: string;

  @IsString()
  @IsNotEmpty()
  payloadHash: string;

  @IsNumber()
  committeeVersion: number;

  @IsEnum(["R1", "R2", "R3", "R4"])
  riskLevel: string;
}
