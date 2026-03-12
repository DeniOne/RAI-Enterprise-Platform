import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { PendingActionStatus, UserRole } from "@rai/prisma-client";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { Roles } from "../../shared/auth/roles.decorator";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { PendingActionService } from "./security/pending-action.service";

interface CurrentActor {
  id?: string;
  userId?: string;
  companyId?: string;
  role?: UserRole | string;
}

export interface PendingActionDto {
  id: string;
  traceId: string;
  toolName: string;
  riskLevel: string;
  status: PendingActionStatus;
  requestedByUserId: string | null;
  approvedFirstBy: string | null;
  approvedFinalBy: string | null;
  createdAt: string;
  expiresAt: string;
  payloadPreview: string;
}

@Controller("rai/pending-actions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
export class PendingActionsController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly pendingActionService: PendingActionService,
  ) {}

  @Get()
  async list(
    @Query("status") status?: PendingActionStatus,
    @Query("limit") limit?: string,
    @Query("traceId") traceId?: string,
  ): Promise<PendingActionDto[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("companyId is missing");
    }
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? "20", 10) || 20));
    const rows = await this.pendingActionService.list(companyId, {
      ...(status ? { status } : {}),
      ...(traceId ? { traceId } : {}),
      limit: parsedLimit,
    });
    return rows.map((row) => ({
      id: row.id,
      traceId: row.traceId,
      toolName: row.toolName,
      riskLevel: row.riskLevel,
      status: row.status,
      requestedByUserId: row.requestedByUserId ?? null,
      approvedFirstBy: row.approvedFirstBy ?? null,
      approvedFinalBy: row.approvedFinalBy ?? null,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      payloadPreview: this.toPayloadPreview(row.payload),
    }));
  }

  @Post(":id/approve-first")
  @UseInterceptors(IdempotencyInterceptor)
  async approveFirst(
    @Param("id") id: string,
    @CurrentUser() user: CurrentActor,
  ): Promise<PendingActionDto> {
    const companyId = this.tenantContext.getCompanyId();
    const userId = String(user.userId ?? user.id ?? "");
    if (!companyId || !userId) {
      throw new BadRequestException("Security Context is incomplete");
    }
    const updated = await this.pendingActionService.approveFirst(
      id,
      companyId,
      userId,
      (user.role as UserRole) ?? UserRole.MANAGER,
    );
    return this.toDto(updated);
  }

  @Post(":id/approve-final")
  @UseInterceptors(IdempotencyInterceptor)
  async approveFinal(
    @Param("id") id: string,
    @CurrentUser() user: CurrentActor,
  ): Promise<PendingActionDto> {
    const companyId = this.tenantContext.getCompanyId();
    const userId = String(user.userId ?? user.id ?? "");
    const role = (user.role as UserRole) ?? UserRole.MANAGER;
    if (!companyId || !userId) {
      throw new BadRequestException("Security Context is incomplete");
    }
    if (role !== UserRole.ADMIN && role !== UserRole.CEO) {
      throw new ForbiddenException("FINAL_APPROVAL_REQUIRES_ADMIN_OR_CEO");
    }
    const updated = await this.pendingActionService.approveFinal(
      id,
      companyId,
      userId,
      role,
    );
    return this.toDto(updated);
  }

  @Post(":id/reject")
  @UseInterceptors(IdempotencyInterceptor)
  async reject(
    @Param("id") id: string,
    @Body() _body: { reason?: string },
  ): Promise<PendingActionDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("companyId is missing");
    }
    const updated = await this.pendingActionService.reject(id, companyId);
    return this.toDto(updated);
  }

  private toDto(row: {
    id: string;
    traceId: string;
    toolName: string;
    riskLevel: string;
    status: PendingActionStatus;
    requestedByUserId: string | null;
    approvedFirstBy: string | null;
    approvedFinalBy: string | null;
    createdAt: Date;
    expiresAt: Date;
    payload: unknown;
  }): PendingActionDto {
    return {
      id: row.id,
      traceId: row.traceId,
      toolName: row.toolName,
      riskLevel: row.riskLevel,
      status: row.status,
      requestedByUserId: row.requestedByUserId,
      approvedFirstBy: row.approvedFirstBy,
      approvedFinalBy: row.approvedFinalBy,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      payloadPreview: this.toPayloadPreview(row.payload),
    };
  }

  private toPayloadPreview(payload: unknown): string {
    try {
      const serialized = JSON.stringify(payload);
      return serialized.length > 240 ? `${serialized.slice(0, 237)}...` : serialized;
    } catch {
      return "[unserializable]";
    }
  }
}
