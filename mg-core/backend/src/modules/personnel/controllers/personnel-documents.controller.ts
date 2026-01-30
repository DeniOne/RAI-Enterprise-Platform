import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PersonnelDocumentService } from '../services/personnel-document.service';
import { UploadDocumentDto } from '../dto/request';
import { DocumentResponseDto } from '../dto/response';
import { PersonnelAccessGuard } from '../guards';


@Controller('api/personnel')
@UseGuards(PersonnelAccessGuard)
export class PersonnelDocumentsController {
    constructor(private readonly documentService: PersonnelDocumentService) { }

    /**
     * GET /api/personnel/files/:fileId/documents
     * Список документов в личном деле
     * RBAC: HR_SPECIALIST+
     */
    @Get('files/:fileId/documents')
    async findByFile(@Param('fileId') fileId: string): Promise<DocumentResponseDto[]> {
        const documents = await this.documentService.findByPersonalFile(fileId);
        return documents as DocumentResponseDto[];
    }

    /**
     * GET /api/personnel/documents/:id
     * Детали документа
     * RBAC: HR_SPECIALIST+
     */
    @Get('documents/:id')
    async findById(@Param('id') id: string): Promise<DocumentResponseDto> {
        const document = await this.documentService.findById(id);
        return document as DocumentResponseDto;
    }

    /**
     * GET /api/personnel/documents/expiring
     * Истекающие документы
     * RBAC: HR_MANAGER+
     */
    @Get('documents/expiring')
    async findExpiring(@Query('days') days?: number): Promise<DocumentResponseDto[]> {
        const documents = await this.documentService.checkExpiring(days || 30);
        return documents as DocumentResponseDto[];
    }

    /**
     * POST /api/personnel/files/:fileId/documents
     * Загрузка документа в личное дело
     * RBAC: HR_SPECIALIST+
     */
    @Post('files/:fileId/documents')
    async upload(
        @Param('fileId') fileId: string,
        @Body() dto: UploadDocumentDto,
        @Req() req: any,
    ): Promise<DocumentResponseDto> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_SPECIALIST';

        const document = await this.documentService.upload(
            fileId,
            {
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
            },
            actorId,
            actorRole,
        );

        return document as DocumentResponseDto;
    }

    /**
     * DELETE /api/personnel/documents/:id
     * Удаление документа (soft delete с аудитом)
     * RBAC: HR_MANAGER+
     */
    @Delete('documents/:id')
    async delete(
        @Param('id') id: string,
        @Req() req: any,
    ): Promise<{ message: string }> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';

        const result = await this.documentService.delete(id, actorId, actorRole);
        return result;
    }
}
