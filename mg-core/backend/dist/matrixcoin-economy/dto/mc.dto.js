"use strict";
/**
 * MC DTOs
 * Module 08 — MatrixCoin-Economy
 *
 * Data Transfer Objects для MC операций.
 * ⚠️ GUARD: Все DTO следуют смысловым ограничениям, не финансовым
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
exports.TransferMCRequestDto = exports.FreezeMCRequestDto = exports.GrantMCRequestDto = exports.MCSummaryResponseDto = exports.MCStateResponseDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * MC State Response DTO
 */
class MCStateResponseDto {
    id;
    userId;
    amount;
    issuedAt;
    expiresAt;
    isFrozen;
    sourceType;
    sourceId;
    lifecycleState;
}
exports.MCStateResponseDto = MCStateResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MCStateResponseDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "issuedAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MCStateResponseDto.prototype, "isFrozen", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "sourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "sourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MCStateResponseDto.prototype, "lifecycleState", void 0);
/**
 * MC Summary Response DTO
 * ⚠️ GUARD: Для отображения, не для расчётов
 */
class MCSummaryResponseDto {
    activeBalance;
    frozenBalance;
    expiringWithin30Days;
    updatedAt;
}
exports.MCSummaryResponseDto = MCSummaryResponseDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MCSummaryResponseDto.prototype, "activeBalance", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MCSummaryResponseDto.prototype, "frozenBalance", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MCSummaryResponseDto.prototype, "expiringWithin30Days", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MCSummaryResponseDto.prototype, "updatedAt", void 0);
/**
 * Grant MC Request DTO
 * ⚠️ GUARD: Требует человеческого действия
 */
class GrantMCRequestDto {
    userId;
    amount;
    /**
     * ⚠️ GUARD: Должен быть ID человека, не AI/SYSTEM
     */
    grantedBy;
    /**
     * ⚠️ GUARD: MANUAL_GRANT | EVENT_PARTICIPATION | PEER_TRANSFER
     */
    sourceType;
    sourceId;
    /**
     * ⚠️ GUARD: Обязательно, MC без срока истечения запрещён
     */
    expiresAt;
    reason;
}
exports.GrantMCRequestDto = GrantMCRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GrantMCRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GrantMCRequestDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GrantMCRequestDto.prototype, "grantedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GrantMCRequestDto.prototype, "sourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GrantMCRequestDto.prototype, "sourceId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GrantMCRequestDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], GrantMCRequestDto.prototype, "reason", void 0);
/**
 * Freeze MC Request DTO
 */
class FreezeMCRequestDto {
    mcIds;
}
exports.FreezeMCRequestDto = FreezeMCRequestDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FreezeMCRequestDto.prototype, "mcIds", void 0);
/**
 * Transfer MC Request DTO
 */
class TransferMCRequestDto {
    toUserId;
    mcIds;
    reason;
}
exports.TransferMCRequestDto = TransferMCRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransferMCRequestDto.prototype, "toUserId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TransferMCRequestDto.prototype, "mcIds", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], TransferMCRequestDto.prototype, "reason", void 0);
