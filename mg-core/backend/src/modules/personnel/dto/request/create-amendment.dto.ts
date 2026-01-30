import { IsObject, IsDateString, IsOptional } from 'class-validator';

export class CreateAmendmentDto {
    @IsObject()
    changes: any;

    @IsDateString()
    @IsOptional()
    effectiveDate?: string;
}
