import { Test, TestingModule } from '@nestjs/testing';
import { TechnologyCardService } from './technology-card.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TechnologyCardService', () => {
    let service: TechnologyCardService;
    let prisma: PrismaService;

    const mockUser = { id: 'u1', companyId: 'c1' } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TechnologyCardService,
                {
                    provide: PrismaService,
                    useValue: {
                        technologyCard: {
                            create: jest.fn(),
                            findFirst: jest.fn(),
                            findMany: jest.fn(),
                        },
                        season: {
                            findFirst: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<TechnologyCardService>(TechnologyCardService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should create a technology card with operations and resources', async () => {
        const input = {
            name: 'Rapeseed High Yield',
            operations: [
                {
                    name: 'Sowing',
                    sequence: 1,
                    stageId: '04_SOWING',
                    resources: [
                        { type: 'SEED', name: 'Rapeseed V1', dosage: 5, unit: 'kg/ha' }
                    ]
                }
            ]
        };

        (prisma.technologyCard.create as jest.Mock).mockResolvedValue({ id: 'tc1', ...input });

        const result = await service.create(input, mockUser, 'c1');
        expect(result.id).toBe('tc1');
        expect(prisma.technologyCard.create).toHaveBeenCalled();
    });

    it('should apply card to season successfully', async () => {
        (prisma.season.findFirst as jest.Mock).mockResolvedValue({ id: 's1', companyId: 'c1' });
        (prisma.technologyCard.findFirst as jest.Mock).mockResolvedValue({ id: 'tc1', companyId: 'c1' });
        (prisma.season.update as jest.Mock).mockResolvedValue({ id: 's1', technologyCardId: 'tc1' });

        const result = await service.applyToSeason('s1', 'tc1', mockUser, 'c1');
        expect(result.technologyCardId).toBe('tc1');
    });

    it('should throw if season belongs to another company', async () => {
        (prisma.season.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(service.applyToSeason('s1', 'tc1', mockUser, 'c1'))
            .rejects.toThrow(NotFoundException);
    });
});
