import { BadRequestException } from '@nestjs/common';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { MemoryController } from './memory.controller';
import { MemoryFacade } from './memory-facade.service';
import { MemoryMaintenanceService } from './memory-maintenance.service';
import {
  MemoryMaintenanceAction,
  MemoryMaintenancePlaybookId,
} from './memory-maintenance.types';

describe('MemoryController', () => {
  function createController(companyId?: string) {
    const tenantContext = {
      getCompanyId: jest.fn().mockReturnValue(companyId),
    };
    const memoryFacade = {
      getMemoryHealth: jest.fn().mockResolvedValue({ ok: true }),
    };
    const memoryMaintenanceService = {
      getControlPlaneState: jest.fn().mockResolvedValue({ ok: true }),
      runManualMaintenance: jest.fn().mockResolvedValue({ ok: true }),
    };

    return {
      controller: new MemoryController(
        tenantContext as unknown as TenantContextService,
        memoryFacade as unknown as MemoryFacade,
        memoryMaintenanceService as unknown as MemoryMaintenanceService,
      ),
      tenantContext,
      memoryFacade,
      memoryMaintenanceService,
    };
  }

  it('rejects maintenance run without tenant context', async () => {
    const { controller } = createController(undefined);

    await expect(
      controller.runMaintenance(
        { userId: 'user-1', companyId: 'company-1' },
        { actions: [MemoryMaintenanceAction.CONSOLIDATION] },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns tenant-scoped control-plane state', async () => {
    const { controller, memoryMaintenanceService } = createController('company-1');

    await controller.getControlPlaneState({
      userId: 'user-1',
      companyId: 'company-1',
    });

    expect(memoryMaintenanceService.getControlPlaneState).toHaveBeenCalledWith(
      'company-1',
    );
  });

  it('forwards tenant-scoped maintenance request with playbook and actor metadata', async () => {
    const { controller, memoryMaintenanceService } = createController('company-1');

    await controller.runMaintenance(
      { userId: 'user-1', companyId: 'company-1' },
      {
        playbookId: MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
        actions: [MemoryMaintenanceAction.CONSOLIDATION],
        maxRuns: 2,
        reason: 'manual_recovery_window',
      },
    );

    expect(memoryMaintenanceService.runManualMaintenance).toHaveBeenCalledWith({
      companyId: 'company-1',
      actorUserId: 'user-1',
      playbookId: MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
      actions: [MemoryMaintenanceAction.CONSOLIDATION],
      maxRuns: 2,
      reason: 'manual_recovery_window',
    });
  });
});
