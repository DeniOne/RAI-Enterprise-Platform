import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@rai/prisma-client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
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
@Roles(UserRole.ADMIN, UserRole.CEO, UserRole.CLIENT_ADMIN)
export class MemoryController {
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

  @Get('health')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getHealth() {
    this.resolveCompanyId();
    return this.memoryFacade.getMemoryHealth();
  }

  @Get('maintenance/control-plane')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getControlPlaneState(@CurrentUser() user: AuthenticatedUser) {
    return this.memoryMaintenanceService.getControlPlaneState(
      this.resolveCompanyId(user),
    );
  }

  @Post('maintenance/run')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async runMaintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RunMemoryMaintenanceDto,
  ) {
    return this.memoryMaintenanceService.runManualMaintenance({
      companyId: this.resolveCompanyId(user),
      actorUserId: this.resolveActorUserId(user),
      playbookId: dto.playbookId,
      actions: dto.actions,
      maxRuns: dto.maxRuns,
      reason: dto.reason,
    });
  }
}
