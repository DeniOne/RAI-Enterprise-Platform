import { ContractType, ContractStatus, ContractSalaryType } from '@prisma/client';

export class ContractResponseDto {
    id: string;
    personalFileId: string;
    contractNumber: string;
    contractType: ContractType;
    contractDate: Date;
    startDate: Date;
    endDate?: Date;
    status: ContractStatus;
    positionId: string;
    departmentId: string;
    salary: number;
    salaryType: ContractSalaryType;
    workSchedule: string;
    probationDays: number;
    terminationDate?: Date;
    terminationReason?: string;
    createdAt: Date;
    updatedAt: Date;

    // Relations (optional)
    personalFile?: any;
    amendments?: any[];
}
