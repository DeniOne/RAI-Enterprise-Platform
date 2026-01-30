/**
 * Personal Cabinet DTOs for MatrixGin v2.0 API
 */

import {
    IsString,
    IsUUID,
    IsDateString,
    IsNumber,
    IsArray,
    IsBoolean,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID, ISODateTime } from '../common/common.types';

/**
 * Notification Response
 */
export class NotificationResponseDto {
    @IsUUID()
    id: UUID;

    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsString()
    type: 'info' | 'warning' | 'success' | 'error';

    @IsBoolean()
    read: boolean;

    @IsDateString()
    createdAt: ISODateTime;
}

/**
 * Cabinet Dashboard Response
 */
export class CabinetDashboardDto {
    @IsUUID()
    userId: UUID;

    @IsNumber()
    tasksPending: number;

    @IsNumber()
    mcBalance: number;

    @IsNumber()
    nextSalaryDays: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NotificationResponseDto)
    recentNotifications: NotificationResponseDto[];
}
