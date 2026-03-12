import { EngramFormationWorker } from './engram-formation.worker';
import { PrismaService } from '../prisma/prisma.service';
import { EngramService } from './engram.service';

describe('EngramFormationWorker', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    function createWorker(env?: Record<string, string>) {
        process.env = { ...process.env, ...env };

        const prisma = {
            techMap: {
                findMany: jest.fn().mockResolvedValue([]),
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
        };
        const engramService = {
            formEngram: jest.fn(),
            pruneEngrams: jest.fn().mockResolvedValue(0),
        };

        return {
            worker: new EngramFormationWorker(
                prisma as unknown as PrismaService,
                engramService as unknown as EngramService,
            ),
            prisma,
            engramService,
        };
    }

    async function flushBootstrapTasks() {
        await new Promise((resolve) => setImmediate(resolve));
        await Promise.resolve();
    }

    it('runs bootstrap lifecycle maintenance when enabled', async () => {
        const { worker } = createWorker();
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 0, skipped: 0 });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(formationSpy).toHaveBeenCalledTimes(1);
        expect(pruningSpy).toHaveBeenCalledTimes(1);
    });

    it('repeats bootstrap lifecycle maintenance until backlog is drained', async () => {
        const { worker } = createWorker();
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValueOnce({ formed: 2, skipped: 0 })
            .mockResolvedValueOnce({ formed: 0, skipped: 0 });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(formationSpy).toHaveBeenCalledTimes(2);
        expect(pruningSpy).toHaveBeenCalledTimes(2);
    });

    it('caps bootstrap lifecycle maintenance by configured max runs', async () => {
        const { worker } = createWorker({
            MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS: '2',
            MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS: '2',
        });
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 2, skipped: 0 });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValue(3);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(formationSpy).toHaveBeenCalledTimes(2);
        expect(pruningSpy).toHaveBeenCalledTimes(2);
    });

    it('skips bootstrap lifecycle maintenance when bootstrap flags are disabled', async () => {
        const { worker } = createWorker({
            MEMORY_ENGRAM_FORMATION_BOOTSTRAP_ENABLED: 'false',
            MEMORY_ENGRAM_PRUNING_BOOTSTRAP_ENABLED: 'false',
        });
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 0, skipped: 0 });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(formationSpy).not.toHaveBeenCalled();
        expect(pruningSpy).not.toHaveBeenCalled();
    });

    it('runs scheduled formation when lifecycle is enabled', async () => {
        const { worker } = createWorker();
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 0, skipped: 0 });

        await worker.handleScheduledFormation();

        expect(formationSpy).toHaveBeenCalledTimes(1);
    });

    it('skips scheduled formation when globally disabled', async () => {
        const { worker } = createWorker({ MEMORY_HYGIENE_ENABLED: 'false' });
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 0, skipped: 0 });

        await worker.handleScheduledFormation();

        expect(formationSpy).not.toHaveBeenCalled();
    });

    it('runs scheduled pruning with configured thresholds', async () => {
        const { worker, engramService } = createWorker({
            MEMORY_ENGRAM_PRUNING_MIN_WEIGHT: '0.25',
            MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS: '60',
        });

        await worker.handleScheduledPruning();

        expect(engramService.pruneEngrams).toHaveBeenCalledWith({
            minWeight: 0.25,
            maxInactiveDays: 60,
            companyId: undefined,
        });
    });

    it('skips scheduled pruning when pruning schedule is disabled', async () => {
        const { worker } = createWorker({
            MEMORY_ENGRAM_PRUNING_SCHEDULE_ENABLED: 'false',
        });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValue(0);

        await worker.handleScheduledPruning();

        expect(pruningSpy).not.toHaveBeenCalled();
    });

    it('skips paused formation paths while leaving pruning available', async () => {
        const { worker } = createWorker({
            MEMORY_ENGRAM_FORMATION_PAUSE_UNTIL: '2099-01-01T00:00:00.000Z',
            MEMORY_ENGRAM_FORMATION_PAUSE_REASON: 'operator_seed_freeze',
        });
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 0, skipped: 0 });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();
        await worker.handleScheduledFormation();
        await worker.handleScheduledPruning();

        expect(formationSpy).not.toHaveBeenCalled();
        expect(pruningSpy).toHaveBeenCalledTimes(2);
    });

    it('skips paused engram pruning paths while still allowing formation', async () => {
        const { worker } = createWorker({
            MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL: '2099-01-01T00:00:00.000Z',
            MEMORY_ENGRAM_PRUNING_PAUSE_REASON: 'operator_pruning_hold',
        });
        const formationSpy = jest
            .spyOn(worker, 'processCompletedTechMaps')
            .mockResolvedValue({ formed: 0, skipped: 0 });
        const pruningSpy = jest
            .spyOn(worker, 'pruneInactiveEngrams')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();
        await worker.handleScheduledFormation();
        await worker.handleScheduledPruning();

        expect(formationSpy).toHaveBeenCalledTimes(2);
        expect(pruningSpy).not.toHaveBeenCalled();
    });

    it('stores engram lifecycle marker inside generationMetadata', async () => {
        const { worker, prisma } = createWorker();
        prisma.techMap.findMany.mockResolvedValue([
            {
                id: 'tm-1',
                generationMetadata: {
                    modelId: 'gen-v1',
                    memoryLifecycle: {
                        lastCheckAt: '2026-03-01T00:00:00.000Z',
                    },
                },
                stages: [],
                cropZone: {},
                field: {},
            },
        ]);
        jest
            .spyOn(worker as any, 'formEngramFromTechMap')
            .mockResolvedValue('engram-1');

        await worker.processCompletedTechMaps();

        expect(prisma.techMap.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'tm-1' },
                data: {
                    generationMetadata: expect.objectContaining({
                        modelId: 'gen-v1',
                        memoryLifecycle: expect.objectContaining({
                            lastCheckAt: '2026-03-01T00:00:00.000Z',
                            engramFormed: true,
                            engramId: 'engram-1',
                            engramFormedAt: expect.any(String),
                        }),
                    }),
                },
            }),
        );
    });

    it('passes company scope to tech map lookup for manual formation runs', async () => {
        const { worker, prisma } = createWorker();

        await worker.processCompletedTechMaps({ companyId: 'company-7' });

        expect(prisma.techMap.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    companyId: 'company-7',
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

    it('passes company scope to manual engram pruning', async () => {
        const { worker, engramService } = createWorker();

        await worker.pruneInactiveEngrams({ companyId: 'company-7' });

        expect(engramService.pruneEngrams).toHaveBeenCalledWith({
            minWeight: 0.15,
            maxInactiveDays: 45,
            companyId: 'company-7',
        });
    });
});
