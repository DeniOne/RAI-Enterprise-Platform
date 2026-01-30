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
exports.LibraryController = void 0;
const common_1 = require("@nestjs/common");
const document_service_1 = require("../services/document.service");
const version_service_1 = require("../services/version.service");
const create_document_dto_1 = require("../dto/create-document.dto");
const create_version_dto_1 = require("../dto/create-version.dto");
const archive_document_dto_1 = require("../dto/archive-document.dto");
const destroy_document_dto_1 = require("../dto/destroy-document.dto");
const client_1 = require("@prisma/client");
let LibraryController = class LibraryController {
    documentService;
    versionService;
    constructor(documentService, versionService) {
        this.documentService = documentService;
        this.versionService = versionService;
    }
    /**
     * GET /api/library/documents
     * List documents with optional filters
     */
    async listDocuments(status, documentType, businessOwnerRole, req) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.listDocuments({ status, documentType, businessOwnerRole }, actorId);
    }
    /**
     * GET /api/library/documents/:id
     * Get document by ID with versions and links
     */
    async getDocument(id, req) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.getDocument(id, actorId);
    }
    /**
     * GET /api/library/documents/:id/versions
     * List all versions for document
     */
    async listVersions(id) {
        return this.versionService.listVersions(id);
    }
    /**
     * POST /api/library/documents
     * Create new document (draft)
     */
    async createDocument(dto, req) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.createDocument(dto, actorId);
    }
    /**
     * POST /api/library/documents/:id/versions
     * Create new version for document
     * TODO: Add file upload handling (multipart/form-data)
     */
    async createVersion(documentId, dto, req) {
        const actorId = req.user?.id || 'SYSTEM';
        // TODO: Extract file from multipart request
        const file = Buffer.from(''); // Placeholder
        const mimeType = 'application/pdf'; // Placeholder
        return this.versionService.createVersion({ documentId, version: dto.version, file, mimeType }, actorId);
    }
    /**
     * POST /api/library/documents/:id/set-active-version
     * Set active version for document
     */
    async setActiveVersion(documentId, versionId, req) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.versionService.setActiveVersion(documentId, versionId, actorId);
    }
    /**
     * POST /api/library/documents/:id/archive
     * Archive document (ACTIVE → ARCHIVED)
     */
    async archiveDocument(id, dto, req) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.archiveDocument(id, actorId, dto.reason);
    }
    /**
     * POST /api/library/documents/:id/destroy
     * Destroy document (ARCHIVED → DESTROYED)
     * CRITICAL: Legal only
     */
    // @UseGuards(LegalOnlyGuard) // TODO: Uncomment when guard is ready
    async destroyDocument(id, dto) {
        return this.documentService.destroyDocument(id, dto.legalBasis, dto.approvedBy);
    }
};
exports.LibraryController = LibraryController;
__decorate([
    (0, common_1.Get)('documents'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('documentType')),
    __param(2, (0, common_1.Query)('businessOwnerRole')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listDocuments", null);
__decorate([
    (0, common_1.Get)('documents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Get)('documents/:id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listVersions", null);
__decorate([
    (0, common_1.Post)('documents'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_document_dto_1.CreateDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Post)('documents/:id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_version_dto_1.CreateVersionDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createVersion", null);
__decorate([
    (0, common_1.Post)('documents/:id/set-active-version'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('versionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "setActiveVersion", null);
__decorate([
    (0, common_1.Post)('documents/:id/archive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, archive_document_dto_1.ArchiveDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "archiveDocument", null);
__decorate([
    (0, common_1.Post)('documents/:id/destroy')
    // @UseGuards(LegalOnlyGuard) // TODO: Uncomment when guard is ready
    ,
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, destroy_document_dto_1.DestroyDocumentDto]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "destroyDocument", null);
exports.LibraryController = LibraryController = __decorate([
    (0, common_1.Controller)('library'),
    __metadata("design:paramtypes", [document_service_1.DocumentService,
        version_service_1.VersionService])
], LibraryController);
