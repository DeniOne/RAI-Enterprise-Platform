import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRegulatoryProfileDto {
    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    jurisdictionId!: string;

    @IsOptional()
    rulesJson?: Record<string, unknown>;
}
