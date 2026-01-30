import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

interface CreateDocumentDto {
    title: string;
    documentType: string;
    businessOwnerRole: string;
}

interface DocumentFilters {
    status?: DocumentStatus;
    documentType?: string;
    businessOwnerRole?: string;
}

@Injectable()
export class DocumentService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create document (draft by default)
     * CANON: Document starts as DRAFT, not source of truth
     */
    async createDocument(dto: CreateDocumentDto, actorId: string) {
        // TODO: Validate documentType from Registry
        // TODO: Check RBAC permissions

        const document = await this.prisma.libraryDocument.create({
            data: {
                title: dto.title,
                documentType: dto.documentType,
                businessOwnerRole: dto.businessOwnerRole,
                status: DocumentStatus.DRAFT,
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
    async getDocument(id: string, actorId: string) {
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
            throw new NotFoundException(`Document ${id} not found`);
        }

        // TODO: Check RBAC permissions
        // TODO: Check confidentiality level

        return document;
    }

    /**
     * List documents (with RBAC filtering)
     * CANON: Only show documents user has access to
     */
    async listDocuments(filters: DocumentFilters, actorId: string) {
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
    async archiveDocument(id: string, actorId: string, reason: string) {
        const document = await this.getDocument(id, actorId);

        if (document.status !== DocumentStatus.ACTIVE) {
            throw new ForbiddenException(`Only ACTIVE documents can be archived. Current status: ${document.status}`);
        }

        // TODO: Check RBAC permissions (HR_MANAGER, LEGAL_COUNSEL)

        const updated = await this.prisma.libraryDocument.update({
            where: { id },
            data: { status: DocumentStatus.ARCHIVED },
        });

        // Emit audit event
        // TODO: Emit 'library.document_archived' event with reason

        return updated;
    }

    /**
     * Destroy document (ARCHIVED → DESTROYED)
     * CANON: CRITICAL - Legal only, immutable forever after destruction
     */
    async destroyDocument(id: string, legalBasis: string, approvedBy: string) {
        const document = await this.prisma.libraryDocument.findUnique({
            where: { id },
        });

        if (!document) {
            throw new NotFoundException(`Document ${id} not found`);
        }

        if (document.status !== DocumentStatus.ARCHIVED) {
            throw new ForbiddenException(`Only ARCHIVED documents can be destroyed. Current status: ${document.status}`);
        }

        // CRITICAL: This action is LEGAL-ONLY
        // TODO: Verify caller has LEGAL role

        const updated = await this.prisma.libraryDocument.update({
            where: { id },
            data: { status: DocumentStatus.DESTROYED },
        });

        // Emit audit event
        // TODO: Emit 'library.document_destroyed' event with legalBasis, approvedBy

        // TODO: Schedule async physical file deletion with audit log

        return updated;
    }
}
