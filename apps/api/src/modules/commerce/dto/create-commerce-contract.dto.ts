import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

const contractRoleValues = [
  "SELLER",
  "BUYER",
  "LESSOR",
  "LESSEE",
  "AGENT",
  "PRINCIPAL",
  "PAYER",
  "BENEFICIARY",
] as const;

export type ContractRoleValue = (typeof contractRoleValues)[number];

export class CreateCommerceContractRoleDto {
  @IsString()
  @IsNotEmpty()
  partyId!: string;

  @IsEnum(contractRoleValues)
  role!: ContractRoleValue;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateCommerceContractDto {
  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsDateString()
  validFrom!: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsString()
  @IsNotEmpty()
  jurisdictionId!: string;

  @IsOptional()
  @IsString()
  regulatoryProfileId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCommerceContractRoleDto)
  roles!: CreateCommerceContractRoleDto[];
}
