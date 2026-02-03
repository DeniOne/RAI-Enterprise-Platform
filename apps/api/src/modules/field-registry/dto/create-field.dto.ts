import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  Min,
} from "class-validator";
import { SoilType } from "@prisma/client";

export class CreateFieldDto {
  @IsString()
  @IsNotEmpty()
  cadastreNumber: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  area: number;

  @IsObject()
  @IsNotEmpty()
  coordinates: any; // We will validate this as GeoJSON Polygon/MultiPolygon in the service

  @IsEnum(SoilType)
  soilType: SoilType;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  companyId: string; // TODO: BLOCK-AUTH (Temporary in body)
}
