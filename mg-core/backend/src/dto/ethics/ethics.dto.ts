/**
 * Ethics Manager DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsDateString,
} from 'class-validator';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Ethics Violation Response
 */
export class EthicsViolationResponseDto {
    @IsUUID()
    id: UUID;

    @IsUUID()
    employeeId: UUID;

    @IsString()
    type: string;

    @IsString()
    description: string;

    @IsString()
    severity: 'low' | 'medium' | 'high' | 'critical';

    @IsString()
    status: 'detected' | 'investigating' | 'resolved';

    @IsDateString()
    detectedAt: ISODateTime;
}

/**
 * Mediation Request
 */
export class MediationRequestDto {
    @IsUUID()
    partyA: UUID;

    @IsUUID()
    partyB: UUID;

    @IsString()
    conflictDescription: string;
}
