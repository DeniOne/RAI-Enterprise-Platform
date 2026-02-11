import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateHarvestPlanDto {
    @IsString()
    accountId: string;

    @IsString()
    @IsOptional()
    targetMetric?: string;

    @IsString()
    @IsOptional()
    period?: string;

    @IsNumber()
    @IsOptional()
    minValue?: number;

    @IsNumber()
    @IsOptional()
    optValue?: number;

    @IsNumber()
    @IsOptional()
    maxValue?: number;

    @IsNumber()
    @IsOptional()
    baselineValue?: number;

    @IsObject()
    @IsOptional()
    contextSnapshot?: any;
}
