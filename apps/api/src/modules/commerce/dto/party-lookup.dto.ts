import { Type } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

const lookupJurisdictions = ["RU", "BY", "KZ"] as const;
const lookupPartyTypes = ["LEGAL_ENTITY", "IP", "KFH"] as const;

export class PartyLookupQueryDto {
  @IsOptional()
  @IsString()
  inn?: string;

  @IsOptional()
  @IsString()
  kpp?: string;

  @IsOptional()
  @IsString()
  unp?: string;

  @IsOptional()
  @IsString()
  bin?: string;
}

export class PartyLookupRequestDto {
  @IsEnum(lookupJurisdictions)
  jurisdictionId!: (typeof lookupJurisdictions)[number];

  @IsEnum(lookupPartyTypes)
  partyType!: (typeof lookupPartyTypes)[number];

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PartyLookupQueryDto)
  identifiers!: PartyLookupQueryDto;
}
