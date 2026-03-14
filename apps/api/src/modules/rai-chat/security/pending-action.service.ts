import { Injectable, NotFoundException } from "@nestjs/common";
import { PendingActionStatus, UserRole } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import type { RiskPolicyVerdict } from "./risk-policy-engine.service";

const EXPIRY_HOURS = 1;

export interface CreatePendingActionInput {
  companyId: string;
  traceId: string;
  toolName: string;
  payload: Record<string, unknown>;
  riskLevel: string;
  requestedByUserId?: string;
}

@Injectable()
export class PendingActionService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    companyId: string,
    params?: {
      status?: PendingActionStatus;
      limit?: number;
      traceId?: string;
    },
  ) {
    await this.syncExpired(companyId);
    const take = Math.min(100, Math.max(1, params?.limit ?? 20));
    return this.prisma.pendingAction.findMany({
      where: {
        companyId,
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.traceId ? { traceId: params.traceId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async create(input: CreatePendingActionInput) {
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);
    return this.prisma.pendingAction.create({
      data: {
        companyId: input.companyId,
        traceId: input.traceId,
        toolName: input.toolName,
        payload: input.payload as object,
        riskLevel: input.riskLevel,
        status: PendingActionStatus.PENDING,
        requestedByUserId: input.requestedByUserId ?? null,
        expiresAt,
      },
    });
  }

  async approveFirst(actionId: string, companyId: string, userId: string, _role: UserRole) {
    const action = await this.getByIdAndCompany(actionId, companyId);
    if (action.status !== PendingActionStatus.PENDING) {
      throw new Error(`PENDING_ACTION_INVALID_STATE: expected PENDING, got ${action.status}`);
    }
    await this.checkExpired(action);
    return this.prisma.pendingAction.update({
      where: { id: actionId },
      data: { status: PendingActionStatus.APPROVED_FIRST, approvedFirstBy: userId },
    });
  }

  async approveFinal(actionId: string, companyId: string, userId: string, _role: UserRole) {
    const action = await this.getByIdAndCompany(actionId, companyId);
    if (action.status !== PendingActionStatus.APPROVED_FIRST) {
      throw new Error(`PENDING_ACTION_INVALID_STATE: expected APPROVED_FIRST, got ${action.status}`);
    }
    await this.checkExpired(action);
    return this.prisma.pendingAction.update({
      where: { id: actionId },
      data: { status: PendingActionStatus.APPROVED_FINAL, approvedFinalBy: userId },
    });
  }

  async get(actionId: string, companyId: string) {
    return this.getByIdAndCompany(actionId, companyId);
  }

  async reject(actionId: string, companyId: string) {
    const action = await this.getByIdAndCompany(actionId, companyId);
    if (action.status !== PendingActionStatus.PENDING && action.status !== PendingActionStatus.APPROVED_FIRST) {
      throw new Error(`PENDING_ACTION_INVALID_STATE: cannot reject ${action.status}`);
    }
    return this.prisma.pendingAction.update({
      where: { id: actionId },
      data: { status: PendingActionStatus.REJECTED },
    });
  }

  async markExpiredIfNeeded(actionId: string, companyId: string) {
    const action = await this.getByIdAndCompany(actionId, companyId);
    if (action.status !== PendingActionStatus.PENDING && action.status !== PendingActionStatus.APPROVED_FIRST) {
      return action;
    }
    if (new Date() <= action.expiresAt) return action;
    return this.prisma.pendingAction.update({
      where: { id: actionId },
      data: { status: PendingActionStatus.EXPIRED },
    });
  }

  async syncExpired(companyId: string) {
    return this.prisma.pendingAction.updateMany({
      where: {
        companyId,
        status: {
          in: [
            PendingActionStatus.PENDING,
            PendingActionStatus.APPROVED_FIRST,
          ],
        },
        expiresAt: { lt: new Date() },
      },
      data: { status: PendingActionStatus.EXPIRED },
    });
  }

  /** Нужно ли два подтверждения для данного verdict. */
  requiresTwoPerson(verdict: RiskPolicyVerdict): boolean {
    return verdict === "REQUIRES_TWO_PERSON_APPROVAL";
  }

  /** Нужно ли хотя бы одно подтверждение (блокируем выполнение тула до подтверждения). */
  requiresConfirmation(verdict: RiskPolicyVerdict): boolean {
    return (
      verdict === "REQUIRES_USER_CONFIRMATION" ||
      verdict === "REQUIRES_DIRECTOR_CONFIRMATION" ||
      verdict === "REQUIRES_TWO_PERSON_APPROVAL"
    );
  }

  private async getByIdAndCompany(id: string, companyId: string) {
    const action = await this.prisma.pendingAction.findFirst({
      where: { id, companyId },
    });
    if (!action) throw new NotFoundException("PendingAction not found");
    return action;
  }

  private async checkExpired(action: { expiresAt: Date; status: PendingActionStatus }) {
    if (action.status !== PendingActionStatus.PENDING && action.status !== PendingActionStatus.APPROVED_FIRST) return;
    if (new Date() > action.expiresAt) {
      throw new Error("PENDING_ACTION_EXPIRED");
    }
  }
}
