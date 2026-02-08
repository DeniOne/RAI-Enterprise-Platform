import { ComplianceStatus, ImpactTargetType } from '@rai/prisma-client';
export interface IComplianceSignal {
    requirementId: string;
    status: ComplianceStatus;
    observation?: string;
    confidenceLevel: number;
    checkedAt: Date;
}
export interface IImpactMapping {
    requirementId: string;
    targetType: ImpactTargetType;
    targetId: string;
}
export interface ILegalChangeSignal {
    documentId: string;
    type: 'UPDATE' | 'NEW' | 'REVOKE';
    diff?: any;
}
