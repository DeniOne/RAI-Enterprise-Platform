"use strict";
/**
 * Strategy & Management DTOs for MatrixGin v2.0 API
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
exports.CTMDashboardDto = exports.UpdateOKRRequestDto = exports.CreateOKRRequestDto = exports.OKRResponseDto = exports.KeyResultDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Key Result DTO
 */
class KeyResultDto {
    id;
    title;
    targetValue;
    currentValue;
    unit;
}
exports.KeyResultDto = KeyResultDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KeyResultDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KeyResultDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], KeyResultDto.prototype, "targetValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], KeyResultDto.prototype, "currentValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KeyResultDto.prototype, "unit", void 0);
/**
 * OKR Response
 */
class OKRResponseDto {
    id;
    objective;
    period;
    progress;
    departmentId;
    ownerId;
    keyResults;
    createdAt;
}
exports.OKRResponseDto = OKRResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OKRResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OKRResponseDto.prototype, "objective", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OKRResponseDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], OKRResponseDto.prototype, "progress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OKRResponseDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OKRResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => KeyResultDto),
    __metadata("design:type", Array)
], OKRResponseDto.prototype, "keyResults", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], OKRResponseDto.prototype, "createdAt", void 0);
/**
 * Create OKR Request
 */
class CreateOKRRequestDto {
    objective;
    period;
    departmentId;
    keyResults;
}
exports.CreateOKRRequestDto = CreateOKRRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOKRRequestDto.prototype, "objective", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOKRRequestDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateOKRRequestDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => KeyResultDto),
    __metadata("design:type", Array)
], CreateOKRRequestDto.prototype, "keyResults", void 0);
/**
 * Update OKR Request
 */
class UpdateOKRRequestDto {
    objective;
    progress;
    keyResults;
}
exports.UpdateOKRRequestDto = UpdateOKRRequestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOKRRequestDto.prototype, "objective", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateOKRRequestDto.prototype, "progress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => KeyResultDto),
    __metadata("design:type", Array)
], UpdateOKRRequestDto.prototype, "keyResults", void 0);
/**
 * CTM (Transformation) Dashboard
 */
class CTMDashboardDto {
    transformationIndex;
    digitalAdoptionRate;
    processAutomationLevel;
    activeInitiatives;
}
exports.CTMDashboardDto = CTMDashboardDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CTMDashboardDto.prototype, "transformationIndex", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CTMDashboardDto.prototype, "digitalAdoptionRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CTMDashboardDto.prototype, "processAutomationLevel", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CTMDashboardDto.prototype, "activeInitiatives", void 0);
