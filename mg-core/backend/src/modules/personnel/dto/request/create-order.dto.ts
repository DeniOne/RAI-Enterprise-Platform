import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PersonnelOrderType } from '@prisma/client';

export class CreateOrderDto {
    @IsString()
    personalFileId: string;

    @IsEnum(PersonnelOrderType)
    orderType: PersonnelOrderType;

    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    basis?: string;

    @IsDateString()
    orderDate: string;

    @IsDateString()
    effectiveDate: string;
}
