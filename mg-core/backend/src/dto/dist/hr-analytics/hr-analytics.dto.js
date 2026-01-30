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
exports.MicroSurveyRequestDto = exports.NetworkAnalysisResponseDto = exports.NetworkLinkDto = exports.NetworkNodeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class NetworkNodeDto {
}
exports.NetworkNodeDto = NetworkNodeDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NetworkNodeDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NetworkNodeDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NetworkNodeDto.prototype, "centralityScore", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NetworkNodeDto.prototype, "group", void 0);
class NetworkLinkDto {
}
exports.NetworkLinkDto = NetworkLinkDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NetworkLinkDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NetworkLinkDto.prototype, "target", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NetworkLinkDto.prototype, "weight", void 0);
class NetworkAnalysisResponseDto {
}
exports.NetworkAnalysisResponseDto = NetworkAnalysisResponseDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NetworkNodeDto),
    __metadata("design:type", Array)
], NetworkAnalysisResponseDto.prototype, "nodes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NetworkLinkDto),
    __metadata("design:type", Array)
], NetworkAnalysisResponseDto.prototype, "links", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], NetworkAnalysisResponseDto.prototype, "analyzedAt", void 0);
class MicroSurveyRequestDto {
}
exports.MicroSurveyRequestDto = MicroSurveyRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MicroSurveyRequestDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MicroSurveyRequestDto.prototype, "questions", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MicroSurveyRequestDto.prototype, "targetPercentage", void 0);
