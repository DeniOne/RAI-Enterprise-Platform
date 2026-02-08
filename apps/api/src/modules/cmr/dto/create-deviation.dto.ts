import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateDeviationDto {
    @IsString()
    @IsNotEmpty()
    stageId: string;

    @IsString()
    @IsNotEmpty()
    fieldId: string;

    @IsObject()
    @IsNotEmpty()
    deviationData: any;

    @IsString()
    @IsOptional()
    comment?: string;
}
