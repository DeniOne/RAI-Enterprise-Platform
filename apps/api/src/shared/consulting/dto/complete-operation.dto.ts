import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

export class UsedResourceDto {
  @IsString()
  @IsNotEmpty()
  resourceId: string; // MapResource ID

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteOperationDto {
  @IsString()
  @IsNotEmpty()
  operationId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsedResourceDto)
  actualResources: UsedResourceDto[];
}
