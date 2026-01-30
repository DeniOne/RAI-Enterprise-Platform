"use strict";
/**
 * Legal & Compliance DTOs for MatrixGin v2.0 API
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
exports.ConsentRequestDto = exports.RiskDashboardDto = exports.ComplianceChecklistItemDto = exports.GenerateDocumentRequestDto = exports.DocumentTemplateDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Document template response
 */
class DocumentTemplateDto {
    id;
    name;
    description;
    category;
    requiredFields;
}
exports.DocumentTemplateDto = DocumentTemplateDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DocumentTemplateDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocumentTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocumentTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocumentTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DocumentTemplateDto.prototype, "requiredFields", void 0);
/**
 * Generate document request
 */
class GenerateDocumentRequestDto {
    templateId;
    data;
}
exports.GenerateDocumentRequestDto = GenerateDocumentRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateDocumentRequestDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], GenerateDocumentRequestDto.prototype, "data", void 0);
/**
 * Compliance checklist item
 */
class ComplianceChecklistItemDto {
    id;
    category;
    requirement;
    isCompliant;
    notes;
    lastChecked;
}
exports.ComplianceChecklistItemDto = ComplianceChecklistItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceChecklistItemDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceChecklistItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceChecklistItemDto.prototype, "requirement", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ComplianceChecklistItemDto.prototype, "isCompliant", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ComplianceChecklistItemDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ComplianceChecklistItemDto.prototype, "lastChecked", void 0);
/**
 * Risk dashboard response
 */
class RiskDashboardDto {
    overallRiskScore;
    highRisks;
    mediumRisks;
    lastAuditDate;
}
exports.RiskDashboardDto = RiskDashboardDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RiskDashboardDto.prototype, "overallRiskScore", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], RiskDashboardDto.prototype, "highRisks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], RiskDashboardDto.prototype, "mediumRisks", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RiskDashboardDto.prototype, "lastAuditDate", void 0);
/**
 * GDPR/152-FZ Consent Request
 */
class ConsentRequestDto {
    marketing;
    analytics;
    thirdParty;
}
exports.ConsentRequestDto = ConsentRequestDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConsentRequestDto.prototype, "marketing", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConsentRequestDto.prototype, "analytics", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConsentRequestDto.prototype, "thirdParty", void 0);
