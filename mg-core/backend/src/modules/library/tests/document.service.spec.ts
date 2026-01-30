import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from '../services/document.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DocumentService', () => {
    let service: DocumentService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentService,
                {
                    provide: PrismaService,
                    useValue: {
                        libraryDocument: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<DocumentService>(DocumentService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    describe('createDocument', () => {
        it('should create document with DRAFT status', async () => {
            const dto = {
                title: 'Test Document',
                documentType: 'HR_PERSONAL_FILE',
                businessOwnerRole: 'HR_MANAGER',
            };

            const mockDocument = {
                id: 'doc-123',
                ...dto,
                status: DocumentStatus.DRAFT,
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(prisma.libraryDocument, 'create').mockResolvedValue(mockDocument);

            const result = await service.createDocument(dto, 'actor-123');

            expect(result).toEqual(mockDocument);
            expect(result.status).toBe(DocumentStatus.DRAFT);
            expect(prisma.libraryDocument.create).toHaveBeenCalledWith({
                data: {
                    title: dto.title,
                    documentType: dto.documentType,
                    businessOwnerRole: dto.businessOwnerRole,
                    status: DocumentStatus.DRAFT,
                },
            });
        });
    });

    describe('archiveDocument', () => {
        it('should archive ACTIVE document', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: DocumentStatus.ACTIVE,
                documentType: 'HR_PERSONAL_FILE',
                businessOwnerRole: 'HR_MANAGER',
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                versions: [],
                links: [],
                currentVersion: null,
            };

            jest.spyOn(prisma.libraryDocument, 'findUnique').mockResolvedValue(mockDocument);
            jest.spyOn(prisma.libraryDocument, 'update').mockResolvedValue({
                ...mockDocument,
                status: DocumentStatus.ARCHIVED,
            });

            const result = await service.archiveDocument('doc-123', 'actor-123', 'Test reason');

            expect(result.status).toBe(DocumentStatus.ARCHIVED);
            expect(prisma.libraryDocument.update).toHaveBeenCalledWith({
                where: { id: 'doc-123' },
                data: { status: DocumentStatus.ARCHIVED },
            });
        });

        it('should throw error if document is not ACTIVE', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: DocumentStatus.DRAFT,
                documentType: 'HR_PERSONAL_FILE',
                businessOwnerRole: 'HR_MANAGER',
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                versions: [],
                links: [],
                currentVersion: null,
            };

            jest.spyOn(prisma.libraryDocument, 'findUnique').mockResolvedValue(mockDocument);

            await expect(
                service.archiveDocument('doc-123', 'actor-123', 'Test reason'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('destroyDocument', () => {
        it('should destroy ARCHIVED document', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: DocumentStatus.ARCHIVED,
                documentType: 'HR_PERSONAL_FILE',
                businessOwnerRole: 'HR_MANAGER',
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(prisma.libraryDocument, 'findUnique').mockResolvedValue(mockDocument);
            jest.spyOn(prisma.libraryDocument, 'update').mockResolvedValue({
                ...mockDocument,
                status: DocumentStatus.DESTROYED,
            });

            const result = await service.destroyDocument('doc-123', 'Legal basis', 'legal-123');

            expect(result.status).toBe(DocumentStatus.DESTROYED);
        });

        it('should throw error if document is not ARCHIVED', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: DocumentStatus.ACTIVE,
                documentType: 'HR_PERSONAL_FILE',
                businessOwnerRole: 'HR_MANAGER',
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(prisma.libraryDocument, 'findUnique').mockResolvedValue(mockDocument);

            await expect(
                service.destroyDocument('doc-123', 'Legal basis', 'legal-123'),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
