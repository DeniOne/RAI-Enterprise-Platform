import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { DocumentService } from '../services/document.service';
import { VersionService } from '../services/version.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { CreateVersionDto } from '../dto/create-version.dto';
import { ArchiveDocumentDto } from '../dto/archive-document.dto';
import { DestroyDocumentDto } from '../dto/destroy-document.dto';
import { DocumentStatus } from '@prisma/client';

@Controller('library')
export class LibraryController {
    constructor(
        private documentService: DocumentService,
        private versionService: VersionService,
    ) { }

    /**
     * GET /api/library/documents
     * List documents with optional filters
     */
    @Get('documents')
    async listDocuments(
        @Query('status') status?: DocumentStatus,
        @Query('documentType') documentType?: string,
        @Query('businessOwnerRole') businessOwnerRole?: string,
        @Req() req?: any,
    ) {
        const actorId = req.user?.id || 'SYSTEM';

        return this.documentService.listDocuments(
            { status, documentType, businessOwnerRole },
            actorId,
        );
    }

    /**
     * GET /api/library/documents/:id
     * Get document by ID with versions and links
     */
    @Get('documents/:id')
    async getDocument(@Param('id') id: string, @Req() req?: any) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.getDocument(id, actorId);
    }

    /**
     * GET /api/library/documents/:id/versions
     * List all versions for document
     */
    @Get('documents/:id/versions')
    async listVersions(@Param('id') id: string) {
        return this.versionService.listVersions(id);
    }

    /**
     * POST /api/library/documents
     * Create new document (draft)
     */
    @Post('documents')
    async createDocument(@Body() dto: CreateDocumentDto, @Req() req?: any) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.createDocument(dto, actorId);
    }

    /**
     * POST /api/library/documents/:id/versions
     * Create new version for document
     * TODO: Add file upload handling (multipart/form-data)
     */
    @Post('documents/:id/versions')
    async createVersion(
        @Param('id') documentId: string,
        @Body() dto: CreateVersionDto,
        @Req() req?: any,
    ) {
        const actorId = req.user?.id || 'SYSTEM';

        // TODO: Extract file from multipart request
        const file = Buffer.from(''); // Placeholder
        const mimeType = 'application/pdf'; // Placeholder

        return this.versionService.createVersion(
            { documentId, version: dto.version, file, mimeType },
            actorId,
        );
    }

    /**
     * POST /api/library/documents/:id/set-active-version
     * Set active version for document
     */
    @Post('documents/:id/set-active-version')
    async setActiveVersion(
        @Param('id') documentId: string,
        @Body('versionId') versionId: string,
        @Req() req?: any,
    ) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.versionService.setActiveVersion(documentId, versionId, actorId);
    }

    /**
     * POST /api/library/documents/:id/archive
     * Archive document (ACTIVE → ARCHIVED)
     */
    @Post('documents/:id/archive')
    async archiveDocument(
        @Param('id') id: string,
        @Body() dto: ArchiveDocumentDto,
        @Req() req?: any,
    ) {
        const actorId = req.user?.id || 'SYSTEM';
        return this.documentService.archiveDocument(id, actorId, dto.reason);
    }

    /**
     * POST /api/library/documents/:id/destroy
     * Destroy document (ARCHIVED → DESTROYED)
     * CRITICAL: Legal only
     */
    @Post('documents/:id/destroy')
    // @UseGuards(LegalOnlyGuard) // TODO: Uncomment when guard is ready
    async destroyDocument(@Param('id') id: string, @Body() dto: DestroyDocumentDto) {
        return this.documentService.destroyDocument(id, dto.legalBasis, dto.approvedBy);
    }
}
