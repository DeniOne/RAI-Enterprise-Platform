import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { Roles } from "../../shared/auth/roles.decorator";
import { IncidentRunbookAction, UserRole } from "@rai/prisma-client";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import {
  IncidentOpsService,
  type GovernanceCountersDto,
  type IncidentFeedItem,
} from "./incident-ops.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";

@Controller("rai")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
export class IncidentsGovernanceController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly incidentOps: IncidentOpsService,
  ) { }

  @Get("incidents/feed")
  async getIncidentsFeed(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<IncidentFeedItem[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new BadRequestException("companyId is missing");
    const l = Math.min(100, Math.max(1, parseInt(limit ?? "50", 10) || 50));
    const o = Math.max(0, parseInt(offset ?? "0", 10) || 0);
    return this.incidentOps.getIncidentsFeed(companyId, l, o);
  }

  @Post("incidents/:id/resolve")
  @UseInterceptors(IdempotencyInterceptor)
  async resolveIncident(
    @Param("id") id: string,
    @Body() body: { comment?: string },
  ): Promise<{ ok: boolean }> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new BadRequestException("companyId is missing");
    await this.incidentOps.resolveIncident(id, companyId, body?.comment ?? "");
    return { ok: true };
  }

  @Post("incidents/:id/runbook")
  @UseInterceptors(IdempotencyInterceptor)
  async executeRunbook(
    @Param("id") id: string,
    @Body() body: { action?: IncidentRunbookAction; comment?: string },
  ): Promise<{ ok: true; result: Record<string, unknown> }> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new BadRequestException("companyId is missing");
    if (
      body?.action !== IncidentRunbookAction.REQUIRE_HUMAN_REVIEW &&
      body?.action !== IncidentRunbookAction.ROLLBACK_CHANGE_REQUEST
    ) {
      throw new BadRequestException("Valid runbook action is required");
    }
    return this.incidentOps.executeRunbook({
      incidentId: id,
      companyId,
      action: body.action,
      comment: body.comment ?? "",
    });
  }

  @Get("governance/counters")
  async getGovernanceCounters(): Promise<GovernanceCountersDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) throw new BadRequestException("companyId is missing");
    return this.incidentOps.getGovernanceCounters(companyId);
  }
}
