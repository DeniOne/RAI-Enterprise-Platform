"use strict";
/**
 * Knowledge Base DTOs for MatrixGin v2.0 API
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
exports.KnowledgeItemResponseDto = exports.KnowledgeSearchRequestDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Knowledge Search Request
 */
class KnowledgeSearchRequestDto {
    query;
    tags;
    limit;
}
exports.KnowledgeSearchRequestDto = KnowledgeSearchRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KnowledgeSearchRequestDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], KnowledgeSearchRequestDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], KnowledgeSearchRequestDto.prototype, "limit", void 0);
/**
 * Knowledge Item Response
 */
class KnowledgeItemResponseDto {
    id;
    title;
    content;
    category;
    tags;
    relevanceScore;
    updatedAt;
}
exports.KnowledgeItemResponseDto = KnowledgeItemResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], KnowledgeItemResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KnowledgeItemResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KnowledgeItemResponseDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KnowledgeItemResponseDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], KnowledgeItemResponseDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], KnowledgeItemResponseDto.prototype, "relevanceScore", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], KnowledgeItemResponseDto.prototype, "updatedAt", void 0);
