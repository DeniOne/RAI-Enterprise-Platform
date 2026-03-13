import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateJurisdictionDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;
}

export class UpdateJurisdictionDto {
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    code?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    name?: string;
}
