import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, ValidateNested, MaxLength, ArrayMaxSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkspaceEntityKind {
  farm = 'farm',
  field = 'field',
  party = 'party',
  techmap = 'techmap',
  task = 'task',
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
}

export class RaiChatResponseDto {
  @IsString()
  text: string;

  @IsObject({ each: true })
  widgets: Array<{
    type: string;
    payload: any;
  }>;

  @IsString()
  @IsOptional()
  traceId?: string;

  @IsString()
  @IsOptional()
  threadId?: string;
}
