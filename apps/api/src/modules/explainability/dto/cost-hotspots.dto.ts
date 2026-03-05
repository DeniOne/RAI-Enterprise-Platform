import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class CostHotspotsQueryDto {
  @ApiPropertyOptional({ description: "Окно в миллисекундах", default: 86400000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeWindowMs?: number = 86400000;

  @ApiPropertyOptional({ description: "Лимит записей в каждом топике", default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
