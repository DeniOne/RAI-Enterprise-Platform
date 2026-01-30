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
exports.MudaAnalysisResponseDto = exports.MudaTypesDto = exports.DepartmentKPIResponseDto = exports.DepartmentKPIMetricsDto = exports.DepartmentResponseDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_enums_1 = require("../common/common.enums");
class DepartmentResponseDto {
}
exports.DepartmentResponseDto = DepartmentResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{2,5}$/, {
        message: 'Код департамента должен содержать 2-5 заглавных букв',
    }),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "headId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DepartmentResponseDto.prototype, "employeeCount", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DepartmentResponseDto.prototype, "updatedAt", void 0);
class DepartmentKPIMetricsDto {
}
exports.DepartmentKPIMetricsDto = DepartmentKPIMetricsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DepartmentKPIMetricsDto.prototype, "revenue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], DepartmentKPIMetricsDto.prototype, "tasksCompleted", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], DepartmentKPIMetricsDto.prototype, "averageEmotionalTone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DepartmentKPIMetricsDto.prototype, "employeeEngagement", void 0);
class DepartmentKPIResponseDto {
}
exports.DepartmentKPIResponseDto = DepartmentKPIResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DepartmentKPIResponseDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.KPIPeriod),
    __metadata("design:type", String)
], DepartmentKPIResponseDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DepartmentKPIMetricsDto),
    __metadata("design:type", DepartmentKPIMetricsDto)
], DepartmentKPIResponseDto.prototype, "metrics", void 0);
class MudaTypesDto {
}
exports.MudaTypesDto = MudaTypesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "overproduction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "waiting", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "transportation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "overprocessing", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "inventory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "motion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "defects", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MudaTypesDto.prototype, "unutilizedTalent", void 0);
class MudaAnalysisResponseDto {
}
exports.MudaAnalysisResponseDto = MudaAnalysisResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MudaAnalysisResponseDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MudaAnalysisResponseDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MudaTypesDto),
    __metadata("design:type", MudaTypesDto)
], MudaAnalysisResponseDto.prototype, "mudaTypes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MudaAnalysisResponseDto.prototype, "totalLoss", void 0);
