import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class SaveHarvestResultDto {
    @IsString()
    planId: string;

    @IsString()
    fieldId: string;

    @IsString()
    crop: string;

    @IsNumber()
    @IsOptional()
    plannedYield?: number;

    @IsNumber()
    @IsOptional()
    actualYield?: number;

    @IsNumber()
    @IsOptional()
    harvestedArea?: number;

    @IsNumber()
    @IsOptional()
    totalOutput?: number;

    @IsNumber()
    @IsOptional()
    marketPrice?: number;

    @IsString()
    @IsOptional()
    qualityClass?: string;

    @IsDateString()
    @IsOptional()
    harvestDate?: string;
}
