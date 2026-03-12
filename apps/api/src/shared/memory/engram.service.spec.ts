import { InvariantMetrics } from '../invariants/invariant-metrics';
import { EngramService } from './engram.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EngramService', () => {
    beforeEach(() => {
        InvariantMetrics.resetForTests();
    });

    afterAll(() => {
        InvariantMetrics.resetForTests();
    });

    function createService() {
        const prisma = {
            engram: {
                create: jest.fn().mockResolvedValue({ id: 'engram-1' }),
                updateMany: jest.fn().mockResolvedValue({ count: 3 }),
            },
            safeExecuteRaw: jest.fn().mockResolvedValue(1),
        };

        return {
            service: new EngramService(prisma as unknown as PrismaService),
            prisma,
        };
    }

    it('increments throughput counter when engram is formed', async () => {
        const { service } = createService();

        const engramId = await service.formEngram({
            companyId: 'company-1',
            type: 'AGRO',
            category: 'NUTRITION',
            triggerConditions: { crop: 'wheat', region: 'north' },
            actionTemplate: { type: 'APPLICATION', parameters: { rate: 1 } },
            expectedOutcome: { description: 'better yield' },
            wasSuccessful: true,
            keyInsights: ['timing matters'],
            fieldId: null,
            cropZoneId: null,
            seasonId: null,
        });

        expect(engramId).toBe('engram-1');
        expect(
            InvariantMetrics.snapshot().memory_engram_formations_total,
        ).toBe(1);
    });

    it('increments throughput counter when engrams are pruned', async () => {
        const { service } = createService();

        const pruned = await service.pruneEngrams({
            minWeight: 0.2,
            maxInactiveDays: 30,
        });

        expect(pruned).toBe(3);
        expect(InvariantMetrics.snapshot().memory_engram_pruned_total).toBe(3);
    });

    it('adds company scope to pruning query when requested', async () => {
        const { service, prisma } = createService();

        await service.pruneEngrams({
            minWeight: 0.2,
            maxInactiveDays: 30,
            companyId: 'company-7',
        });

        expect(prisma.engram.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    companyId: 'company-7',
                }),
            }),
        );
    });
});
