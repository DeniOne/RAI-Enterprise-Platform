import { Test, TestingModule } from '@nestjs/testing';
import { ImmutabilityGuard } from './immutability-guard';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { StrategyStatus } from '@rai/prisma-client';

describe('ImmutabilityGuard', () => {
    let guard: ImmutabilityGuard;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImmutabilityGuard,
                {
                    provide: PrismaService,
                    useValue: {
                        agronomicStrategy: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        guard = module.get<ImmutabilityGuard>(ImmutabilityGuard);
        prisma = module.get<PrismaService>(PrismaService);
    });

    describe('assertMutable (I18)', () => {
        it('должен разрешать изменение DRAFT стратегий', async () => {
            (prisma.agronomicStrategy.findUnique as jest.Mock).mockResolvedValue({
                status: StrategyStatus.DRAFT,
            });

            await expect(guard.assertMutable('s1')).resolves.not.toThrow();
        });

        it('должен ЗАПРЕЩАТЬ изменение PUBLISHED стратегий', async () => {
            (prisma.agronomicStrategy.findUnique as jest.Mock).mockResolvedValue({
                status: StrategyStatus.PUBLISHED,
            });

            await expect(guard.assertMutable('s1')).rejects.toThrow(ForbiddenException);
            await expect(guard.assertMutable('s1')).rejects.toThrow(/неизменяема/);
        });

        it('должен ЗАПРЕЩАТЬ изменение ARCHIVED стратегий', async () => {
            (prisma.agronomicStrategy.findUnique as jest.Mock).mockResolvedValue({
                status: StrategyStatus.ARCHIVED,
            });

            await expect(guard.assertMutable('s1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('softArchive', () => {
        it('должен позволять перевод PUBLISHED -> ARCHIVED', async () => {
            (prisma.agronomicStrategy.findUnique as jest.Mock).mockResolvedValue({
                status: StrategyStatus.PUBLISHED,
            });

            await guard.softArchive('s1');

            expect(prisma.agronomicStrategy.update).toHaveBeenCalledWith({
                where: { id: 's1' },
                data: expect.objectContaining({
                    status: StrategyStatus.ARCHIVED,
                    archivedAt: expect.any(Date),
                }),
            });
        });
    });
});
