"use strict";
/**
 * Academy DTOs for Corporate University Module
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
exports.AcademyWithCoursesDto = exports.UpdateAcademyDto = exports.CreateAcademyDto = exports.AcademyResponseDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Academy Response DTO
 */
class AcademyResponseDto {
    id;
    name;
    description;
    icon_url;
    is_active;
    coursesCount;
    skillsCount;
}
exports.AcademyResponseDto = AcademyResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AcademyResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcademyResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcademyResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcademyResponseDto.prototype, "icon_url", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AcademyResponseDto.prototype, "is_active", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AcademyResponseDto.prototype, "coursesCount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AcademyResponseDto.prototype, "skillsCount", void 0);
/**
 * Create Academy Request DTO
 */
class CreateAcademyDto {
    name;
    description;
    icon_url;
}
exports.CreateAcademyDto = CreateAcademyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAcademyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAcademyDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAcademyDto.prototype, "icon_url", void 0);
/**
 * Update Academy Request DTO
 */
class UpdateAcademyDto {
    name;
    description;
    icon_url;
    is_active;
}
exports.UpdateAcademyDto = UpdateAcademyDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAcademyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAcademyDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAcademyDto.prototype, "icon_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAcademyDto.prototype, "is_active", void 0);
/**
 * Academy with Courses Response DTO
 */
class AcademyWithCoursesDto extends AcademyResponseDto {
    courses; // Will be CourseResponseDto[]
}
exports.AcademyWithCoursesDto = AcademyWithCoursesDto;
