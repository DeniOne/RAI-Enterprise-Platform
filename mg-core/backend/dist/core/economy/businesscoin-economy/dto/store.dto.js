"use strict";
/**
 * Store DTOs
 * Module 08 — BusinessCoin-Economy
 *
 * ⚠️ GUARD: Store — немонетарный обмен, не магазин
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
exports.ExchangeRequestDto = exports.StoreItemResponseDto = void 0;
const class_validator_1 = require("class-validator");
const economy_enums_1 = require("../core/economy.enums");
/**
 * Store Item Response DTO
 * ⚠️ GUARD: Нет "цены" — есть "смысловой эквивалент участия"
 */
class StoreItemResponseDto {
    id;
    name;
    description;
    category;
    /**
     * ⚠️ GUARD: Это НЕ цена, а смысловой эквивалент
     */
    mcCost;
    isAvailable;
    stock;
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
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(economy_enums_1.StoreItemCategory),
    __metadata("design:type", String)
], StoreItemResponseDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StoreItemResponseDto.prototype, "mcCost", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StoreItemResponseDto.prototype, "isAvailable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], StoreItemResponseDto.prototype, "stock", void 0);
/**
 * Exchange Request DTO
 * ⚠️ GUARD: Не "покупка", а "обмен"
 */
class ExchangeRequestDto {
    itemId;
    /**
     * ⚠️ GUARD: Должен быть ID человека
     */
    initiatedBy;
}
exports.ExchangeRequestDto = ExchangeRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ExchangeRequestDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ExchangeRequestDto.prototype, "initiatedBy", void 0);
