"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const document_service_1 = require("../services/document.service");
const prisma_service_1 = require("@/prisma/prisma.service");
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
describe('DocumentService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                document_service_1.DocumentService,
                {
                    provide: prisma_service_1.PrismaService,
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
        service = module.get(document_service_1.DocumentService);
        prisma = module.get(prisma_service_1.PrismaService);
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
                status: client_1.DocumentStatus.DRAFT,
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            jest.spyOn(prisma.libraryDocument, 'create').mockResolvedValue(mockDocument);
            const result = await service.createDocument(dto, 'actor-123');
            expect(result).toEqual(mockDocument);
            expect(result.status).toBe(client_1.DocumentStatus.DRAFT);
            expect(prisma.libraryDocument.create).toHaveBeenCalledWith({
                data: {
                    title: dto.title,
                    documentType: dto.documentType,
                    businessOwnerRole: dto.businessOwnerRole,
                    status: client_1.DocumentStatus.DRAFT,
                },
            });
        });
    });
    describe('archiveDocument', () => {
        it('should archive ACTIVE document', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: client_1.DocumentStatus.ACTIVE,
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
                status: client_1.DocumentStatus.ARCHIVED,
            });
            const result = await service.archiveDocument('doc-123', 'actor-123', 'Test reason');
            expect(result.status).toBe(client_1.DocumentStatus.ARCHIVED);
            expect(prisma.libraryDocument.update).toHaveBeenCalledWith({
                where: { id: 'doc-123' },
                data: { status: client_1.DocumentStatus.ARCHIVED },
            });
        });
        it('should throw error if document is not ACTIVE', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: client_1.DocumentStatus.DRAFT,
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
            await expect(service.archiveDocument('doc-123', 'actor-123', 'Test reason')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('destroyDocument', () => {
        it('should destroy ARCHIVED document', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: client_1.DocumentStatus.ARCHIVED,
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
                status: client_1.DocumentStatus.DESTROYED,
            });
            const result = await service.destroyDocument('doc-123', 'Legal basis', 'legal-123');
            expect(result.status).toBe(client_1.DocumentStatus.DESTROYED);
        });
        it('should throw error if document is not ARCHIVED', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test',
                status: client_1.DocumentStatus.ACTIVE,
                documentType: 'HR_PERSONAL_FILE',
                businessOwnerRole: 'HR_MANAGER',
                logicalOwner: 'LIBRARY',
                currentVersionId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            jest.spyOn(prisma.libraryDocument, 'findUnique').mockResolvedValue(mockDocument);
            await expect(service.destroyDocument('doc-123', 'Legal basis', 'legal-123')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
});
