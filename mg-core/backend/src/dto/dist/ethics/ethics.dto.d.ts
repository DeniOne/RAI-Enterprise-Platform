import { UUID, ISODateTime } from '../common/common.types';
export declare class EthicsViolationResponseDto {
    id: UUID;
    employeeId: UUID;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'detected' | 'investigating' | 'resolved';
    detectedAt: ISODateTime;
}
export declare class MediationRequestDto {
    partyA: UUID;
    partyB: UUID;
    conflictDescription: string;
}
//# sourceMappingURL=ethics.dto.d.ts.map