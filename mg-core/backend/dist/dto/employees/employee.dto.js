"use strict";
/**
 * Employee DTOs for BusinessCore v2.0 API
 *
 * REMEDIATION: MODULE 02
 * Removed: KPI, emotional analytics, ratings, engagement metrics
 * All personal evaluation features are DEFERRED
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
exports.EmployeeFiltersDto = exports.EmployeeResponseDto = exports.UpdateStatusRequestDto = exports.UpdateEmployeeRequestDto = exports.CreateEmployeeRequestDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_enums_1 = require("../common/common.enums");
const auth_dto_1 = require("../auth/auth.dto");
const department_dto_1 = require("../departments/department.dto");
/**
 * Create employee request
 */
class CreateEmployeeRequestDto {
    userId;
    departmentId;
    position;
    hireDate;
    salary;
    employeeNumber;
    status;
    rank;
}
exports.CreateEmployeeRequestDto = CreateEmployeeRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "hireDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeRequestDto.prototype, "salary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^EMP-\d{6}$/, {
        message: 'Номер сотрудника должен быть в формате EMP-XXXXXX',
    }),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeStatus),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeRank),
    __metadata("design:type", String)
], CreateEmployeeRequestDto.prototype, "rank", void 0);
/**
 * Update employee request
 */
class UpdateEmployeeRequestDto {
    departmentId;
    position;
    salary;
    status;
    rank;
}
exports.UpdateEmployeeRequestDto = UpdateEmployeeRequestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateEmployeeRequestDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateEmployeeRequestDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateEmployeeRequestDto.prototype, "salary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeStatus),
    __metadata("design:type", String)
], UpdateEmployeeRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeRank),
    __metadata("design:type", String)
], UpdateEmployeeRequestDto.prototype, "rank", void 0);
/**
 * Update employee status request (replaces promote/demote)
 * Requires explicit human decision - no automatic logic
 */
class UpdateStatusRequestDto {
    status;
}
exports.UpdateStatusRequestDto = UpdateStatusRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeStatus),
    __metadata("design:type", String)
], UpdateStatusRequestDto.prototype, "status", void 0);
/**
 * Employee response
 * Note: salary field is filtered by role (see field-level access control)
 */
class EmployeeResponseDto {
    id;
    userId;
    user;
    departmentId;
    department;
    position;
    employeeNumber;
    salary; // Field-level access: HR only
    status;
    rank;
    hireDate;
    terminationDate;
    mcBalance;
    gmcBalance;
    createdAt;
    updatedAt;
}
exports.EmployeeResponseDto = EmployeeResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => auth_dto_1.UserResponseDto),
    __metadata("design:type", auth_dto_1.UserResponseDto)
], EmployeeResponseDto.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => department_dto_1.DepartmentResponseDto),
    __metadata("design:type", department_dto_1.DepartmentResponseDto)
], EmployeeResponseDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EmployeeResponseDto.prototype, "salary", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeStatus),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeRank),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "rank", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "hireDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "terminationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EmployeeResponseDto.prototype, "mcBalance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EmployeeResponseDto.prototype, "gmcBalance", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "updatedAt", void 0);
/**
 * Employee filters for queries
 * Removed: emotional tone filters (DEFERRED)
 */
class EmployeeFiltersDto {
    departmentId;
    status;
    rank;
    search;
}
exports.EmployeeFiltersDto = EmployeeFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EmployeeFiltersDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeStatus),
    __metadata("design:type", String)
], EmployeeFiltersDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeRank),
    __metadata("design:type", String)
], EmployeeFiltersDto.prototype, "rank", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmployeeFiltersDto.prototype, "search", void 0);
