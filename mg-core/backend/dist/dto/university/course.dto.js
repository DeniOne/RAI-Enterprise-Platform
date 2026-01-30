"use strict";
/**
 * Course DTOs for Corporate University Module
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
exports.AddCourseModuleDto = exports.UpdateCourseDto = exports.CreateCourseDto = exports.CourseResponseDto = exports.CourseModuleResponseDto = exports.MaterialInfoDto = exports.CourseGrade = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Course Grade Enum
 */
var CourseGrade;
(function (CourseGrade) {
    CourseGrade["INTERN"] = "INTERN";
    CourseGrade["SPECIALIST"] = "SPECIALIST";
    CourseGrade["PROFESSIONAL"] = "PROFESSIONAL";
    CourseGrade["EXPERT"] = "EXPERT";
    CourseGrade["MASTER"] = "MASTER";
})(CourseGrade || (exports.CourseGrade = CourseGrade = {}));
/**
 * Material Info DTO
 */
class MaterialInfoDto {
    id;
    type;
    title;
    durationMinutes;
}
exports.MaterialInfoDto = MaterialInfoDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MaterialInfoDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialInfoDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MaterialInfoDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MaterialInfoDto.prototype, "durationMinutes", void 0);
/**
 * Course Module Response DTO
 */
class CourseModuleResponseDto {
    id;
    order;
    material;
    isRequired;
}
exports.CourseModuleResponseDto = CourseModuleResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CourseModuleResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CourseModuleResponseDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MaterialInfoDto),
    __metadata("design:type", MaterialInfoDto)
], CourseModuleResponseDto.prototype, "material", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CourseModuleResponseDto.prototype, "isRequired", void 0);
/**
 * Course Response DTO
 */
class CourseResponseDto {
    id;
    title;
    description;
    academyId;
    academyName;
    requiredGrade;
    rewardMC;
    rewardGMC;
    isMandatory;
    isActive;
    totalDuration;
    modules;
}
exports.CourseResponseDto = CourseResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CourseResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CourseResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CourseResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CourseResponseDto.prototype, "academyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CourseResponseDto.prototype, "academyName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CourseGrade),
    __metadata("design:type", String)
], CourseResponseDto.prototype, "requiredGrade", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CourseResponseDto.prototype, "rewardMC", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CourseResponseDto.prototype, "rewardGMC", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CourseResponseDto.prototype, "isMandatory", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CourseResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CourseResponseDto.prototype, "totalDuration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CourseModuleResponseDto),
    __metadata("design:type", Array)
], CourseResponseDto.prototype, "modules", void 0);
/**
 * Create Course Request DTO
 */
class CreateCourseDto {
    title;
    description;
    academyId;
    requiredGrade;
    rewardMC;
    rewardGMC;
    isMandatory;
}
exports.CreateCourseDto = CreateCourseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "academyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CourseGrade),
    __metadata("design:type", String)
], CreateCourseDto.prototype, "requiredGrade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "rewardMC", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCourseDto.prototype, "rewardGMC", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCourseDto.prototype, "isMandatory", void 0);
/**
 * Update Course Request DTO
 */
class UpdateCourseDto {
    title;
    description;
    requiredGrade;
    rewardMC;
    rewardGMC;
    isMandatory;
    isActive;
}
exports.UpdateCourseDto = UpdateCourseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCourseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCourseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CourseGrade),
    __metadata("design:type", String)
], UpdateCourseDto.prototype, "requiredGrade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateCourseDto.prototype, "rewardMC", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateCourseDto.prototype, "rewardGMC", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCourseDto.prototype, "isMandatory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCourseDto.prototype, "isActive", void 0);
/**
 * Add Module to Course Request DTO
 */
class AddCourseModuleDto {
    materialId;
    order;
    isRequired;
}
exports.AddCourseModuleDto = AddCourseModuleDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddCourseModuleDto.prototype, "materialId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddCourseModuleDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddCourseModuleDto.prototype, "isRequired", void 0);
