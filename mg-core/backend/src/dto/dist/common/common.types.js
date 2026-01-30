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
exports.PaginatedResponse = exports.PaginationMetaDto = exports.PaginationParamsDto = exports.ApiErrorDto = exports.ErrorObjectDto = exports.ErrorDetailsDto = exports.ApiResponse = exports.MetaInfoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class MetaInfoDto {
}
exports.MetaInfoDto = MetaInfoDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MetaInfoDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MetaInfoDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetaInfoDto.prototype, "version", void 0);
class ApiResponse {
}
exports.ApiResponse = ApiResponse;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApiResponse.prototype, "success", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MetaInfoDto),
    __metadata("design:type", MetaInfoDto)
], ApiResponse.prototype, "meta", void 0);
class ErrorDetailsDto {
}
exports.ErrorDetailsDto = ErrorDetailsDto;
class ErrorObjectDto {
}
exports.ErrorObjectDto = ErrorObjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ErrorObjectDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ErrorObjectDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", ErrorDetailsDto)
], ErrorObjectDto.prototype, "details", void 0);
class ApiErrorDto {
}
exports.ApiErrorDto = ApiErrorDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApiErrorDto.prototype, "success", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ErrorObjectDto),
    __metadata("design:type", ErrorObjectDto)
], ApiErrorDto.prototype, "error", void 0);
class PaginationParamsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortOrder = 'asc';
    }
}
exports.PaginationParamsDto = PaginationParamsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaginationParamsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaginationParamsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationParamsDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)({ asc: 'asc', desc: 'desc' }),
    __metadata("design:type", String)
], PaginationParamsDto.prototype, "sortOrder", void 0);
class PaginationMetaDto {
}
exports.PaginationMetaDto = PaginationMetaDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "total", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PaginationMetaDto.prototype, "totalPages", void 0);
class PaginatedResponse {
}
exports.PaginatedResponse = PaginatedResponse;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PaginationMetaDto),
    __metadata("design:type", PaginationMetaDto)
], PaginatedResponse.prototype, "pagination", void 0);
