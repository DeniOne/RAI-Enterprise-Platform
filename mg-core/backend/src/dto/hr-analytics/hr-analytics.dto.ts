/**
 * HR Analytics DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsDateString,
    IsNumber,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Network Node (Employee)
 */
export class NetworkNodeDto {
    @IsUUID()
    id: UUID;

    @IsString()
    label: string;

    @IsNumber()
    centralityScore: number;

    @IsString()
    group: string;
}

/**
 * Network Link (Connection)
 */
export class NetworkLinkDto {
    @IsUUID()
    source: UUID;

    @IsUUID()
    target: UUID;

    @IsNumber()
    weight: number;
}

/**
 * Network Analysis Response
 */
export class NetworkAnalysisResponseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NetworkNodeDto)
    nodes: NetworkNodeDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NetworkLinkDto)
    links: NetworkLinkDto[];

    @IsDateString()
    analyzedAt: ISODateTime;
}

/**
 * Micro Survey Request
 */
export class MicroSurveyRequestDto {
    @IsString()
    title: string;

    @IsArray()
    @IsString({ each: true })
    questions: string[];

    @IsNumber()
    targetPercentage: number; // e.g., 10%
}
