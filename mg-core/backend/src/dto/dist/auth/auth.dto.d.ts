import { UserRole, UserStatus } from '../common/common.enums';
import { UUID, ISODateTime, Email } from '../common/common.types';
export declare class RegisterRequestDto {
    email: Email;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber?: string;
    acceptedNDA: boolean;
}
export declare class LoginRequestDto {
    email: Email;
    password: string;
}
export declare class RefreshTokenRequestDto {
    refreshToken: string;
}
export declare class UserResponseDto {
    id: UUID;
    email: Email;
    role: UserRole;
    status: UserStatus;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phoneNumber?: string;
    avatar?: string;
    departmentId?: UUID;
    lastLoginAt?: ISODateTime;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserResponseDto;
}
export declare class ForgotPasswordRequestDto {
    email: Email;
}
export declare class ResetPasswordRequestDto {
    token: string;
    newPassword: string;
}
export declare class PermissionsResponseDto {
    permissions: string[];
}
//# sourceMappingURL=auth.dto.d.ts.map