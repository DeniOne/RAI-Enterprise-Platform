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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const client_1 = require("@prisma/client");
let DocumentService = class DocumentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create document (draft by default)
     * CANON: Document starts as DRAFT, not source of truth
     */
    async createDocument(dto, actorId) {
        // TODO: Validate documentType from Registry
        // TODO: Check RBAC permissions
        const document = await this.prisma.libraryDocument.create({
            data: {
                title: dto.title,
                documentType: dto.documentType,
                businessOwnerRole: dto.businessOwnerRole,
                status: client_1.DocumentStatus.DRAFT,
            },
        });
        // Emit audit event
        // TODO: Emit 'library.document_created' event
        return document;
    }
    /**
     * Get document by ID
     * CANON: Check confidentiality and RBAC
     */
    async getDocument(id, actorId) {
        const document = await this.prisma.libraryDocument.findUnique({
            where: { id },
            include: {
                currentVersion: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                },
                links: true,
            },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document ${id} not found`);
        }
        // TODO: Check RBAC permissions
        // TODO: Check confidentiality level
        return document;
    }
    /**
     * List documents (with RBAC filtering)
     * CANON: Only show documents user has access to
     */
    async listDocuments(filters, actorId) {
        // TODO: Apply RBAC filtering based on actorId role
        const documents = await this.prisma.libraryDocument.findMany({
            where: {
                ...(filters.status && { status: filters.status }),
                ...(filters.documentType && { documentType: filters.documentType }),
                ...(filters.businessOwnerRole && { businessOwnerRole: filters.businessOwnerRole }),
            },
            include: {
                currentVersion: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return documents;
    }
    /**
     * Archive document (ACTIVE → ARCHIVED)
     * CANON: Archived documents are read-only, preserved forever
     */
    async archiveDocument(id, actorId, reason) {
        const document = await this.getDocument(id, actorId);
        if (document.status !== client_1.DocumentStatus.ACTIVE) {
            throw new common_1.ForbiddenException(`Only ACTIVE documents can be archived. Current status: ${document.status}`);
        }
        // TODO: Check RBAC permissions (HR_MANAGER, LEGAL_COUNSEL)
        const updated = await this.prisma.libraryDocument.update({
            where: { id },
            data: { status: client_1.DocumentStatus.ARCHIVED },
        });
        // Emit audit event
        // TODO: Emit 'library.document_archived' event with reason
        return updated;
    }
    /**
     * Destroy document (ARCHIVED → DESTROYED)
     * CANON: CRITICAL - Legal only, immutable forever after destruction
     */
    async destroyDocument(id, legalBasis, approvedBy) {
        const document = await this.prisma.libraryDocument.findUnique({
            where: { id },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document ${id} not found`);
        }
        if (document.status !== client_1.DocumentStatus.ARCHIVED) {
            throw new common_1.ForbiddenException(`Only ARCHIVED documents can be destroyed. Current status: ${document.status}`);
        }
        // CRITICAL: This action is LEGAL-ONLY
        // TODO: Verify caller has LEGAL role
        const updated = await this.prisma.libraryDocument.update({
            where: { id },
            data: { status: client_1.DocumentStatus.DESTROYED },
        });
        // Emit audit event
        // TODO: Emit 'library.document_destroyed' event with legalBasis, approvedBy
        // TODO: Schedule async physical file deletion with audit log
        return updated;
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], DocumentService);
