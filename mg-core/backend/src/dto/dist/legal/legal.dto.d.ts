import { UUID, ISODateTime } from '../common/common.types';
export declare class DocumentTemplateDto {
    id: UUID;
    name: string;
    description: string;
    category: string;
    requiredFields: string[];
}
export declare class GenerateDocumentRequestDto {
    templateId: UUID;
    data: Record<string, any>;
}
export declare class ComplianceChecklistItemDto {
    id: string;
    category: string;
    requirement: string;
    isCompliant: boolean;
    notes?: string;
    lastChecked?: ISODateTime;
}
export declare class RiskDashboardDto {
    overallRiskScore: number;
    highRisks: string[];
    mediumRisks: string[];
    lastAuditDate: ISODateTime;
}
export declare class ConsentRequestDto {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
}
//# sourceMappingURL=legal.dto.d.ts.map