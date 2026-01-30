"use strict";
/**
 * Authentication DTOs for MatrixGin v2.0 API
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsResponseDto = exports.ResetPasswordRequestDto = exports.ForgotPasswordRequestDto = exports.AuthResponseDto = exports.UserResponseDto = exports.RefreshTokenRequestDto = exports.LoginRequestDto = exports.RegisterRequestDto = void 0;
const class_validator_1 = require("class-validator");
const common_enums_1 = require("../common/common.enums");
/**
 * User registration request
 */
class RegisterRequestDto {
    email;
    password;
    firstName;
    lastName;
    middleName;
    phoneNumber;
    acceptedNDA;
    personalDataConsent;
}
exports.RegisterRequestDto = RegisterRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы (@$!%*?&)',
    }),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "middleName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+7\d{10}$/, {
        message: 'Номер телефона должен быть в формате +7XXXXXXXXXX',
    }),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterRequestDto.prototype, "acceptedNDA", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterRequestDto.prototype, "personalDataConsent", void 0);
/**
 * Login request
 */
class LoginRequestDto {
    email;
    password;
}
exports.LoginRequestDto = LoginRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginRequestDto.prototype, "password", void 0);
/**
 * Refresh token request
 */
class RefreshTokenRequestDto {
    refreshToken;
}
exports.RefreshTokenRequestDto = RefreshTokenRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenRequestDto.prototype, "refreshToken", void 0);
/**
 * User response data
 */
class UserResponseDto {
    id;
    email;
    role;
    status;
    firstName;
    lastName;
    middleName;
    phoneNumber;
    avatar;
    departmentId;
    lastLoginAt;
    createdAt;
    updatedAt;
    personalDataConsent;
    mustResetPassword;
    foundationStatus;
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.UserRole),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.UserStatus),
    __metadata("design:type", String)
], UserResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "middleName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "lastLoginAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "personalDataConsent", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "mustResetPassword", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserResponseDto.prototype, "foundationStatus", void 0);
/**
 * Authentication response with tokens
 */
class AuthResponseDto {
    accessToken;
    refreshToken;
    expiresIn;
    user;
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AuthResponseDto.prototype, "expiresIn", void 0);
/**
 * Forgot password request
 */
class ForgotPasswordRequestDto {
    email;
}
exports.ForgotPasswordRequestDto = ForgotPasswordRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordRequestDto.prototype, "email", void 0);
/**
 * Reset password request
 */
class ResetPasswordRequestDto {
    token;
    newPassword;
}
exports.ResetPasswordRequestDto = ResetPasswordRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordRequestDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и спецсимволы (@$!%*?&)',
    }),
    __metadata("design:type", String)
], ResetPasswordRequestDto.prototype, "newPassword", void 0);
/**
 * User permissions response
 */
class PermissionsResponseDto {
    permissions;
}
exports.PermissionsResponseDto = PermissionsResponseDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PermissionsResponseDto.prototype, "permissions", void 0);
