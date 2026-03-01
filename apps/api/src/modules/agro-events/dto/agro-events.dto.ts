import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateAgroEventDraftDto {
  @IsString()
  eventType: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  farmRef?: string;

  @IsString()
  @IsOptional()
  fieldRef?: string;

  @IsString()
  @IsOptional()
  taskRef?: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @IsArray()
  @IsOptional()
  evidence?: any[];

  @IsNumber()
  @IsOptional()
  confidence?: number;
}

export class FixAgroEventDto {
  @IsString()
  draftId: string;

  @IsObject()
  patch: Record<string, any>;
}

export class LinkAgroEventDto {
  @IsString()
  draftId: string;

  @IsString()
  @IsOptional()
  farmRef?: string;

  @IsString()
  @IsOptional()
  fieldRef?: string;

  @IsString()
  @IsOptional()
  taskRef?: string;
}

export class ConfirmAgroEventDto {
  @IsString()
  draftId: string;
}

export class CommitAgroEventDto {
  @IsString()
  draftId: string;
}
