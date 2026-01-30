"use strict";
/**
 * Auction DTOs
 * Module 08 — MatrixCoin-Economy
 *
 * ⚠️ GUARD: Auction — событие, не сервис
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
exports.PlaceBidRequestDto = exports.AuctionEventResponseDto = void 0;
const class_validator_1 = require("class-validator");
const economy_enums_1 = require("../core/economy.enums");
/**
 * Auction Event Response DTO
 */
class AuctionEventResponseDto {
    id;
    title;
    description;
    status;
    gmcPool;
    minimumBid;
    startsAt;
    endsAt;
    winnerId;
}
exports.AuctionEventResponseDto = AuctionEventResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AuctionEventResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuctionEventResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuctionEventResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(economy_enums_1.AuctionEventStatus),
    __metadata("design:type", String)
], AuctionEventResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AuctionEventResponseDto.prototype, "gmcPool", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AuctionEventResponseDto.prototype, "minimumBid", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuctionEventResponseDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuctionEventResponseDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], AuctionEventResponseDto.prototype, "winnerId", void 0);
/**
 * Place Bid Request DTO
 * ⚠️ GUARD: Только человек может делать ставки
 */
class PlaceBidRequestDto {
    eventId;
    mcAmount;
    /**
     * ⚠️ GUARD: Должен быть ID человека
     */
    initiatedBy;
}
exports.PlaceBidRequestDto = PlaceBidRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PlaceBidRequestDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PlaceBidRequestDto.prototype, "mcAmount", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PlaceBidRequestDto.prototype, "initiatedBy", void 0);
