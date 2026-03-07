import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class QueueMetricPointDto {
  @IsString()
  queueName: string;

  @IsNumber()
  lastSize: number;

  @IsNumber()
  avgSize: number;

  @IsNumber()
  peakSize: number;

  @IsNumber()
  samples: number;

  @IsNumber()
  activeInstances: number;

  @IsOptional()
  @IsISO8601()
  lastObservedAt: string | null;
}

export class QueuePressureResponseDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsIn(["IDLE", "STABLE", "PRESSURED", "SATURATED"])
  pressureState: "IDLE" | "STABLE" | "PRESSURED" | "SATURATED" | null;

  @IsBoolean()
  signalFresh: boolean;

  @IsOptional()
  @IsNumber()
  totalBacklog: number | null;

  @IsOptional()
  @IsString()
  hottestQueue: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueueMetricPointDto)
  observedQueues: QueueMetricPointDto[];
}
