"use strict";
/**
 * GMC DTOs
 * Module 08 — BusinessCoin-Economy
 *
 * Data Transfer Objects для GMC операций.
 * ⛔ ABSOLUTE GUARD: GMC признаётся только человеком
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
exports.RecognizeGMCRequestDto = exports.GMCSummaryResponseDto = exports.GMCStateResponseDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * GMC State Response DTO
 */
class GMCStateResponseDto {
    id;
    userId;
    amount;
    recognizedAt;
    recognizedBy;
    category;
    justification;
}
exports.GMCStateResponseDto = GMCStateResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GMCStateResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GMCStateResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GMCStateResponseDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GMCStateResponseDto.prototype, "recognizedAt", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GMCStateResponseDto.prototype, "recognizedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GMCStateResponseDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GMCStateResponseDto.prototype, "justification", void 0);
/**
 * GMC Summary Response DTO
 */
class GMCSummaryResponseDto {
    totalBalance;
    byCategory;
    lastRecognizedAt;
}
exports.GMCSummaryResponseDto = GMCSummaryResponseDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GMCSummaryResponseDto.prototype, "totalBalance", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], GMCSummaryResponseDto.prototype, "lastRecognizedAt", void 0);
/**
 * Recognize GMC Request DTO
 * ⛔ ABSOLUTE GUARD: Только человек может признать GMC
 */
class RecognizeGMCRequestDto {
    userId;
    amount;
    category;
    /**
     * ⚠️ GUARD: Минимум 50 символов
     */
    justification;
    /**
     * ⛔ ABSOLUTE GUARD: Должен быть ID человека с полномочиями
     * AI/SYSTEM/AUTO запрещены на уровне guard
     */
    recognizedBy;
}
exports.RecognizeGMCRequestDto = RecognizeGMCRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecognizeGMCRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecognizeGMCRequestDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecognizeGMCRequestDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(50),
    __metadata("design:type", String)
], RecognizeGMCRequestDto.prototype, "justification", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecognizeGMCRequestDto.prototype, "recognizedBy", void 0);
