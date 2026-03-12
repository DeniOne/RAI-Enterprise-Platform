import { ConsolidationWorker } from './consolidation.worker';
import { PrismaService } from '../prisma/prisma.service';

describe('ConsolidationWorker', () => {
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
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
            safeQueryRaw: jest.fn().mockResolvedValue([]),
            safeExecuteRaw: jest.fn().mockResolvedValue(0),
            memoryInteraction: {
                findMany: jest.fn(),
                updateMany: jest.fn(),
            },
            memoryEpisode: {
                create: jest.fn(),
            },
        };

        return {
            worker: new ConsolidationWorker(prisma as unknown as PrismaService),
            prisma,
        };
    }

    async function flushBootstrapTasks() {
        await new Promise((resolve) => setImmediate(resolve));
        await Promise.resolve();
    }

    it('runs bootstrap maintenance when enabled', async () => {
        const { worker } = createWorker();
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 0, interactionsProcessed: 0 });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(consolidateSpy).toHaveBeenCalledTimes(1);
        expect(pruneSpy).toHaveBeenCalledTimes(1);
    });

    it('repeats bootstrap catch-up until backlog is drained', async () => {
        const { worker } = createWorker();
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValueOnce({ episodesCreated: 1, interactionsProcessed: 5 })
            .mockResolvedValueOnce({ episodesCreated: 0, interactionsProcessed: 0 });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(consolidateSpy).toHaveBeenCalledTimes(2);
        expect(pruneSpy).toHaveBeenCalledTimes(2);
    });

    it('caps bootstrap catch-up by configured max runs', async () => {
        const { worker } = createWorker({
            MEMORY_CONSOLIDATION_BOOTSTRAP_MAX_RUNS: '2',
            MEMORY_PRUNING_BOOTSTRAP_MAX_RUNS: '2',
        });
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 1, interactionsProcessed: 5 });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(2);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(consolidateSpy).toHaveBeenCalledTimes(2);
        expect(pruneSpy).toHaveBeenCalledTimes(2);
    });

    it('skips bootstrap maintenance when bootstrap flags are disabled', async () => {
        const { worker } = createWorker({
            MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED: 'false',
            MEMORY_PRUNING_BOOTSTRAP_ENABLED: 'false',
        });
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 0, interactionsProcessed: 0 });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();

        expect(consolidateSpy).not.toHaveBeenCalled();
        expect(pruneSpy).not.toHaveBeenCalled();
    });

    it('runs scheduled consolidation when memory hygiene is enabled', async () => {
        const { worker } = createWorker();
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 0, interactionsProcessed: 0 });

        await worker.handleScheduledConsolidation();

        expect(consolidateSpy).toHaveBeenCalledTimes(1);
    });

    it('skips scheduled consolidation when globally disabled', async () => {
        const { worker } = createWorker({ MEMORY_HYGIENE_ENABLED: 'false' });
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 0, interactionsProcessed: 0 });

        await worker.handleScheduledConsolidation();

        expect(consolidateSpy).not.toHaveBeenCalled();
    });

    it('runs scheduled pruning when pruning schedule is enabled', async () => {
        const { worker } = createWorker();
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(0);

        await worker.handleScheduledPruning();

        expect(pruneSpy).toHaveBeenCalledTimes(1);
    });

    it('skips scheduled pruning when pruning schedule is disabled', async () => {
        const { worker } = createWorker({
            MEMORY_PRUNING_SCHEDULE_ENABLED: 'false',
        });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(0);

        await worker.handleScheduledPruning();

        expect(pruneSpy).not.toHaveBeenCalled();
    });

    it('skips paused consolidation paths while leaving pruning available', async () => {
        const { worker } = createWorker({
            MEMORY_CONSOLIDATION_PAUSE_UNTIL: '2099-01-01T00:00:00.000Z',
            MEMORY_CONSOLIDATION_PAUSE_REASON: 'operator_backfill_window',
        });
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 0, interactionsProcessed: 0 });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();
        await worker.handleScheduledConsolidation();
        await worker.handleScheduledPruning();

        expect(consolidateSpy).not.toHaveBeenCalled();
        expect(pruneSpy).toHaveBeenCalledTimes(2);
    });

    it('skips paused pruning paths while still allowing consolidation', async () => {
        const { worker } = createWorker({
            MEMORY_PRUNING_PAUSE_UNTIL: '2099-01-01T00:00:00.000Z',
            MEMORY_PRUNING_PAUSE_REASON: 'operator_cleanup_hold',
        });
        const consolidateSpy = jest
            .spyOn(worker, 'consolidate')
            .mockResolvedValue({ episodesCreated: 0, interactionsProcessed: 0 });
        const pruneSpy = jest
            .spyOn(worker, 'pruneConsolidatedInteractions')
            .mockResolvedValue(0);

        worker.onApplicationBootstrap();
        await flushBootstrapTasks();
        await worker.handleScheduledConsolidation();
        await worker.handleScheduledPruning();

        expect(consolidateSpy).toHaveBeenCalledTimes(2);
        expect(pruneSpy).not.toHaveBeenCalled();
    });

    it('injects company scope into manual consolidation query', async () => {
        const { worker, prisma } = createWorker();

        await worker.consolidate({ companyId: 'company-42' });

        const query = prisma.safeQueryRaw.mock.calls[0][0] as { values?: unknown[] };
        expect(query.values).toContain('company-42');
    });

    it('injects company scope into manual pruning query', async () => {
        const { worker, prisma } = createWorker();

        await worker.pruneConsolidatedInteractions({ companyId: 'company-42' });

        const query = prisma.safeExecuteRaw.mock.calls[0][0] as { values?: unknown[] };
        expect(query.values).toContain('company-42');
    });
});
