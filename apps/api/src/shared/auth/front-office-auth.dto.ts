import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateFrontOfficeInvitationDto {
  @IsString()
  @IsNotEmpty()
  partyId!: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  partyContactId?: string;

  @IsString()
  @IsNotEmpty()
  telegramId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  proposedLogin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ActivateFrontOfficeInvitationDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  telegramId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}

export class FrontOfficePasswordLoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SetFrontOfficePasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
