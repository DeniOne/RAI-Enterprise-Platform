"use strict";
/**
 * Ethics Manager DTOs for MatrixGin v2.0 API
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
exports.MediationRequestDto = exports.EthicsViolationResponseDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Ethics Violation Response
 */
class EthicsViolationResponseDto {
    id;
    employeeId;
    type;
    description;
    severity;
    status;
    detectedAt;
}
exports.EthicsViolationResponseDto = EthicsViolationResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EthicsViolationResponseDto.prototype, "detectedAt", void 0);
/**
 * Mediation Request
 */
class MediationRequestDto {
    partyA;
    partyB;
    conflictDescription;
}
exports.MediationRequestDto = MediationRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MediationRequestDto.prototype, "partyA", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MediationRequestDto.prototype, "partyB", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediationRequestDto.prototype, "conflictDescription", void 0);
