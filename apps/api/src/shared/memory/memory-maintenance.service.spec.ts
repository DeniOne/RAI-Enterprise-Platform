import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConsolidationWorker } from './consolidation.worker';
import { EngramFormationWorker } from './engram-formation.worker';
import { MemoryLifecycleObservabilityService } from './memory-lifecycle-observability.service';
import { MemoryMaintenanceService } from './memory-maintenance.service';
import {
  MemoryMaintenanceAction,
  MemoryMaintenancePlaybookId,
} from './memory-maintenance.types';

describe('MemoryMaintenanceService', () => {
  function createService() {
    const consolidationWorker = {
      consolidate: jest.fn(),
      pruneConsolidatedInteractions: jest.fn(),
    };
    const engramFormationWorker = {
      processCompletedTechMaps: jest.fn(),
      pruneInactiveEngrams: jest.fn(),
    };
    const auditService = {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };
    const prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const memoryLifecycleObservability = {
      getSnapshot: jest.fn().mockResolvedValue({
        companyId: 'company-1',
        unconsolidatedCount: 12,
        oldestUnconsolidatedAgeSeconds: 7200,
        prunableConsolidatedCount: 4,
        oldestPrunableConsolidatedAgeSeconds: 172800,
        activeEngramCount: 9,
        latestEngramFormationAgeSeconds: 3600,
        engramFormationCandidateCount: 7,
        oldestEngramFormationCandidateAgeSeconds: 7200,
        prunableActiveEngramCount: 2,
        engramFormationBudgetUsageRatio: 0.5,
        engramPruningBudgetUsageRatio: 0.2,
        retentionDays: 7,
        engramPruningMinWeight: 0.15,
        engramPruningMaxInactiveDays: 45,
        pauseWindows: {
          consolidation: {
            paused: false,
            until: null,
            remainingSeconds: 0,
            reason: null,
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
            paused: false,
            until: null,
            remainingSeconds: 0,
            reason: null,
            invalid: false,
          },
        },
      }),
      getThresholds: jest.fn().mockReturnValue({
        oldestUnconsolidatedAgeSeconds: 3600,
        prunableConsolidatedInteractions: 3,
        latestEngramFormationAgeSeconds: 1800,
        prunableActiveEngrams: 1,
      }),
    };

    return {
      service: new MemoryMaintenanceService(
        consolidationWorker as unknown as ConsolidationWorker,
        engramFormationWorker as unknown as EngramFormationWorker,
        auditService as unknown as AuditService,
        prisma as unknown as PrismaService,
        memoryLifecycleObservability as unknown as MemoryLifecycleObservabilityService,
      ),
      consolidationWorker,
      engramFormationWorker,
      auditService,
      prisma,
      memoryLifecycleObservability,
    };
  }

  it('runs selected playbook with tenant scope and writes completion audit', async () => {
    const { service, consolidationWorker, auditService } = createService();
    consolidationWorker.consolidate
      .mockResolvedValueOnce({ episodesCreated: 2, interactionsProcessed: 6 })
      .mockResolvedValueOnce({ episodesCreated: 0, interactionsProcessed: 0 });
    consolidationWorker.pruneConsolidatedInteractions
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);

    const summary = await service.runManualMaintenance({
      companyId: 'company-1',
      actorUserId: 'user-1',
      playbookId: MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
      maxRuns: 4,
      reason: 'manual_recovery_window',
    });

    expect(consolidationWorker.consolidate).toHaveBeenNthCalledWith(1, {
      companyId: 'company-1',
    });
    expect(consolidationWorker.pruneConsolidatedInteractions).toHaveBeenNthCalledWith(
      1,
      { companyId: 'company-1' },
    );
    expect(summary.playbookId).toBe(
      MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
    );
    expect(summary.scope).toBe('tenant_manual');
    expect(summary.totals.consolidationEpisodesCreated).toBe(2);
    expect(summary.totals.consolidatedInteractionsDeleted).toBe(3);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'MEMORY_MAINTENANCE_RUN_COMPLETED',
        companyId: 'company-1',
        userId: 'user-1',
        metadata: expect.objectContaining({
          scope: 'tenant_manual',
          playbookId: MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
          actions: [
            MemoryMaintenanceAction.CONSOLIDATION,
            MemoryMaintenanceAction.PRUNING,
          ],
          maxRuns: 4,
          reason: 'manual_recovery_window',
        }),
      }),
    );
  });

  it('exposes control-plane state with recommendations and recent runs', async () => {
    const { service, prisma } = createService();
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit-1',
        action: 'MEMORY_MAINTENANCE_RUN_COMPLETED',
        companyId: 'company-1',
        userId: 'user-7',
        createdAt: new Date('2026-03-12T18:00:00.000Z'),
        metadata: {
          scope: 'system_auto',
          playbookId: MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
          reason: 'auto_remediation:consolidation_only',
          actions: [MemoryMaintenanceAction.CONSOLIDATION],
          summary: {
            totals: {
              totalRuns: 2,
              consolidationEpisodesCreated: 1,
              consolidationInteractionsProcessed: 4,
              consolidatedInteractionsDeleted: 0,
              engramsFormed: 0,
              engramFormationSkipped: 0,
              engramsPruned: 0,
            },
          },
        },
      },
    ]);

    const state = await service.getControlPlaneState('company-1');

    expect(state.snapshot.companyId).toBe('company-1');
    expect(state.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          playbookId: MemoryMaintenancePlaybookId.FULL_MEMORY_LIFECYCLE_RECOVERY,
        }),
        expect.objectContaining({
          playbookId: MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
          autoEligible: true,
        }),
      ]),
    );
    expect(state.automation.lastAutoRunAt).toBe('2026-03-12T18:00:00.000Z');
    expect(state.automation.lastAutoRunPlaybookId).toBe(
      MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
    );
    expect(state.recentRuns).toHaveLength(1);
  });

  it('rejects manual-only playbooks for automatic remediation', async () => {
    const { service } = createService();

    await expect(
      service.runAutoRemediation({
        companyId: 'company-1',
        playbookId: MemoryMaintenancePlaybookId.FULL_MEMORY_LIFECYCLE_RECOVERY,
      }),
    ).rejects.toThrow(
      'Playbook full_memory_lifecycle_recovery is not eligible for automatic remediation',
    );
  });

  it('audits failed maintenance runs with partial results', async () => {
    const { service, consolidationWorker, engramFormationWorker, auditService } =
      createService();
    consolidationWorker.pruneConsolidatedInteractions.mockResolvedValue(0);
    engramFormationWorker.processCompletedTechMaps.mockRejectedValue(
      new Error('formation exploded'),
    );

    await expect(
      service.runManualMaintenance({
        companyId: 'company-1',
        actorUserId: 'user-1',
        actions: [
          MemoryMaintenanceAction.PRUNING,
          MemoryMaintenanceAction.ENGRAM_FORMATION,
        ],
        maxRuns: 2,
      }),
    ).rejects.toThrow('formation exploded');

    expect(auditService.log).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'MEMORY_MAINTENANCE_RUN_FAILED',
        companyId: 'company-1',
        userId: 'user-1',
        metadata: expect.objectContaining({
          partialResults: [
            expect.objectContaining({
              action: MemoryMaintenanceAction.PRUNING,
              drained: true,
            }),
          ],
          error: 'formation exploded',
        }),
      }),
    );
  });
});
