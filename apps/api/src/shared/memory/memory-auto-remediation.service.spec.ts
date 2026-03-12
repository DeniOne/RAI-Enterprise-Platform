import { InvariantMetrics } from '../invariants/invariant-metrics';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryAutoRemediationService } from './memory-auto-remediation.service';
import { MemoryLifecycleObservabilityService } from './memory-lifecycle-observability.service';
import { MemoryMaintenanceService } from './memory-maintenance.service';
import { MemoryMaintenancePlaybookId } from './memory-maintenance.types';

describe('MemoryAutoRemediationService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    InvariantMetrics.resetForTests();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    InvariantMetrics.resetForTests();
  });

  function createService() {
    const prisma = {
      memoryInteraction: {
        findMany: jest.fn().mockResolvedValue([{ companyId: 'company-1' }]),
      },
      techMap: {
        findMany: jest.fn().mockResolvedValue([{ companyId: 'company-1' }]),
      },
      engram: {
        findMany: jest.fn().mockResolvedValue([{ companyId: 'company-1' }]),
      },
    };
    const memoryLifecycleObservability = {
      getSnapshot: jest.fn().mockResolvedValue({
        companyId: 'company-1',
      }),
    };
    const memoryMaintenanceService = {
      getAutomationConfig: jest.fn().mockReturnValue({
        enabled: true,
        cron: '*/15 * * * *',
        maxCompaniesPerRun: 25,
        maxPlaybooksPerCompany: 2,
        cooldownMinutes: 180,
      }),
      getRecommendations: jest.fn().mockReturnValue([
        {
          playbookId: MemoryMaintenancePlaybookId.FULL_MEMORY_LIFECYCLE_RECOVERY,
          actions: [],
          priority: 100,
          reasons: ['full_backlog'],
          autoEligible: false,
        },
        {
          playbookId: MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
          actions: [],
          priority: 90,
          reasons: ['oldest_unconsolidated_age_high'],
          autoEligible: true,
        },
        {
          playbookId: MemoryMaintenancePlaybookId.ENGRAM_FORMATION_ONLY,
          actions: [],
          priority: 85,
          reasons: ['engram_formation_candidates_stale'],
          autoEligible: true,
        },
      ]),
      hasRecentAutoRemediation: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      runAutoRemediation: jest.fn().mockResolvedValue({ ok: true }),
    };

    return {
      service: new MemoryAutoRemediationService(
        prisma as unknown as PrismaService,
        memoryLifecycleObservability as unknown as MemoryLifecycleObservabilityService,
        memoryMaintenanceService as unknown as MemoryMaintenanceService,
      ),
      prisma,
      memoryLifecycleObservability,
      memoryMaintenanceService,
    };
  }

  it('runs only auto-eligible playbooks and respects cooldown', async () => {
    const { service, memoryMaintenanceService } = createService();

    await service.runAutoRemediationCycle();

    expect(memoryMaintenanceService.runAutoRemediation).toHaveBeenCalledTimes(1);
    expect(memoryMaintenanceService.runAutoRemediation).toHaveBeenCalledWith({
      companyId: 'company-1',
      playbookId: MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
      reason: 'auto_remediation:consolidation_only',
    });
    expect(
      InvariantMetrics.snapshot().memory_auto_remediations_total,
    ).toBe(1);
    expect(
      InvariantMetrics.snapshot().memory_auto_remediation_failures_total,
    ).toBe(0);
  });

  it('increments failure metric when auto remediation run fails', async () => {
    const { service, memoryMaintenanceService } = createService();
    memoryMaintenanceService.hasRecentAutoRemediation = jest
      .fn()
      .mockResolvedValue(false);
    memoryMaintenanceService.getRecommendations = jest.fn().mockReturnValue([
      {
        playbookId: MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
        actions: [],
        priority: 90,
        reasons: ['oldest_unconsolidated_age_high'],
        autoEligible: true,
      },
    ]);
    memoryMaintenanceService.runAutoRemediation = jest
      .fn()
      .mockRejectedValue(new Error('boom'));

    await service.runAutoRemediationCycle();

    expect(
      InvariantMetrics.snapshot().memory_auto_remediation_failures_total,
    ).toBe(1);
  });

  it('does nothing when automation is disabled', async () => {
    const { service, memoryMaintenanceService } = createService();
    memoryMaintenanceService.getAutomationConfig = jest.fn().mockReturnValue({
      enabled: false,
      cron: '*/15 * * * *',
      maxCompaniesPerRun: 25,
      maxPlaybooksPerCompany: 2,
      cooldownMinutes: 180,
    });

    await service.runAutoRemediationCycle();

    expect(memoryMaintenanceService.runAutoRemediation).not.toHaveBeenCalled();
  });
});
