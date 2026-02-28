import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

const assetStatuses = ["ACTIVE", "ARCHIVED"] as const;
const assetPartyRoles = ["OWNER", "OPERATOR", "LESSEE", "MANAGER", "BENEFICIARY"] as const;
const assetTypes = ["FARM", "FIELD", "OBJECT"] as const;

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  regionCode?: string;

  @IsOptional()
  @IsEnum(assetStatuses)
  status?: (typeof assetStatuses)[number];
}

export class CreateAssetRoleDto {
  @IsString()
  @IsNotEmpty()
  partyId!: string;

  @IsEnum(assetPartyRoles)
  role!: (typeof assetPartyRoles)[number];

  @IsString()
  @IsNotEmpty()
  validFrom!: string;

  @IsOptional()
  @IsString()
  validTo?: string;

  @IsOptional()
  @IsEnum(assetTypes)
  assetType?: (typeof assetTypes)[number];
}
