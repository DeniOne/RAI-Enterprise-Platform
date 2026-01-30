/**
 * Employee DTOs for MatrixGin v2.0 API
 * 
 * REMEDIATION: MODULE 02
 * Removed: KPI, emotional analytics, ratings, engagement metrics
 * All personal evaluation features are DEFERRED
 */

import {
    IsString,
    IsUUID,
    IsEnum,
    IsOptional,
    IsNumber,
    IsDateString,
    MinLength,
    MaxLength,
    Min,
    Matches,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus, EmployeeRank } from '../common/common.enums';
import { UUID, ISODate, ISODateTime } from '../common/common.types';
import { UserResponseDto } from '../auth/auth.dto';
import { DepartmentResponseDto } from '../departments/department.dto';

/**
 * Create employee request
 */
export class CreateEmployeeRequestDto {
    @IsUUID()
    userId: UUID;

    @IsUUID()
    departmentId: UUID;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    position: string;

    @IsDateString()
    hireDate: ISODate;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salary?: number;

    @IsOptional()
    @IsString()
    @Matches(/^EMP-\d{6}$/, {
        message: 'Номер сотрудника должен быть в формате EMP-XXXXXX',
    })
    employeeNumber?: string;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;

    @IsOptional()
    @IsEnum(EmployeeRank)
    rank?: EmployeeRank;
}

/**
 * Update employee request
 */
export class UpdateEmployeeRequestDto {
    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    position?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salary?: number;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;

    @IsOptional()
    @IsEnum(EmployeeRank)
    rank?: EmployeeRank;
}

/**
 * Update employee status request (replaces promote/demote)
 * Requires explicit human decision - no automatic logic
 */
export class UpdateStatusRequestDto {
    @IsEnum(EmployeeStatus)
    status: EmployeeStatus;
}

/**
 * Employee response
 * Note: salary field is filtered by role (see field-level access control)
 */
export class EmployeeResponseDto {
    @IsUUID()
    id: UUID;

    @IsUUID()
    userId: UUID;

    @IsOptional()
    @ValidateNested()
    @Type(() => UserResponseDto)
    user?: UserResponseDto;

    @IsUUID()
    departmentId: UUID;

    @IsOptional()
    @ValidateNested()
    @Type(() => DepartmentResponseDto)
    department?: DepartmentResponseDto;

    @IsString()
    position: string;

    @IsOptional()
    @IsString()
    employeeNumber?: string;

    @IsOptional()
    @IsNumber()
    salary?: number; // Field-level access: HR only

    @IsEnum(EmployeeStatus)
    status: EmployeeStatus;

    @IsEnum(EmployeeRank)
    rank: EmployeeRank;

    @IsDateString()
    hireDate: ISODate;

    @IsOptional()
    @IsDateString()
    terminationDate?: ISODate;

    @IsOptional()
    @IsNumber()
    mcBalance?: number;

    @IsOptional()
    @IsNumber()
    gmcBalance?: number;

    @IsDateString()
    createdAt: ISODateTime;

    @IsDateString()
    updatedAt: ISODateTime;
}

/**
 * Employee filters for queries
 * Removed: emotional tone filters (DEFERRED)
 */
export class EmployeeFiltersDto {
    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;

    @IsOptional()
    @IsEnum(EmployeeRank)
    rank?: EmployeeRank;

    @IsOptional()
    @IsString()
    search?: string;
}
