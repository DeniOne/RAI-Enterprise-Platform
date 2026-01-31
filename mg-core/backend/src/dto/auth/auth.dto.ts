/**
 * Authentication DTOs for BusinessCore v2.0 API
 */

import {
    IsString,
    IsEmail,
    IsBoolean,
    IsOptional,
    IsUUID,
    IsEnum,
    IsDateString,
    IsInt,
    IsArray,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { UserRole, UserStatus } from '../common/common.enums';
import { UUID, ISODateTime, Email } from '../common/common.types';

/**
 * User registration request
 */
export class RegisterRequestDto {
    @IsEmail()
    @MinLength(5)
    @MaxLength(255)
    email: Email;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message:
            'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы (@$!%*?&)',
    })
    password: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    middleName?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\+7\d{10}$/, {
        message: 'Номер телефона должен быть в формате +7XXXXXXXXXX',
    })
    phoneNumber?: string;

    @IsBoolean()
    acceptedNDA: boolean;

    @IsBoolean()
    personalDataConsent: boolean;
}

/**
 * Login request
 */
export class LoginRequestDto {
    @IsEmail()
    email: Email;

    @IsString()
    password: string;
}

/**
 * Refresh token request
 */
export class RefreshTokenRequestDto {
    @IsString()
    refreshToken: string;
}

/**
 * User response data
 */
export class UserResponseDto {
    @IsUUID()
    id: UUID;

    @IsEmail()
    email: Email;

    @IsEnum(UserRole)
    role: UserRole;

    @IsEnum(UserStatus)
    status: UserStatus;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsUUID()
    departmentId?: UUID;

    @IsOptional()
    @IsDateString()
    lastLoginAt?: ISODateTime;

    @IsDateString()
    createdAt: ISODateTime;

    @IsDateString()
    updatedAt: ISODateTime;

    @IsBoolean()
    personalDataConsent: boolean;

    @IsBoolean()
    mustResetPassword: boolean;

    @IsOptional()
    @IsString()
    @IsEnum(['NOT_STARTED', 'READING', 'READY_TO_ACCEPT', 'ACCEPTED'])
    foundationStatus?: 'NOT_STARTED' | 'READING' | 'READY_TO_ACCEPT' | 'ACCEPTED';

    @IsOptional()
    @IsString()
    @IsEnum(['PENDING_BASE', 'ADMITTED'])
    admissionStatus?: string;
}

/**
 * Authentication response with tokens
 */
export class AuthResponseDto {
    @IsString()
    accessToken: string;

    @IsString()
    refreshToken: string;

    @IsInt()
    expiresIn: number;

    user: UserResponseDto;
}

/**
 * Forgot password request
 */
export class ForgotPasswordRequestDto {
    @IsEmail()
    email: Email;
}

/**
 * Reset password request
 */
export class ResetPasswordRequestDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message:
            'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы (@$!%*?&)',
    })
    newPassword: string;
}

/**
 * User permissions response
 */
export class PermissionsResponseDto {
    @IsArray()
    @IsString({ each: true })
    permissions: string[];
}


