/**
 * Legal & Compliance DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsOptional,
    IsDateString,
    IsBoolean,
    IsArray,
    IsObject,
    IsNumber,
} from 'class-validator';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Document template response
 */
export class DocumentTemplateDto {
    @IsUUID()
    id: UUID;

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    category: string;

    @IsArray()
    @IsString({ each: true })
    requiredFields: string[];
}

/**
 * Generate document request
 */
export class GenerateDocumentRequestDto {
    @IsUUID()
    templateId: UUID;

    @IsObject()
    data: Record<string, any>;
}

/**
 * Compliance checklist item
 */
export class ComplianceChecklistItemDto {
    @IsString()
    id: string;

    @IsString()
    category: string;

    @IsString()
    requirement: string;

    @IsBoolean()
    isCompliant: boolean;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsDateString()
    lastChecked?: ISODateTime;
}

/**
 * Risk dashboard response
 */
export class RiskDashboardDto {
    @IsNumber()
    overallRiskScore: number;

    @IsArray()
    highRisks: string[];

    @IsArray()
    mediumRisks: string[];

    @IsDateString()
    lastAuditDate: ISODateTime;
}

/**
 * GDPR/152-FZ Consent Request
 */
export class ConsentRequestDto {
    @IsBoolean()
    marketing: boolean;

    @IsBoolean()
    analytics: boolean;

    @IsBoolean()
    thirdParty: boolean;
}
