import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PersonnelDocumentType } from '@prisma/client';
import { HRDomainEventService } from './hr-domain-event.service';

@Injectable()
export class PersonnelDocumentService {
    constructor(
        private prisma: PrismaService,
        private hrEventService: HRDomainEventService
    ) { }

    /**
     * Upload document to personal file
     */
    async upload(
        personalFileId: string,
        data: {
            documentType: PersonnelDocumentType;
            title: string;
            description?: string;
            fileId: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            issueDate?: Date;
            expiryDate?: Date;
            issuer?: string;
            documentNumber?: string;
        },
        actorId: string,
        actorRole: string
    ) {
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
    async findByPersonalFile(personalFileId: string) {
        return this.prisma.personnelDocument.findMany({
            where: { personalFileId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find document by ID
     */
    async findById(id: string) {
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
            throw new NotFoundException(`PersonnelDocument ${id} not found`);
        }

        return document;
    }

    /**
     * Check for expiring documents (cron job)
     * Returns documents expiring within specified days
     */
    async checkExpiring(days: number = 30) {
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
    async delete(id: string, actorId: string, actorRole: string) {
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
}
