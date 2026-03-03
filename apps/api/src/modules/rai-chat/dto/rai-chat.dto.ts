import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  MaxLength,
  ArrayMaxSize,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { RaiSuggestedAction, RaiToolName } from "../tools/rai-tools.types";
import { RaiChatWidget } from "../widgets/rai-chat-widgets.types";

export enum WorkspaceEntityKind {
  farm = "farm",
  field = "field",
  party = "party",
  techmap = "techmap",
  task = "task",
  contract = "contract",
  operation = "operation",
}

export class WorkspaceEntityRefDto {
  @IsEnum(WorkspaceEntityKind)
  kind: WorkspaceEntityKind;

  @IsString()
  @MaxLength(128)
  id: string;
}

export class SelectedRowSummaryDto {
  @IsString()
  @MaxLength(64)
  kind: string;

  @IsString()
  @MaxLength(128)
  id: string;

  @IsString()
  @MaxLength(160)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  status?: string;
}

export class WorkspaceContextDto {
  @IsString()
  @MaxLength(256)
  route: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(10)
  @Type(() => WorkspaceEntityRefDto)
  activeEntityRefs?: WorkspaceEntityRefDto[];

  @IsObject()
  @IsOptional()
  filters?: Record<string, string | number | boolean | null>;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SelectedRowSummaryDto)
  selectedRowSummary?: SelectedRowSummaryDto;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  lastUserAction?: string;
}

export enum ExternalSignalKind {
  Ndvi = "ndvi",
  Weather = "weather",
}

export enum ExternalSignalSource {
  Sentinel2 = "sentinel2",
  Landsat8 = "landsat8",
  Landsat9 = "landsat9",
  OpenWeather = "openweather",
}

export enum WeatherSignalMetric {
  TemperatureC = "temperature_c",
  PrecipitationMm = "precipitation_mm",
}

export class ExternalSignalDto {
  @IsString()
  @MaxLength(128)
  id: string;

  @IsEnum(ExternalSignalKind)
  kind: ExternalSignalKind;

  @IsEnum(ExternalSignalSource)
  source: ExternalSignalSource;

  @IsString()
  @MaxLength(128)
  observedAt: string;

  @IsString()
  @MaxLength(128)
  entityRef: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  geoRef?: string;

  @Type(() => Number)
  value: number;

  @Type(() => Number)
  confidence: number;

  @IsString()
  @MaxLength(160)
  provenance: string;

  @IsEnum(WeatherSignalMetric)
  @IsOptional()
  metric?: WeatherSignalMetric;

  @Type(() => Number)
  @IsOptional()
  resolution?: number;

  @Type(() => Number)
  @IsOptional()
  cloudCoverage?: number;
}

export class ExternalAdvisoryFeedbackDto {
  @IsString()
  @MaxLength(16)
  decision: "accept" | "reject";

  @IsString()
  @IsOptional()
  @MaxLength(240)
  reason?: string;
}

export interface ExternalAdvisoryDto {
  traceId: string;
  recommendation: "ALLOW" | "REVIEW";
  confidence: number;
  summary: string;
  explainability: {
    traceId: string;
    why: string;
    factors: Array<{
      name: string;
      value: number | string;
      direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    }>;
    sources: Array<{
      kind: ExternalSignalKind;
      source: ExternalSignalSource;
      observedAt: string;
      entityRef: string;
      provenance: string;
    }>;
  };
}

export class RaiChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkspaceContextDto)
  workspaceContext?: WorkspaceContextDto;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  threadId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  clientTraceId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(5)
  @Type(() => RaiToolCallDto)
  toolCalls?: RaiToolCallDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(4)
  @Type(() => ExternalSignalDto)
  externalSignals?: ExternalSignalDto[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExternalAdvisoryFeedbackDto)
  advisoryFeedback?: ExternalAdvisoryFeedbackDto;
}

export class RaiToolCallDto {
  @IsEnum(RaiToolName)
  name: RaiToolName;

  @IsObject()
  payload: Record<string, unknown>;
}

export class RaiChatResponseDto {
  @IsString()
  text: string;

  @IsObject({ each: true })
  widgets: RaiChatWidget[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RaiToolCallDto)
  toolCalls?: RaiToolCallDto[];

  @IsString()
  @IsOptional()
  traceId?: string;

  @IsString()
  @IsOptional()
  threadId?: string;

  @IsOptional()
  suggestedActions?: RaiSuggestedAction[];

  @IsString()
  @IsOptional()
  @MaxLength(128)
  openUiToken?: string;

  @IsOptional()
  advisory?: ExternalAdvisoryDto;
}
