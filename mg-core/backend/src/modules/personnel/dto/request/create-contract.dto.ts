import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { ContractType, ContractSalaryType } from '@prisma/client';

export class CreateContractDto {
    @IsString()
    personalFileId: string;

    @IsEnum(ContractType)
    contractType: ContractType;

    @IsDateString()
    contractDate: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    positionId: string;

    @IsString()
    departmentId: string;

    @IsNumber()
    @Min(0)
    salary: number;

    @IsEnum(ContractSalaryType)
    @IsOptional()
    salaryType?: ContractSalaryType;

    @IsString()
    workSchedule: string;

    @IsNumber()
    @IsOptional()
    probationDays?: number;
}
