import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from './season.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AgroAuditService } from '../agro-audit/agro-audit.service';
import { SeasonBusinessRulesService } from './services/season-business-rules.service';
import { SeasonSnapshotService } from './services/season-snapshot.service';
import { SeasonStatus, User } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SeasonService', () => {
    let service: SeasonService;
    let prisma: PrismaService;
    let businessRules: SeasonBusinessRulesService;
    let snapshotService: SeasonSnapshotService;
    let audit: AgroAuditService;

    const mockUser: User = {
        id: 'user-1',
        companyId: 'company-1',
    } as any;

    const mockSeason = {
        id: 'season-1',
        year: 2026,
        status: SeasonStatus.PLANNING,
        fieldId: 'field-1',
        rapeseedId: 'rapeseed-1',
        companyId: 'company-1',
        isLocked: false,
    };

    const prismaMock = {
        season: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        field: {
            findFirst: jest.fn(),
        },
        rapeseed: {
            findFirst: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const auditMock = {
        log: jest.fn().mockResolvedValue({}),
        logWithRetry: jest.fn().mockResolvedValue({}),
    };

    const businessRulesMock = {
        validateRapeseedSeason: jest.fn().mockResolvedValue(undefined),
    };

    const snapshotMock = {
        createSnapshot: jest.fn().mockResolvedValue(undefined),
        createSnapshotTransaction: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SeasonService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: AgroAuditService, useValue: auditMock },
                { provide: SeasonBusinessRulesService, useValue: businessRulesMock },
                { provide: SeasonSnapshotService, useValue: snapshotMock },
            ],
        }).compile();

        service = module.get<SeasonService>(SeasonService);
        prisma = module.get<PrismaService>(PrismaService);
        businessRules = module.get<SeasonBusinessRulesService>(SeasonBusinessRulesService);
        snapshotService = module.get<SeasonSnapshotService>(SeasonSnapshotService);
        audit = module.get<AgroAuditService>(AgroAuditService);

        jest.clearAllMocks();
    });

    describe('Multi-tenancy isolation', () => {
        it('should throw NotFoundException if season belongs to another company', async () => {
            prismaMock.season.findFirst.mockResolvedValue(null);

            await expect(service.findOne('season-1', 'company-2'))
                .rejects.toThrow(NotFoundException);
        });

        it('should only return seasons for the specified company', async () => {
            prismaMock.season.findMany.mockResolvedValue([mockSeason]);

            const result = await service.findAll('company-1');

            expect(prismaMock.season.findMany).toHaveBeenCalledWith({
                where: { companyId: 'company-1' },
                orderBy: { createdAt: 'desc' }
            });
            expect(result).toEqual([mockSeason]);
        });
    });

    describe('Atomicity & Transactions (completeSeason)', () => {
        it('should perform lock and snapshot in a transaction', async () => {
            prismaMock.season.findFirst.mockResolvedValue(mockSeason);
            prismaMock.season.update.mockResolvedValue({ ...mockSeason, isLocked: true, status: SeasonStatus.COMPLETED });

            const result = await service.completeSeason('season-1', 4.5, mockUser, 'company-1');

            expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
                maxWait: 5000,
                timeout: 10000,
            }));
            expect(prismaMock.season.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'season-1' },
                data: expect.objectContaining({
                    status: SeasonStatus.COMPLETED,
                    isLocked: true,
                })
            }));
            expect(snapshotMock.createSnapshotTransaction).toHaveBeenCalled();
            expect(auditMock.logWithRetry).toHaveBeenCalled();
            expect(result.isLocked).toBe(true);
        });

        it('should re-check lock before updating', async () => {
            prismaMock.season.findFirst.mockResolvedValue({ ...mockSeason, isLocked: true });

            await expect(service.completeSeason('season-1', 4.5, mockUser, 'company-1'))
                .rejects.toThrow(BadRequestException);

            expect(prismaMock.season.update).not.toHaveBeenCalled();
        });
    });

    describe('Business Rules Integration', () => {
        it('should validate business rules on creation', async () => {
            prismaMock.field.findFirst.mockResolvedValue({ id: 'field-1' });
            prismaMock.rapeseed.findFirst.mockResolvedValue({ id: 'rapeseed-1' });
            prismaMock.season.create.mockResolvedValue(mockSeason);

            await service.create({
                year: 2026,
                fieldId: 'field-1',
                rapeseedId: 'rapeseed-1',
            }, mockUser, 'company-1');

            expect(businessRulesMock.validateRapeseedSeason).toHaveBeenCalled();
        });
    });
});
