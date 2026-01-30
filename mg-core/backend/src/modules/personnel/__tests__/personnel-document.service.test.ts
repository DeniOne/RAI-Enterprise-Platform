import { Test, TestingModule } from '@nestjs/testing';
import { PersonnelDocumentService } from '../services/personnel-document.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { NotFoundException } from '@nestjs/common';

describe('PersonnelDocumentService', () => {
    let service: PersonnelDocumentService;
    let prisma: PrismaService;
    let hrEventService: HRDomainEventService;

    const mockPrisma = {
        personnelDocument: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockHREventService = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PersonnelDocumentService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: HRDomainEventService, useValue: mockHREventService },
            ],
        }).compile();

        service = module.get<PersonnelDocumentService>(PersonnelDocumentService);
        prisma = module.get<PrismaService>(PrismaService);
        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);

        jest.clearAllMocks();
    });

    describe('upload', () => {
        it('should upload document and emit DOCUMENT_UPLOADED event', async () => {
            const mockDocument = {
                id: 'doc-1',
                personalFileId: 'file-1',
                documentType: 'PASSPORT',
                title: 'Passport Copy',
                fileId: 'file-123',
                fileName: 'passport.pdf',
                fileSize: 1024000,
                mimeType: 'application/pdf',
            };

            mockPrisma.personnelDocument.create.mockResolvedValue(mockDocument);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.upload(
                'file-1',
                {
                    documentType: 'PASSPORT' as any,
                    title: 'Passport Copy',
                    fileId: 'file-123',
                    fileName: 'passport.pdf',
                    fileSize: 1024000,
                    mimeType: 'application/pdf',
                },
                'hr-1',
                'HR_SPECIALIST'
            );

            expect(result).toEqual(mockDocument);
            expect(mockPrisma.personnelDocument.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    personalFileId: 'file-1',
                    documentType: 'PASSPORT',
                    title: 'Passport Copy',
                    uploadedById: 'hr-1',
                }),
            });
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'DOCUMENT_UPLOADED',
                aggregateType: 'PERSONNEL_DOCUMENT',
                aggregateId: 'doc-1',
                actorId: 'hr-1',
                actorRole: 'HR_SPECIALIST',
                payload: expect.objectContaining({
                    documentType: 'PASSPORT',
                    fileName: 'passport.pdf',
                }),
                newState: expect.any(Object),
            });
        });
    });

    describe('findByPersonalFile', () => {
        it('should return all documents for a personal file', async () => {
            const mockDocuments = [
                {
                    id: 'doc-1',
                    personalFileId: 'file-1',
                    documentType: 'PASSPORT',
                    title: 'Passport',
                },
                {
                    id: 'doc-2',
                    personalFileId: 'file-1',
                    documentType: 'DIPLOMA',
                    title: 'Diploma',
                },
            ];

            mockPrisma.personnelDocument.findMany.mockResolvedValue(mockDocuments);

            const result = await service.findByPersonalFile('file-1');

            expect(result).toEqual(mockDocuments);
            expect(mockPrisma.personnelDocument.findMany).toHaveBeenCalledWith({
                where: { personalFileId: 'file-1' },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findById', () => {
        it('should return document with related data', async () => {
            const mockDocument = {
                id: 'doc-1',
                documentType: 'PASSPORT',
                personalFile: {
                    id: 'file-1',
                    employee: { id: 'emp-1', name: 'John Doe' },
                },
            };

            mockPrisma.personnelDocument.findUnique.mockResolvedValue(mockDocument);

            const result = await service.findById('doc-1');

            expect(result).toEqual(mockDocument);
            expect(mockPrisma.personnelDocument.findUnique).toHaveBeenCalledWith({
                where: { id: 'doc-1' },
                include: {
                    personalFile: {
                        include: {
                            employee: true,
                        },
                    },
                },
            });
        });

        it('should throw NotFoundException if document not found', async () => {
            mockPrisma.personnelDocument.findUnique.mockResolvedValue(null);

            await expect(service.findById('invalid-id')).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe('checkExpiring', () => {
        it('should return expiring documents and emit DOCUMENT_EXPIRED for expired ones', async () => {
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 86400000); // Yesterday
            const futureDate = new Date(now.getTime() + 86400000 * 15); // 15 days from now

            const mockDocuments = [
                {
                    id: 'doc-1',
                    documentType: 'MEDICAL_CERTIFICATE',
                    expiryDate: expiredDate, // Already expired
                    personalFileId: 'file-1',
                    personalFile: {
                        employee: { id: 'emp-1', name: 'John Doe' },
                    },
                },
                {
                    id: 'doc-2',
                    documentType: 'WORK_PERMIT',
                    expiryDate: futureDate, // Expiring soon
                    personalFileId: 'file-2',
                    personalFile: {
                        employee: { id: 'emp-2', name: 'Jane Smith' },
                    },
                },
            ];

            mockPrisma.personnelDocument.findMany.mockResolvedValue(mockDocuments);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.checkExpiring(30);

            expect(result).toEqual(mockDocuments);

            // Should emit DOCUMENT_EXPIRED only for doc-1 (already expired)
            expect(mockHREventService.emit).toHaveBeenCalledTimes(1);
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'DOCUMENT_EXPIRED',
                aggregateType: 'PERSONNEL_DOCUMENT',
                aggregateId: 'doc-1',
                actorId: 'SYSTEM',
                actorRole: 'SYSTEM',
                payload: expect.objectContaining({
                    documentType: 'MEDICAL_CERTIFICATE',
                }),
            });
        });

        it('should not emit events if no documents are expired', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 15);

            const mockDocuments = [
                {
                    id: 'doc-1',
                    documentType: 'WORK_PERMIT',
                    expiryDate: futureDate,
                    personalFileId: 'file-1',
                    personalFile: {
                        employee: { id: 'emp-1' },
                    },
                },
            ];

            mockPrisma.personnelDocument.findMany.mockResolvedValue(mockDocuments);

            await service.checkExpiring(30);

            expect(mockHREventService.emit).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should mark document for deletion and emit audit event', async () => {
            const mockDocument = {
                id: 'doc-1',
                documentType: 'PASSPORT',
                fileName: 'passport.pdf',
                personalFile: {
                    employee: { id: 'emp-1' },
                },
            };

            mockPrisma.personnelDocument.findUnique.mockResolvedValue(mockDocument);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.delete('doc-1', 'hr-1', 'HR_MANAGER');

            expect(result).toEqual({
                message: 'Document marked for deletion (audit logged)',
            });
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'DOCUMENT_UPLOADED',
                aggregateType: 'PERSONNEL_DOCUMENT',
                aggregateId: 'doc-1',
                actorId: 'hr-1',
                actorRole: 'HR_MANAGER',
                payload: expect.objectContaining({
                    action: 'DELETE',
                    documentType: 'PASSPORT',
                }),
                previousState: { deleted: false },
                newState: { deleted: true },
            });
        });
    });
});
