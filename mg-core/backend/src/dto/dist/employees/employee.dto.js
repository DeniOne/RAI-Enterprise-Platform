"use strict";
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
exports.EmployeeFiltersDto = exports.EmployeeAnalyticsResponseDto = exports.EmployeeResponseDto = exports.UpdateEmployeeRequestDto = exports.CreateEmployeeRequestDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_enums_1 = require("../common/common.enums");
const auth_dto_1 = require("../auth/auth.dto");
const department_dto_1 = require("../departments/department.dto");
class CreateEmployeeRequestDto {
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
class UpdateEmployeeRequestDto {
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
class EmployeeResponseDto {
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
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], EmployeeResponseDto.prototype, "emotionalTone", void 0);
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
class EmployeeAnalyticsResponseDto {
}
exports.EmployeeAnalyticsResponseDto = EmployeeAnalyticsResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EmployeeAnalyticsResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], EmployeeAnalyticsResponseDto.prototype, "kpiScore", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EmployeeAnalyticsResponseDto.prototype, "tasksCompleted", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EmployeeAnalyticsResponseDto.prototype, "averageTaskCompletionTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], EmployeeAnalyticsResponseDto.prototype, "emotionalToneAverage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], EmployeeAnalyticsResponseDto.prototype, "burnoutRisk", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], EmployeeAnalyticsResponseDto.prototype, "engagementIndex", void 0);
class EmployeeFiltersDto {
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
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], EmployeeFiltersDto.prototype, "minEmotionalTone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], EmployeeFiltersDto.prototype, "maxEmotionalTone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmployeeFiltersDto.prototype, "search", void 0);
