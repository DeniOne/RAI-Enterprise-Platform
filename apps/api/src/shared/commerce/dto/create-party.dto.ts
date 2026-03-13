import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

const partyTypes = [
    "HOLDING",
    "LEGAL_ENTITY",
    "IP",
    "KFH",
    "MANAGEMENT_CO",
    "BANK",
    "INSURER",
] as const;

const partyStatuses = ["ACTIVE", "FROZEN"] as const;

export class CreatePartyDto {
    @IsOptional()
    @IsEnum(partyTypes)
    type?: (typeof partyTypes)[number];

    @IsString()
    @IsNotEmpty()
    legalName!: string;

    @IsOptional()
    @IsString()
    shortName?: string;

    @IsString()
    @IsNotEmpty()
    jurisdictionId!: string;

    @IsOptional()
    @IsEnum(partyStatuses)
    status?: (typeof partyStatuses)[number];

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsString()
    regulatoryProfileId?: string;

    @IsOptional()
    registrationData?: any;
}

export class UpdatePartyDto {
    @IsOptional()
    @IsEnum(partyTypes)
    type?: (typeof partyTypes)[number];

    @IsOptional()
    @IsString()
    legalName?: string;

    @IsOptional()
    @IsString()
    shortName?: string;

    @IsOptional()
    @IsString()
    jurisdictionId?: string;

    @IsOptional()
    @IsEnum(partyStatuses)
    status?: (typeof partyStatuses)[number];

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsString()
    regulatoryProfileId?: string;

    @IsOptional()
    registrationData?: any;
}

const partyRelationTypes = [
    "OWNERSHIP",
    "MANAGEMENT",
    "AFFILIATED",
    "AGENCY",
] as const;

export class CreatePartyRelationDto {
    @IsString()
    @IsNotEmpty()
    fromPartyId!: string;

    @IsString()
    @IsNotEmpty()
    toPartyId!: string;

    @IsEnum(partyRelationTypes)
    relationType!: (typeof partyRelationTypes)[number];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    sharePct?: number;

    @IsString()
    @IsNotEmpty()
    validFrom!: string;

    @IsOptional()
    @IsString()
    validTo?: string;

    @IsOptional()
    @IsString()
    basisDocId?: string;
}

export class UpdatePartyRelationDto {
    @IsOptional()
    @IsString()
    fromPartyId?: string;

    @IsOptional()
    @IsString()
    toPartyId?: string;

    @IsOptional()
    @IsEnum(partyRelationTypes)
    relationType?: (typeof partyRelationTypes)[number];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    sharePct?: number | null;

    @IsOptional()
    @IsString()
    validFrom?: string;

    @IsOptional()
    @IsString()
    validTo?: string | null;

    @IsOptional()
    @IsString()
    basisDocId?: string | null;
}
