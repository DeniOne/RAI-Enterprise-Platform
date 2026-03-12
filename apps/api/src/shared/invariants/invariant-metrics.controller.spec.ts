import { PrismaService } from '../prisma/prisma.service';
import { MemoryLifecycleObservabilityService } from '../memory/memory-lifecycle-observability.service';
import { InvariantMetrics } from './invariant-metrics';
import { InvariantMetricsController } from './invariant-metrics.controller';

describe('InvariantMetricsController', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    InvariantMetrics.resetForTests();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    InvariantMetrics.resetForTests();
  });

  function createController() {
    const prisma = {
      outboxMessage: {
        count: jest.fn(({ where }: any) => {
          if (where?.status === 'PENDING') return 3;
          if (where?.status === 'PROCESSING') return 1;
          if (where?.status === 'FAILED') return 2;
          return 0;
        }),
        findFirst: jest.fn().mockResolvedValue({
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
        }),
      },
    };
    const memoryLifecycleObservability = {
      getThresholds: jest.fn().mockReturnValue({
        oldestUnconsolidatedAgeSeconds: 60,
        prunableConsolidatedInteractions: 10,
        latestEngramFormationAgeSeconds: 60,
        prunableActiveEngrams: 10,
      }),
      getSnapshot: jest.fn().mockResolvedValue({
        companyId: null,
        unconsolidatedCount: 9,
        oldestUnconsolidatedAgeSeconds: 8 * 60 * 60,
        prunableConsolidatedCount: 17,
        oldestPrunableConsolidatedAgeSeconds: 11 * 24 * 60 * 60,
        activeEngramCount: 42,
        latestEngramFormationAgeSeconds: 9 * 24 * 60 * 60,
        engramFormationCandidateCount: 6,
        oldestEngramFormationCandidateAgeSeconds: 3 * 24 * 60 * 60,
        prunableActiveEngramCount: 11,
        engramFormationBudgetUsageRatio: 1.1,
        engramPruningBudgetUsageRatio: 1.1,
        retentionDays: 7,
        engramPruningMinWeight: 0.15,
        engramPruningMaxInactiveDays: 45,
        pauseWindows: {
          consolidation: {
            paused: true,
            until: '2099-01-01T00:00:00.000Z',
            remainingSeconds: 123,
            reason: 'operator_backfill_window',
            invalid: false,
          },
          pruning: {
            paused: false,
            until: null,
            remainingSeconds: 0,
            reason: null,
            invalid: false,
          },
          engramFormation: {
            paused: false,
            until: null,
            remainingSeconds: 0,
            reason: null,
            invalid: false,
          },
          engramPruning: {
            paused: true,
            until: '2099-01-01T00:00:00.000Z',
            remainingSeconds: 456,
            reason: 'operator_pruning_hold',
            invalid: false,
          },
        },
      }),
    };

    return {
      controller: new InvariantMetricsController(
        prisma as unknown as PrismaService,
        memoryLifecycleObservability as unknown as MemoryLifecycleObservabilityService,
      ),
      prisma,
      memoryLifecycleObservability,
    };
  }

  it('includes deeper memory lifecycle snapshot and alerts in metrics response', async () => {
    const { controller } = createController();

    const result = await controller.getMetrics();

    expect(result).toEqual(
      expect.objectContaining({
        memory: expect.objectContaining({
          unconsolidatedCount: 9,
          prunableConsolidatedCount: 17,
          oldestPrunableConsolidatedAgeSeconds: expect.any(Number),
          activeEngramCount: 42,
          engramFormationCandidateCount: 6,
          oldestEngramFormationCandidateAgeSeconds: expect.any(Number),
          prunableActiveEngramCount: 11,
          engramFormationBudgetUsageRatio: 1.1,
          engramPruningBudgetUsageRatio: 1.1,
          retentionDays: 7,
          pauseWindows: expect.objectContaining({
            consolidation: expect.objectContaining({
              paused: true,
              reason: 'operator_backfill_window',
              remainingSeconds: expect.any(Number),
            }),
            pruning: expect.objectContaining({
              paused: false,
              reason: null,
              remainingSeconds: 0,
            }),
            engramPruning: expect.objectContaining({
              paused: true,
              reason: 'operator_pruning_hold',
              remainingSeconds: expect.any(Number),
            }),
          }),
        }),
        alerts: expect.objectContaining({
          memory_oldest_unconsolidated_age_seconds: true,
          memory_prunable_consolidated_interactions: true,
          memory_latest_engram_formation_age_seconds: true,
          memory_engram_formation_candidates_stale: true,
          memory_prunable_active_engrams: true,
        }),
      }),
    );
  });

  it('exports deeper memory lifecycle gauges and automation counters in prometheus format', async () => {
    process.env.MEMORY_AUTO_REMEDIATION_ENABLED = 'true';
    InvariantMetrics.increment('memory_engram_formations_total', 4);
    InvariantMetrics.increment('memory_engram_pruned_total', 3);
    InvariantMetrics.increment('memory_auto_remediations_total', 2);
    InvariantMetrics.increment('memory_auto_remediation_failures_total', 1);
    const { controller } = createController();
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controller.getMetricsPrometheus(response as any);

    const payload = response.send.mock.calls[0][0] as string;
    expect(payload).toContain('memory_unconsolidated_interactions 9');
    expect(payload).toContain('memory_prunable_consolidated_interactions 17');
    expect(payload).toContain(
      'memory_oldest_prunable_consolidated_age_seconds',
    );
    expect(payload).toContain('memory_active_engrams 42');
    expect(payload).toContain('memory_engram_formation_candidates 6');
    expect(payload).toContain(
      'memory_oldest_engram_formation_candidate_age_seconds',
    );
    expect(payload).toContain('memory_prunable_active_engrams 11');
    expect(payload).toContain('memory_latest_engram_formation_age_seconds');
    expect(payload).toContain('memory_oldest_unconsolidated_age_seconds');
    expect(payload).toContain('invariant_memory_engram_formations_total 4');
    expect(payload).toContain('invariant_memory_engram_pruned_total 3');
    expect(payload).toContain('invariant_memory_auto_remediations_total 2');
    expect(payload).toContain(
      'invariant_memory_auto_remediation_failures_total 1',
    );
    expect(payload).toContain('memory_engram_formation_budget_usage_ratio');
    expect(payload).toContain('memory_engram_pruning_budget_usage_ratio');
    expect(payload).toContain('memory_auto_remediation_enabled 1');
    expect(payload).toContain('memory_consolidation_paused 1');
    expect(payload).toContain('memory_pruning_paused 0');
    expect(payload).toContain('memory_engram_formation_paused 0');
    expect(payload).toContain('memory_engram_pruning_paused 1');
  });
});
