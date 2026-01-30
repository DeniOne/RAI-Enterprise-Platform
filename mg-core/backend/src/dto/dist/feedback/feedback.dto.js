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
exports.SMARTReportRequestDto = exports.EveningFeedbackRequestDto = exports.MorningFeedbackRequestDto = exports.DailyPlanResponseDto = void 0;
const class_validator_1 = require("class-validator");
class DailyPlanResponseDto {
}
exports.DailyPlanResponseDto = DailyPlanResponseDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DailyPlanResponseDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DailyPlanResponseDto.prototype, "tasks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DailyPlanResponseDto.prototype, "priorities", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DailyPlanResponseDto.prototype, "aiRecommendation", void 0);
class MorningFeedbackRequestDto {
}
exports.MorningFeedbackRequestDto = MorningFeedbackRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MorningFeedbackRequestDto.prototype, "mood", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MorningFeedbackRequestDto.prototype, "readinessLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MorningFeedbackRequestDto.prototype, "photoUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MorningFeedbackRequestDto.prototype, "plannedTasks", void 0);
class EveningFeedbackRequestDto {
}
exports.EveningFeedbackRequestDto = EveningFeedbackRequestDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EveningFeedbackRequestDto.prototype, "completedTasks", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], EveningFeedbackRequestDto.prototype, "planCompletionPercent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EveningFeedbackRequestDto.prototype, "blockers", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EveningFeedbackRequestDto.prototype, "achievements", void 0);
class SMARTReportRequestDto {
}
exports.SMARTReportRequestDto = SMARTReportRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SMARTReportRequestDto.prototype, "specific", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SMARTReportRequestDto.prototype, "measurable", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SMARTReportRequestDto.prototype, "achievable", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SMARTReportRequestDto.prototype, "relevant", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SMARTReportRequestDto.prototype, "timeBound", void 0);
