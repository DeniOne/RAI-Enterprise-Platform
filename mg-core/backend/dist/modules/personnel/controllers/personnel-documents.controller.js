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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const personnel_document_service_1 = require("../services/personnel-document.service");
const request_1 = require("../dto/request");
const guards_1 = require("../guards");
let PersonnelDocumentsController = class PersonnelDocumentsController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    /**
     * GET /api/personnel/files/:fileId/documents
     * Список документов в личном деле
     * RBAC: HR_SPECIALIST+
     */
    async findByFile(fileId) {
        const documents = await this.documentService.findByPersonalFile(fileId);
        return documents;
    }
    /**
     * GET /api/personnel/documents/:id
     * Детали документа
     * RBAC: HR_SPECIALIST+
     */
    async findById(id) {
        const document = await this.documentService.findById(id);
        return document;
    }
    /**
     * GET /api/personnel/documents/expiring
     * Истекающие документы
     * RBAC: HR_MANAGER+
     */
    async findExpiring(days) {
        const documents = await this.documentService.checkExpiring(days || 30);
        return documents;
    }
    /**
     * POST /api/personnel/files/:fileId/documents
     * Загрузка документа в личное дело
     * RBAC: HR_SPECIALIST+
     */
    async upload(fileId, dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_SPECIALIST';
        const document = await this.documentService.upload(fileId, {
            documentType: dto.documentType,
            title: dto.title,
            description: dto.description,
            fileId: dto.fileId,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
            mimeType: dto.mimeType,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
            issuer: dto.issuer,
            documentNumber: dto.documentNumber,
        }, actorId, actorRole);
        return document;
    }
    /**
     * DELETE /api/personnel/documents/:id
     * Удаление документа (soft delete с аудитом)
     * RBAC: HR_MANAGER+
     */
    async delete(id, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';
        const result = await this.documentService.delete(id, actorId, actorRole);
        return result;
    }
};
exports.PersonnelDocumentsController = PersonnelDocumentsController;
__decorate([
    (0, common_1.Get)('files/:fileId/documents'),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonnelDocumentsController.prototype, "findByFile", null);
__decorate([
    (0, common_1.Get)('documents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonnelDocumentsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('documents/expiring'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PersonnelDocumentsController.prototype, "findExpiring", null);
__decorate([
    (0, common_1.Post)('files/:fileId/documents'),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_1.UploadDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], PersonnelDocumentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Delete)('documents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PersonnelDocumentsController.prototype, "delete", null);
exports.PersonnelDocumentsController = PersonnelDocumentsController = __decorate([
    (0, common_1.Controller)('api/personnel'),
    (0, common_1.UseGuards)(guards_1.PersonnelAccessGuard),
    __metadata("design:paramtypes", [personnel_document_service_1.PersonnelDocumentService])
], PersonnelDocumentsController);
