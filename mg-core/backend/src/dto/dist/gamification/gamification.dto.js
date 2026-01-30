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
exports.ClaimRewardRequestDto = exports.AchievementResponseDto = exports.LeaderboardEntryDto = exports.StatusResponseDto = void 0;
const class_validator_1 = require("class-validator");
const common_enums_1 = require("../common/common.enums");
class StatusResponseDto {
}
exports.StatusResponseDto = StatusResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StatusResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeStatus),
    __metadata("design:type", String)
], StatusResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeRank),
    __metadata("design:type", String)
], StatusResponseDto.prototype, "rank", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StatusResponseDto.prototype, "currentGMC", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StatusResponseDto.prototype, "nextStatusThreshold", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StatusResponseDto.prototype, "progressPercent", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], StatusResponseDto.prototype, "privileges", void 0);
class LeaderboardEntryDto {
}
exports.LeaderboardEntryDto = LeaderboardEntryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LeaderboardEntryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LeaderboardEntryDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LeaderboardEntryDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LeaderboardEntryDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LeaderboardEntryDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LeaderboardEntryDto.prototype, "rankChange", void 0);
class AchievementResponseDto {
}
exports.AchievementResponseDto = AchievementResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AchievementResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AchievementResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AchievementResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AchievementResponseDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.EmployeeRank),
    __metadata("design:type", String)
], AchievementResponseDto.prototype, "requiredRank", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AchievementResponseDto.prototype, "mcReward", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AchievementResponseDto.prototype, "unlockedAt", void 0);
class ClaimRewardRequestDto {
}
exports.ClaimRewardRequestDto = ClaimRewardRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ClaimRewardRequestDto.prototype, "achievementId", void 0);
