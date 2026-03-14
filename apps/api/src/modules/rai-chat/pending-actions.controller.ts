import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
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
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { RaiToolName } from "../../shared/rai-chat/rai-tools.types";

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
  private readonly logger = new Logger(PendingActionsController.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly pendingActionService: PendingActionService,
    private readonly raiToolsRegistry: RaiToolsRegistry,
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
    await this.executeApprovedAction(updated, userId, role);
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

  @Post(":id/execute")
  @UseInterceptors(IdempotencyInterceptor)
  async execute(
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
      throw new ForbiddenException("EXECUTION_REQUIRES_ADMIN_OR_CEO");
    }
    const action = await this.pendingActionService.get(id, companyId);
    if (action.status !== PendingActionStatus.APPROVED_FINAL) {
      throw new BadRequestException(
        `PENDING_ACTION_INVALID_STATE: expected APPROVED_FINAL, got ${action.status}`,
      );
    }
    await this.executeApprovedAction(action, userId, role);
    return this.toDto(action);
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

  private async executeApprovedAction(
    action: {
      id: string;
      companyId: string;
      traceId: string;
      toolName: string;
      payload: unknown;
    },
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const toolName = this.parseToolName(action.toolName);
    const payload =
      action.payload && typeof action.payload === "object"
        ? (action.payload as Record<string, unknown>)
        : {};
    try {
      await this.raiToolsRegistry.execute(toolName, payload, {
        companyId: action.companyId,
        traceId: action.traceId,
        userId,
        userRole: role,
        userConfirmed: true,
        approvedPendingActionId: action.id,
        agentRole: "governance_executor",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      this.logger.error(
        `PENDING_ACTION_EXECUTION_FAILED actionId=${action.id} tool=${action.toolName} traceId=${action.traceId} reason=${message}`,
      );
      throw new BadRequestException(
        `PENDING_ACTION_EXECUTION_FAILED: ${message}`,
      );
    }
  }

  private parseToolName(toolName: string): RaiToolName {
    if ((Object.values(RaiToolName) as string[]).includes(toolName)) {
      return toolName as RaiToolName;
    }
    throw new BadRequestException(`UNKNOWN_PENDING_ACTION_TOOL: ${toolName}`);
  }
}
