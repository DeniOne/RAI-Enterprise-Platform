"use strict";
/**
 * Economy API DTOs
 * Module 08 — BusinessCoin-Economy
 * STEP 5 — PERSISTENCE & API
 *
 * ⚠️ STRICT MAPPING: JSON -> Domain Types.
 * No logic, no validation beyond shape.
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
exports.EvaluateAccessDto = exports.ParticipateAuctionDto = exports.EconomyUsageContextDto = exports.MCStateDto = void 0;
const class_validator_1 = require("class-validator");
class MCStateDto {
    id;
    amount; // Decimal string or number handling
    state; // Enum Check?
    sourceType;
    history;
}
exports.MCStateDto = MCStateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MCStateDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], MCStateDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MCStateDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MCStateDto.prototype, "sourceType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], MCStateDto.prototype, "history", void 0);
class EconomyUsageContextDto {
    usageContextId;
    userId;
    domain;
    operation;
    // @Type(() => MCStateDto) // Simplified for adapter view, strict typing in Service
    mcSnapshot; // Expecting raw JSON array that matches interface
    timestamp;
    metadata;
}
exports.EconomyUsageContextDto = EconomyUsageContextDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EconomyUsageContextDto.prototype, "usageContextId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EconomyUsageContextDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EconomyUsageContextDto.prototype, "domain", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EconomyUsageContextDto.prototype, "operation", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true })
    // @Type(() => MCStateDto) // Simplified for adapter view, strict typing in Service
    ,
    __metadata("design:type", Array)
], EconomyUsageContextDto.prototype, "mcSnapshot", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EconomyUsageContextDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], EconomyUsageContextDto.prototype, "metadata", void 0);
class ParticipateAuctionDto {
    eventId;
    context;
}
exports.ParticipateAuctionDto = ParticipateAuctionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParticipateAuctionDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", EconomyUsageContextDto)
], ParticipateAuctionDto.prototype, "context", void 0);
class EvaluateAccessDto {
    storeId; // or generic resource ID
    context;
}
exports.EvaluateAccessDto = EvaluateAccessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EvaluateAccessDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", EconomyUsageContextDto)
], EvaluateAccessDto.prototype, "context", void 0);
