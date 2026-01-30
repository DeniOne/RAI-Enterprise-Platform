"use strict";
/**
 * Skill DTOs for Corporate University Module
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
exports.UpgradeGradeDto = exports.UserGradeResponseDto = exports.SkillGapAnalysisDto = exports.MissingSkillDto = exports.UpdateUserSkillDto = exports.CreateSkillDto = exports.UserSkillResponseDto = exports.SkillResponseDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Skill Response DTO
 */
class SkillResponseDto {
    id;
    name;
    category; // hard, soft, technical
    levelRequired; // A0, A1, B1, B2, C1, C2
    kpiImpact;
    description;
    academyId;
    academyName;
}
exports.SkillResponseDto = SkillResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "levelRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "kpiImpact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "academyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillResponseDto.prototype, "academyName", void 0);
/**
 * User Skill Response DTO
 */
class UserSkillResponseDto {
    skill;
    myLevel;
    verifiedAt;
    verifiedBy;
    verifiedByName;
}
exports.UserSkillResponseDto = UserSkillResponseDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SkillResponseDto),
    __metadata("design:type", SkillResponseDto)
], UserSkillResponseDto.prototype, "skill", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UserSkillResponseDto.prototype, "myLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserSkillResponseDto.prototype, "verifiedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserSkillResponseDto.prototype, "verifiedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserSkillResponseDto.prototype, "verifiedByName", void 0);
/**
 * Create Skill Request DTO
 */
class CreateSkillDto {
    name;
    academyId;
    category;
    levelRequired;
    kpiImpact;
    description;
}
exports.CreateSkillDto = CreateSkillDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "academyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "levelRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "kpiImpact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "description", void 0);
/**
 * Update User Skill Request DTO
 */
class UpdateUserSkillDto {
    skillId;
    level;
    verifiedBy;
}
exports.UpdateUserSkillDto = UpdateUserSkillDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateUserSkillDto.prototype, "skillId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateUserSkillDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateUserSkillDto.prototype, "verifiedBy", void 0);
/**
 * Missing Skill DTO
 */
class MissingSkillDto {
    skillId;
    name;
    currentLevel;
    requiredLevel;
    recommendedCourses;
}
exports.MissingSkillDto = MissingSkillDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MissingSkillDto.prototype, "skillId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MissingSkillDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MissingSkillDto.prototype, "currentLevel", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MissingSkillDto.prototype, "requiredLevel", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MissingSkillDto.prototype, "recommendedCourses", void 0);
/**
 * Skill Gap Analysis Response DTO
 */
class SkillGapAnalysisDto {
    targetRole;
    currentLevel;
    missingSkills;
}
exports.SkillGapAnalysisDto = SkillGapAnalysisDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkillGapAnalysisDto.prototype, "targetRole", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SkillGapAnalysisDto.prototype, "currentLevel", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MissingSkillDto),
    __metadata("design:type", Array)
], SkillGapAnalysisDto.prototype, "missingSkills", void 0);
/**
 * User Grade Response DTO
 */
class UserGradeResponseDto {
    userId;
    currentGrade;
    motivationCoefficient;
    gradeHistory;
    nextGrade;
}
exports.UserGradeResponseDto = UserGradeResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserGradeResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserGradeResponseDto.prototype, "currentGrade", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UserGradeResponseDto.prototype, "motivationCoefficient", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UserGradeResponseDto.prototype, "gradeHistory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UserGradeResponseDto.prototype, "nextGrade", void 0);
/**
 * Upgrade Grade Request DTO
 */
class UpgradeGradeDto {
    userId;
    newGrade;
    reason;
}
exports.UpgradeGradeDto = UpgradeGradeDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpgradeGradeDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpgradeGradeDto.prototype, "newGrade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpgradeGradeDto.prototype, "reason", void 0);
