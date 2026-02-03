import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from './season.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AgroAuditService } from '../agro-audit/agro-audit.service';
import { SeasonBusinessRulesService } from './services/season-business-rules.service';
import { SeasonSnapshotService } from './services/season-snapshot.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SeasonStatus } from '@prisma/client';

describe('SeasonService.transitionStage', () => {
    let service: SeasonService;
    let prisma: PrismaService;

    const mockUser = { id: 'u1', companyId: 'c1' } as any;
    const mockSeason = {
        id: 's1',
        fieldId: 'f1',
        companyId: 'c1',
        currentStageId: '01_PRE_SOWING_ANALYSIS',
        isLocked: false,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SeasonService,
                {
                    provide: PrismaService,
                    useValue: {
                        season: {
                            findFirst: jest.fn(),
                            update: jest.fn(),
                        },
                        seasonStageProgress: {
                            create: jest.fn(),
                        },
                        $transaction: jest.fn((cb) => cb(prisma)),
                    },
                },
                { provide: AgroAuditService, useValue: { log: jest.fn() } },
                { provide: SeasonBusinessRulesService, useValue: {} },
                { provide: SeasonSnapshotService, useValue: {} },
            ],
        }).compile();

        service = module.get<SeasonService>(SeasonService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should successfully transition to the next stage (IO -> Brain -> IO)', async () => {
        const targetId = '02_TILLAGE_MAIN';
        (prisma.season.findFirst as jest.Mock).mockResolvedValue(mockSeason);
        (prisma.season.update as jest.Mock).mockResolvedValue({ ...mockSeason, currentStageId: targetId });

        const result = await service.transitionStage('s1', targetId, { soil: 'dry' }, mockUser, 'c1');

        expect(result.currentStageId).toBe(targetId);
        expect(prisma.seasonStageProgress.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ stageId: targetId })
        });
    });

    it('should throw NotFound if season does not exist or wrong company', async () => {
        (prisma.season.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(service.transitionStage('s1', '02_TILLAGE_MAIN', {}, mockUser, 'c1'))
            .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequest if stage ID is invalid', async () => {
        (prisma.season.findFirst as jest.Mock).mockResolvedValue(mockSeason);

        await expect(service.transitionStage('s1', 'INVALID_STAGE', {}, mockUser, 'c1'))
            .rejects.toThrow(BadRequestException);
    });
});
