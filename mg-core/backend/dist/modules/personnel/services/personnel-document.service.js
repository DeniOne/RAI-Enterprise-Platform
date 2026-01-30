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
exports.PersonnelDocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const hr_domain_event_service_1 = require("./hr-domain-event.service");
let PersonnelDocumentService = class PersonnelDocumentService {
    prisma;
    hrEventService;
    constructor(prisma, hrEventService) {
        this.prisma = prisma;
        this.hrEventService = hrEventService;
    }
    /**
     * Upload document to personal file
     */
    async upload(personalFileId, data, actorId, actorRole) {
        const document = await this.prisma.personnelDocument.create({
            data: {
                personalFileId,
                documentType: data.documentType,
                title: data.title,
                description: data.description,
                fileId: data.fileId,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                issueDate: data.issueDate,
                expiryDate: data.expiryDate,
                issuer: data.issuer,
                documentNumber: data.documentNumber,
                uploadedById: actorId,
            },
        });
        // Emit DOCUMENT_UPLOADED event
        await this.hrEventService.emit({
            eventType: 'DOCUMENT_UPLOADED',
            aggregateType: 'PERSONNEL_DOCUMENT',
            aggregateId: document.id,
            actorId,
            actorRole,
            payload: {
                documentType: data.documentType,
                fileName: data.fileName,
                personalFileId,
            },
            newState: {
                documentType: data.documentType,
                expiryDate: data.expiryDate,
            },
        });
        return document;
    }
    /**
     * Find documents by personal file
     */
    async findByPersonalFile(personalFileId) {
        return this.prisma.personnelDocument.findMany({
            where: { personalFileId },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Find document by ID
     */
    async findById(id) {
        const document = await this.prisma.personnelDocument.findUnique({
            where: { id },
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException(`PersonnelDocument ${id} not found`);
        }
        return document;
    }
    /**
     * Check for expiring documents (cron job)
     * Returns documents expiring within specified days
     */
    async checkExpiring(days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const expiringDocs = await this.prisma.personnelDocument.findMany({
            where: {
                expiryDate: {
                    lte: futureDate,
                    gte: new Date(),
                },
            },
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        // Emit DOCUMENT_EXPIRED event for already expired documents
        const now = new Date();
        for (const doc of expiringDocs) {
            if (doc.expiryDate && doc.expiryDate < now) {
                await this.hrEventService.emit({
                    eventType: 'DOCUMENT_EXPIRED',
                    aggregateType: 'PERSONNEL_DOCUMENT',
                    aggregateId: doc.id,
                    actorId: 'SYSTEM',
                    actorRole: 'SYSTEM',
                    payload: {
                        documentType: doc.documentType,
                        expiryDate: doc.expiryDate.toISOString(),
                        personalFileId: doc.personalFileId,
                    },
                });
            }
        }
        return expiringDocs;
    }
    /**
     * Delete document (soft delete via audit)
     * IMPORTANT: This doesn't physically delete, just marks for audit
     */
    async delete(id, actorId, actorRole) {
        const document = await this.findById(id);
        // In production, implement soft delete or move to archive
        // For now, we'll just emit an event and keep the record
        await this.hrEventService.emit({
            eventType: 'DOCUMENT_UPLOADED', // Reuse for deletion tracking
            aggregateType: 'PERSONNEL_DOCUMENT',
            aggregateId: id,
            actorId,
            actorRole,
            payload: {
                action: 'DELETE',
                documentType: document.documentType,
                fileName: document.fileName,
            },
            previousState: { deleted: false },
            newState: { deleted: true },
        });
        // TODO: Implement actual soft delete or archive logic
        return { message: 'Document marked for deletion (audit logged)' };
    }
};
exports.PersonnelDocumentService = PersonnelDocumentService;
exports.PersonnelDocumentService = PersonnelDocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, hr_domain_event_service_1.HRDomainEventService])
], PersonnelDocumentService);
