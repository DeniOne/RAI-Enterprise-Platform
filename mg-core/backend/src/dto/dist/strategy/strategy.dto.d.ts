import { UUID, ISODateTime } from '../common/common.types';
export declare class KeyResultDto {
    id?: UUID;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
}
export declare class OKRResponseDto {
    id: UUID;
    objective: string;
    period: string;
    progress: number;
    departmentId?: UUID;
    ownerId?: UUID;
    keyResults: KeyResultDto[];
    createdAt: ISODateTime;
}
export declare class CreateOKRRequestDto {
    objective: string;
    period: string;
    departmentId?: UUID;
    keyResults: KeyResultDto[];
}
export declare class UpdateOKRRequestDto {
    objective?: string;
    progress?: number;
    keyResults?: KeyResultDto[];
}
export declare class CTMDashboardDto {
    transformationIndex: number;
    digitalAdoptionRate: number;
    processAutomationLevel: number;
    activeInitiatives: string[];
}
//# sourceMappingURL=strategy.dto.d.ts.map