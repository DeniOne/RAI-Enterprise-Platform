"use strict";
/**
 * Material DTOs for Corporate University Module
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
exports.MaterialQueryDto = exports.UpdateMaterialStatusDto = exports.UpdateMaterialDto = exports.CreateMaterialDto = exports.MaterialResponseDto = exports.MaterialStatus = exports.MaterialType = void 0;
const class_validator_1 = require("class-validator");
/**
 * Material Type Enum
 */
var MaterialType;
(function (MaterialType) {
    MaterialType["VIDEO"] = "VIDEO";
    MaterialType["TEXT"] = "TEXT";
    MaterialType["PDF"] = "PDF";
    MaterialType["QUIZ"] = "QUIZ";
    MaterialType["SIMULATION"] = "SIMULATION";
})(MaterialType || (exports.MaterialType = MaterialType = {}));
/**
 * Material Status Enum
 */
var MaterialStatus;
(function (MaterialStatus) {
    MaterialStatus["DRAFT"] = "DRAFT";
    MaterialStatus["REVIEW"] = "REVIEW";
    MaterialStatus["PUBLISHED"] = "PUBLISHED";
})(MaterialStatus || (exports.MaterialStatus = MaterialStatus = {}));
/**
 * Material Response DTO
 */
class MaterialResponseDto {
    id;
    type;
    title;
    contentUrl;
    contentText;
    durationMinutes;
    tags;
    level;
    academyId;
    academyName;
    version;
    status;
    createdBy;
    reviewedBy;
}
exports.MaterialResponseDto = MaterialResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MaterialType),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "contentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "contentText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MaterialResponseDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], MaterialResponseDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "academyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "academyName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MaterialResponseDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MaterialStatus),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialResponseDto.prototype, "reviewedBy", void 0);
/**
 * Create Material Request DTO
 */
class CreateMaterialDto {
    type;
    title;
    contentUrl;
    contentText;
    durationMinutes;
    tags;
    level; // A0, A1, B1, B2, C1, C2
    academyId;
}
exports.CreateMaterialDto = CreateMaterialDto;
__decorate([
    (0, class_validator_1.IsEnum)(MaterialType),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "contentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "contentText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMaterialDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMaterialDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "academyId", void 0);
/**
 * Update Material Request DTO
 */
class UpdateMaterialDto {
    title;
    contentUrl;
    contentText;
    durationMinutes;
    tags;
    level;
}
exports.UpdateMaterialDto = UpdateMaterialDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "contentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "contentText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateMaterialDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateMaterialDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "level", void 0);
/**
 * Update Material Status Request DTO
 */
class UpdateMaterialStatusDto {
    status;
}
exports.UpdateMaterialStatusDto = UpdateMaterialStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(MaterialStatus),
    __metadata("design:type", String)
], UpdateMaterialStatusDto.prototype, "status", void 0);
/**
 * Material Query Filters DTO
 */
class MaterialQueryDto {
    academyId;
    type;
    level;
    tags;
    status;
    page;
    limit;
}
exports.MaterialQueryDto = MaterialQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MaterialQueryDto.prototype, "academyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(MaterialType, { each: true }),
    __metadata("design:type", Array)
], MaterialQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialQueryDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MaterialQueryDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(MaterialStatus),
    __metadata("design:type", String)
], MaterialQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MaterialQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MaterialQueryDto.prototype, "limit", void 0);
