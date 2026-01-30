import { EmployeeStatus, EmployeeRank } from '../common/common.enums';
import { UUID, ISODate, ISODateTime, EmotionalTone } from '../common/common.types';
import { UserResponseDto } from '../auth/auth.dto';
import { DepartmentResponseDto } from '../departments/department.dto';
export declare class CreateEmployeeRequestDto {
    userId: UUID;
    departmentId: UUID;
    position: string;
    hireDate: ISODate;
    salary?: number;
    employeeNumber?: string;
    status?: EmployeeStatus;
    rank?: EmployeeRank;
}
export declare class UpdateEmployeeRequestDto {
    departmentId?: UUID;
    position?: string;
    salary?: number;
    status?: EmployeeStatus;
    rank?: EmployeeRank;
}
export declare class EmployeeResponseDto {
    id: UUID;
    userId: UUID;
    user?: UserResponseDto;
    departmentId: UUID;
    department?: DepartmentResponseDto;
    position: string;
    employeeNumber?: string;
    salary?: number;
    status: EmployeeStatus;
    rank: EmployeeRank;
    hireDate: ISODate;
    terminationDate?: ISODate;
    emotionalTone?: EmotionalTone;
    mcBalance?: number;
    gmcBalance?: number;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export declare class EmployeeAnalyticsResponseDto {
    employeeId: UUID;
    kpiScore: number;
    tasksCompleted: number;
    averageTaskCompletionTime: number;
    emotionalToneAverage?: EmotionalTone;
    burnoutRisk: number;
    engagementIndex: number;
}
export declare class EmployeeFiltersDto {
    departmentId?: UUID;
    status?: EmployeeStatus;
    rank?: EmployeeRank;
    minEmotionalTone?: number;
    maxEmotionalTone?: number;
    search?: string;
}
//# sourceMappingURL=employee.dto.d.ts.map