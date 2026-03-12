import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MemoryMaintenanceAction,
  MemoryMaintenancePlaybookId,
} from '../memory-maintenance.types';

export class RunMemoryMaintenanceDto {
  @IsOptional()
  @IsEnum(MemoryMaintenancePlaybookId)
  playbookId?: MemoryMaintenancePlaybookId;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(MemoryMaintenanceAction, { each: true })
  actions?: MemoryMaintenanceAction[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxRuns?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
