"use strict";
/**
 * Trainer DTOs for Corporate University Module
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
exports.TrainingResultResponseDto = exports.CreateTrainingResultDto = exports.TrainerAssignmentResponseDto = exports.AssignTrainerDto = exports.TrainingPlanDto = exports.AccreditTrainerDto = exports.CreateTrainerDto = exports.TrainerResponseDto = exports.TrainerStatisticsDto = exports.AssignmentStatus = exports.TrainerStatus = exports.TrainerSpecialty = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Trainer Specialty Enum
 */
var TrainerSpecialty;
(function (TrainerSpecialty) {
    TrainerSpecialty["PHOTOGRAPHER"] = "PHOTOGRAPHER";
    TrainerSpecialty["SALES"] = "SALES";
    TrainerSpecialty["DESIGNER"] = "DESIGNER";
})(TrainerSpecialty || (exports.TrainerSpecialty = TrainerSpecialty = {}));
/**
 * Trainer Status Enum
 */
var TrainerStatus;
(function (TrainerStatus) {
    TrainerStatus["CANDIDATE"] = "CANDIDATE";
    TrainerStatus["TRAINER"] = "TRAINER";
    TrainerStatus["ACCREDITED"] = "ACCREDITED";
    TrainerStatus["SENIOR"] = "SENIOR";
    TrainerStatus["METHODOLOGIST"] = "METHODOLOGIST";
})(TrainerStatus || (exports.TrainerStatus = TrainerStatus = {}));
/**
 * Assignment Status Enum
 */
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["ACTIVE"] = "ACTIVE";
    AssignmentStatus["COMPLETED"] = "COMPLETED";
    AssignmentStatus["CANCELLED"] = "CANCELLED";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
/**
 * Trainer Statistics DTO
 */
class TrainerStatisticsDto {
    traineesTotal;
    traineesSuccessful;
    avgNPS;
}
exports.TrainerStatisticsDto = TrainerStatisticsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TrainerStatisticsDto.prototype, "traineesTotal", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TrainerStatisticsDto.prototype, "traineesSuccessful", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TrainerStatisticsDto.prototype, "avgNPS", void 0);
/**
 * Trainer Response DTO
 */
class TrainerResponseDto {
    id;
    userId;
    userName;
    specialty;
    status;
    accreditationDate;
    rating;
    statistics;
}
exports.TrainerResponseDto = TrainerResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrainerResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrainerResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainerResponseDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TrainerSpecialty),
    __metadata("design:type", String)
], TrainerResponseDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TrainerStatus),
    __metadata("design:type", String)
], TrainerResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainerResponseDto.prototype, "accreditationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TrainerResponseDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TrainerStatisticsDto),
    __metadata("design:type", TrainerStatisticsDto)
], TrainerResponseDto.prototype, "statistics", void 0);
/**
 * Create Trainer Request DTO
 */
class CreateTrainerDto {
    specialty;
}
exports.CreateTrainerDto = CreateTrainerDto;
__decorate([
    (0, class_validator_1.IsEnum)(TrainerSpecialty),
    __metadata("design:type", String)
], CreateTrainerDto.prototype, "specialty", void 0);
/**
 * Accredit Trainer Request DTO
 */
class AccreditTrainerDto {
    trainerId;
}
exports.AccreditTrainerDto = AccreditTrainerDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AccreditTrainerDto.prototype, "trainerId", void 0);
/**
 * Training Plan DTO
 */
class TrainingPlanDto {
    shift1;
    shift2;
    shift3;
    shift4;
}
exports.TrainingPlanDto = TrainingPlanDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainingPlanDto.prototype, "shift1", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainingPlanDto.prototype, "shift2", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainingPlanDto.prototype, "shift3", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainingPlanDto.prototype, "shift4", void 0);
/**
 * Assign Trainer Request DTO
 */
class AssignTrainerDto {
    trainerId;
    traineeId;
    startDate; // ISO date format
    plan;
}
exports.AssignTrainerDto = AssignTrainerDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignTrainerDto.prototype, "trainerId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignTrainerDto.prototype, "traineeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignTrainerDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TrainingPlanDto),
    __metadata("design:type", TrainingPlanDto)
], AssignTrainerDto.prototype, "plan", void 0);
/**
 * Trainer Assignment Response DTO
 */
class TrainerAssignmentResponseDto {
    id;
    trainerId;
    trainerName;
    traineeId;
    traineeName;
    startDate;
    endDate;
    status;
    plan;
}
exports.TrainerAssignmentResponseDto = TrainerAssignmentResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "trainerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "trainerName", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "traineeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "traineeName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AssignmentStatus),
    __metadata("design:type", String)
], TrainerAssignmentResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TrainerAssignmentResponseDto.prototype, "plan", void 0);
/**
 * Training Result Request DTO
 */
class CreateTrainingResultDto {
    assignmentId;
    kpiImprovement;
    npsScore;
    retentionDays;
    hotLeadsPercentage;
    qualityScore;
    notes;
}
exports.CreateTrainingResultDto = CreateTrainingResultDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTrainingResultDto.prototype, "assignmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateTrainingResultDto.prototype, "kpiImprovement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateTrainingResultDto.prototype, "npsScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTrainingResultDto.prototype, "retentionDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateTrainingResultDto.prototype, "hotLeadsPercentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateTrainingResultDto.prototype, "qualityScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrainingResultDto.prototype, "notes", void 0);
/**
 * Training Result Response DTO
 */
class TrainingResultResponseDto extends CreateTrainingResultDto {
    id;
    createdAt;
}
exports.TrainingResultResponseDto = TrainingResultResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrainingResultResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrainingResultResponseDto.prototype, "createdAt", void 0);
