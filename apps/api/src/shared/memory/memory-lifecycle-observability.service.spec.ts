import { PrismaService } from '../prisma/prisma.service';
import { MemoryLifecycleObservabilityService } from './memory-lifecycle-observability.service';

describe('MemoryLifecycleObservabilityService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('builds tenant-scoped snapshot with deeper lifecycle signals', async () => {
    process.env.MEMORY_CONSOLIDATION_PAUSE_UNTIL = '2099-01-01T00:00:00.000Z';
    process.env.MEMORY_CONSOLIDATION_PAUSE_REASON = 'operator_hold';

    const prisma = {
      memoryInteraction: {
        count: jest.fn((args: any) => {
          if (args.where?.createdAt?.lt) {
            return 5;
          }
          return 9;
        }),
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          })
          .mockResolvedValueOnce({
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          }),
      },
      engram: {
        count: jest.fn((args: any) => {
          if (args.where?.OR) {
            return 3;
          }
          return 11;
        }),
        findFirst: jest.fn().mockResolvedValue({
          firstFormedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        }),
      },
      techMap: {
        count: jest.fn().mockResolvedValue(7),
        findFirst: jest.fn().mockResolvedValue({
          updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        }),
      },
    };

    const service = new MemoryLifecycleObservabilityService(
      prisma as unknown as PrismaService,
    );

    const snapshot = await service.getSnapshot({ companyId: 'company-1' });

    expect(snapshot).toEqual(
      expect.objectContaining({
        companyId: 'company-1',
        unconsolidatedCount: 9,
        prunableConsolidatedCount: 5,
        oldestPrunableConsolidatedAgeSeconds: expect.any(Number),
        activeEngramCount: 11,
        engramFormationCandidateCount: 7,
        oldestEngramFormationCandidateAgeSeconds: expect.any(Number),
        prunableActiveEngramCount: 3,
        pauseWindows: expect.objectContaining({
          consolidation: expect.objectContaining({
            paused: true,
            reason: 'operator_hold',
          }),
        }),
      }),
    );

    expect(prisma.techMap.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-1',
          status: { in: ['ACTIVE', 'ARCHIVED'] },
          NOT: {
            generationMetadata: {
              path: ['memoryLifecycle', 'engramFormed'],
              equals: true,
            },
          },
        }),
      }),
    );
  });
});
