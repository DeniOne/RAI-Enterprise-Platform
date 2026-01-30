import { UUID, ISODateTime, ISODate, EmotionalTone } from '../common/common.types';
import { KPIPeriod } from '../common/common.enums';
export declare class DepartmentResponseDto {
    id: UUID;
    name: string;
    code: string;
    description?: string;
    headId?: UUID;
    employeeCount?: number;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export declare class DepartmentKPIMetricsDto {
    revenue?: number;
    tasksCompleted?: number;
    averageEmotionalTone?: EmotionalTone;
    employeeEngagement?: number;
}
export declare class DepartmentKPIResponseDto {
    departmentId: UUID;
    period: KPIPeriod;
    metrics: DepartmentKPIMetricsDto;
}
export declare class MudaTypesDto {
    overproduction?: number;
    waiting?: number;
    transportation?: number;
    overprocessing?: number;
    inventory?: number;
    motion?: number;
    defects?: number;
    unutilizedTalent?: number;
}
export declare class MudaAnalysisResponseDto {
    departmentId: UUID;
    period: ISODate;
    mudaTypes: MudaTypesDto;
    totalLoss: number;
}
//# sourceMappingURL=department.dto.d.ts.map