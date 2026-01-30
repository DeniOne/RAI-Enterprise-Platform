"use strict";
/**
 * Enrollment DTOs for Corporate University Module
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
exports.CompleteCourseDto = exports.MyCoursesResponseDto = exports.ModuleProgressResponseDto = exports.UpdateModuleProgressDto = exports.EnrollInCourseDto = exports.EnrollmentResponseDto = exports.ModuleStatus = exports.EnrollmentStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Enrollment Status Enum
 */
var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["ACTIVE"] = "ACTIVE";
    EnrollmentStatus["COMPLETED"] = "COMPLETED";
    EnrollmentStatus["ABANDONED"] = "ABANDONED";
})(EnrollmentStatus || (exports.EnrollmentStatus = EnrollmentStatus = {}));
/**
 * Module Status Enum
 */
var ModuleStatus;
(function (ModuleStatus) {
    ModuleStatus["NOT_STARTED"] = "NOT_STARTED";
    ModuleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ModuleStatus["COMPLETED"] = "COMPLETED";
})(ModuleStatus || (exports.ModuleStatus = ModuleStatus = {}));
/**
 * Enrollment Response DTO
 */
class EnrollmentResponseDto {
    id;
    userId;
    courseId;
    courseTitle;
    academyName;
    progress;
    status;
    enrolledAt;
    completedAt;
    assignedBy;
}
exports.EnrollmentResponseDto = EnrollmentResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "courseTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "academyName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], EnrollmentResponseDto.prototype, "progress", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(EnrollmentStatus),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "enrolledAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnrollmentResponseDto.prototype, "assignedBy", void 0);
/**
 * Enroll in Course Request DTO
 */
class EnrollInCourseDto {
    courseId;
    assignedBy;
}
exports.EnrollInCourseDto = EnrollInCourseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EnrollInCourseDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EnrollInCourseDto.prototype, "assignedBy", void 0);
/**
 * Module Progress Update DTO
 */
class UpdateModuleProgressDto {
    moduleId;
    status;
    score;
}
exports.UpdateModuleProgressDto = UpdateModuleProgressDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateModuleProgressDto.prototype, "moduleId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ModuleStatus),
    __metadata("design:type", String)
], UpdateModuleProgressDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateModuleProgressDto.prototype, "score", void 0);
/**
 * Module Progress Response DTO
 */
class ModuleProgressResponseDto {
    id;
    moduleId;
    moduleTitle;
    status;
    score;
    startedAt;
    completedAt;
}
exports.ModuleProgressResponseDto = ModuleProgressResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ModuleProgressResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ModuleProgressResponseDto.prototype, "moduleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModuleProgressResponseDto.prototype, "moduleTitle", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ModuleStatus),
    __metadata("design:type", String)
], ModuleProgressResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ModuleProgressResponseDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModuleProgressResponseDto.prototype, "startedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModuleProgressResponseDto.prototype, "completedAt", void 0);
/**
 * My Courses Response DTO
 */
class MyCoursesResponseDto {
    active;
    completed;
    abandoned;
}
exports.MyCoursesResponseDto = MyCoursesResponseDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EnrollmentResponseDto),
    __metadata("design:type", Array)
], MyCoursesResponseDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EnrollmentResponseDto),
    __metadata("design:type", Array)
], MyCoursesResponseDto.prototype, "completed", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EnrollmentResponseDto),
    __metadata("design:type", Array)
], MyCoursesResponseDto.prototype, "abandoned", void 0);
/**
 * Complete Course Request DTO
 */
class CompleteCourseDto {
    courseId;
}
exports.CompleteCourseDto = CompleteCourseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CompleteCourseDto.prototype, "courseId", void 0);
