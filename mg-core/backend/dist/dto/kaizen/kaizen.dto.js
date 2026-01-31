"use strict";
/**
 * Kaizen DTOs for BusinessCore v2.0 API
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
exports.ImprovementResponseDto = exports.ImprovementProposalRequestDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Improvement Proposal Request
 */
class ImprovementProposalRequestDto {
    title;
    description;
    expectedImpact;
    category;
}
exports.ImprovementProposalRequestDto = ImprovementProposalRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImprovementProposalRequestDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImprovementProposalRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImprovementProposalRequestDto.prototype, "expectedImpact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImprovementProposalRequestDto.prototype, "category", void 0);
/**
 * Improvement Response
 */
class ImprovementResponseDto {
    id;
    authorId;
    title;
    description;
    status;
    votes;
    mcReward;
    createdAt;
}
exports.ImprovementResponseDto = ImprovementResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ImprovementResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ImprovementResponseDto.prototype, "authorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImprovementResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImprovementResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['proposed', 'under_review', 'approved', 'implemented', 'rejected']),
    __metadata("design:type", String)
], ImprovementResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ImprovementResponseDto.prototype, "votes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ImprovementResponseDto.prototype, "mcReward", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ImprovementResponseDto.prototype, "createdAt", void 0);
