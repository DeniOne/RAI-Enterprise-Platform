"use strict";
/**
 * Social Monitoring DTOs for MatrixGin v2.0 API
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
exports.SocialMoodResponseDto = exports.SocialScreeningRequestDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Social Screening Request
 */
class SocialScreeningRequestDto {
    candidateName;
    socialLinks;
}
exports.SocialScreeningRequestDto = SocialScreeningRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialScreeningRequestDto.prototype, "candidateName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], SocialScreeningRequestDto.prototype, "socialLinks", void 0);
/**
 * Social Mood Response
 */
class SocialMoodResponseDto {
    userId;
    platform;
    mood; // e.g., 'positive', 'negative', 'neutral'
    confidenceScore;
    analyzedAt;
}
exports.SocialMoodResponseDto = SocialMoodResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SocialMoodResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialMoodResponseDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SocialMoodResponseDto.prototype, "mood", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SocialMoodResponseDto.prototype, "confidenceScore", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SocialMoodResponseDto.prototype, "analyzedAt", void 0);
