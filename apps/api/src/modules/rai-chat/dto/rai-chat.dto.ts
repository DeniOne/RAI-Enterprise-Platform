import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class RaiChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  workspaceContext?: {
    route?: string;
    moduleKey?: string;
    entityId?: string;
    [key: string]: any;
  };

  @IsString()
  @IsOptional()
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
