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
exports.PurchaseItemRequestDto = exports.StoreItemResponseDto = exports.RankDiscountDto = exports.PlaceBidRequestDto = exports.AuctionResponseDto = exports.ActivateSafeRequestDto = exports.TransactionResponseDto = exports.CreateTransactionRequestDto = exports.WalletResponseDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_enums_1 = require("../common/common.enums");
class WalletResponseDto {
}
exports.WalletResponseDto = WalletResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], WalletResponseDto.prototype, "mcBalance", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], WalletResponseDto.prototype, "gmcBalance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], WalletResponseDto.prototype, "mcFrozen", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "safeActivatedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "safeExpiresAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "updatedAt", void 0);
class CreateTransactionRequestDto {
}
exports.CreateTransactionRequestDto = CreateTransactionRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.TransactionType),
    __metadata("design:type", String)
], CreateTransactionRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.Currency),
    __metadata("design:type", String)
], CreateTransactionRequestDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateTransactionRequestDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionRequestDto.prototype, "recipientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateTransactionRequestDto.prototype, "description", void 0);
class TransactionResponseDto {
}
exports.TransactionResponseDto = TransactionResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.TransactionType),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.Currency),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransactionResponseDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "senderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "recipientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TransactionResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "createdAt", void 0);
class ActivateSafeRequestDto {
}
exports.ActivateSafeRequestDto = ActivateSafeRequestDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    __metadata("design:type", Number)
], ActivateSafeRequestDto.prototype, "amount", void 0);
class AuctionResponseDto {
}
exports.AuctionResponseDto = AuctionResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AuctionResponseDto.prototype, "startingBid", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AuctionResponseDto.prototype, "currentBid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "currentBidderId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AuctionResponseDto.prototype, "gmcAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.AuctionStatus),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AuctionResponseDto.prototype, "createdAt", void 0);
class PlaceBidRequestDto {
}
exports.PlaceBidRequestDto = PlaceBidRequestDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], PlaceBidRequestDto.prototype, "amount", void 0);
class RankDiscountDto {
}
exports.RankDiscountDto = RankDiscountDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], RankDiscountDto.prototype, "\u0418\u043D\u0432\u0435\u0441\u0442\u043E\u0440", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], RankDiscountDto.prototype, "\u041C\u0430\u0433\u043D\u0430\u0442", void 0);
class StoreItemResponseDto {
}
exports.StoreItemResponseDto = StoreItemResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StoreItemResponseDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(common_enums_1.Currency),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "image", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StoreItemResponseDto.prototype, "available", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StoreItemResponseDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RankDiscountDto),
    __metadata("design:type", RankDiscountDto)
], StoreItemResponseDto.prototype, "rankDiscount", void 0);
class PurchaseItemRequestDto {
    constructor() {
        this.quantity = 1;
    }
}
exports.PurchaseItemRequestDto = PurchaseItemRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PurchaseItemRequestDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PurchaseItemRequestDto.prototype, "quantity", void 0);
