import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePartyDto {
    @IsString()
    @IsNotEmpty()
    legalName!: string;

    @IsString()
    @IsNotEmpty()
    jurisdictionId!: string;

    @IsOptional()
    @IsString()
    regulatoryProfileId?: string;
}

export class UpdatePartyDto {
    @IsOptional()
    @IsString()
    legalName?: string;

    @IsOptional()
    @IsString()
    jurisdictionId?: string;

    @IsOptional()
    @IsString()
    regulatoryProfileId?: string;
}

const partyRelationTypes = [
    "OWNERSHIP",
    "AFFILIATION",
    "SUBSIDIARY",
    "FRANCHISE",
    "JOINT_VENTURE",
] as const;

export class CreatePartyRelationDto {
    @IsString()
    @IsNotEmpty()
    sourcePartyId!: string;

    @IsString()
    @IsNotEmpty()
    targetPartyId!: string;

    @IsEnum(partyRelationTypes)
    relationType!: (typeof partyRelationTypes)[number];

    @IsString()
    @IsNotEmpty()
    validFrom!: string;

    @IsOptional()
    @IsString()
    validTo?: string;
}
