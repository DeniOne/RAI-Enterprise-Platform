import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { RunMemoryMaintenanceDto } from './dto/run-memory-maintenance.dto';
import { MemoryFacade } from './memory-facade.service';
import { MemoryMaintenanceService } from './memory-maintenance.service';

type AuthenticatedUser = {
  userId?: string;
  id?: string;
  companyId?: string;
  role?: string;
};

@Controller('memory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MemoryController {
  private readonly privilegedRoles = new Set(['ADMIN', 'SYSTEM_ADMIN', 'FOUNDER']);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly memoryFacade: MemoryFacade,
    private readonly memoryMaintenanceService: MemoryMaintenanceService,
  ) {}

  private resolveCompanyId(user?: AuthenticatedUser): string {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException('Security Context: companyId is missing');
    }
    if (user?.companyId && String(user.companyId) !== companyId) {
      throw new BadRequestException('Security Context: companyId mismatch');
    }
    return companyId;
  }

  private resolveActorUserId(user?: AuthenticatedUser): string | undefined {
    const actorUserId = user?.userId ?? user?.id;
    return actorUserId ? String(actorUserId) : undefined;
  }

  private ensurePrivilegedRole(user?: AuthenticatedUser): void {
    const role = String(user?.role ?? '').toUpperCase();
    if (!this.privilegedRoles.has(role)) {
      throw new ForbiddenException('Access denied: privileged role required');
    }
  }

  @Get('health')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getHealth(@CurrentUser() user: AuthenticatedUser) {
    const companyId = this.resolveCompanyId(user);
    this.ensurePrivilegedRole(user);
    return this.memoryFacade.getMemoryHealth(companyId);
  }

  @Get('maintenance/control-plane')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getControlPlaneState(@CurrentUser() user: AuthenticatedUser) {
    const companyId = this.resolveCompanyId(user);
    this.ensurePrivilegedRole(user);
    return this.memoryMaintenanceService.getControlPlaneState(companyId);
  }

  @Post('maintenance/run')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async runMaintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RunMemoryMaintenanceDto,
  ) {
    const companyId = this.resolveCompanyId(user);
    this.ensurePrivilegedRole(user);
    return this.memoryMaintenanceService.runManualMaintenance({
      companyId,
      actorUserId: this.resolveActorUserId(user),
      playbookId: dto.playbookId,
      actions: dto.actions,
      maxRuns: dto.maxRuns,
      reason: dto.reason,
    });
  }
}
