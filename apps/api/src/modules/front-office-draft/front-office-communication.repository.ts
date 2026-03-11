import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  BackOfficeFarmAssignmentRecord,
  FrontOfficeChannel,
  FrontOfficeHandoffRecord,
  FrontOfficeHandoffStatus,
  FrontOfficeIntent,
  FrontOfficeThreadDeliveryStatus,
  FrontOfficeThreadMessageAuthorType,
  FrontOfficeThreadMessageKind,
  FrontOfficeMessageRecord,
  FrontOfficeThreadParticipantStateRecord,
  FrontOfficeThreadClassification,
  FrontOfficeThreadRecord,
} from "./front-office-draft.types";

@Injectable()
export class FrontOfficeCommunicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertThread(input: {
    companyId: string;
    threadKey: string;
    channel: FrontOfficeChannel;
    farmAccountId?: string | null;
    farmNameSnapshot?: string | null;
    representativeUserId?: string | null;
    representativeTelegramId?: string | null;
    threadExternalId?: string | null;
    dialogExternalId?: string | null;
    senderExternalId?: string | null;
    recipientExternalId?: string | null;
    route?: string | null;
    currentClassification?: FrontOfficeThreadClassification | null;
    currentOwnerRole?: string | null;
    currentHandoffStatus?: FrontOfficeHandoffStatus | null;
    lastDraftId?: string | null;
    lastMessageDirection?: "inbound" | "outbound" | null;
    lastMessagePreview?: string | null;
    lastMessageAt?: string | Date | null;
    messageCountIncrement?: number;
  }): Promise<FrontOfficeThreadRecord> {
    const existing = await this.prisma.frontOfficeThread.findFirst({
      where: { companyId: input.companyId, threadKey: input.threadKey },
    });

    const data: Prisma.FrontOfficeThreadUncheckedUpdateInput = {
      channel: input.channel,
      farmAccountId:
        input.farmAccountId !== undefined ? input.farmAccountId : undefined,
      farmNameSnapshot:
        input.farmNameSnapshot !== undefined ? input.farmNameSnapshot : undefined,
      representativeUserId:
        input.representativeUserId !== undefined
          ? input.representativeUserId
          : undefined,
      representativeTelegramId:
        input.representativeTelegramId !== undefined
          ? input.representativeTelegramId
          : undefined,
      threadExternalId: input.threadExternalId ?? null,
      dialogExternalId: input.dialogExternalId ?? null,
      senderExternalId: input.senderExternalId ?? null,
      recipientExternalId: input.recipientExternalId ?? null,
      route: input.route ?? null,
      currentClassification:
        input.currentClassification !== undefined ? input.currentClassification : undefined,
      currentOwnerRole:
        input.currentOwnerRole !== undefined ? input.currentOwnerRole : undefined,
      currentHandoffStatus:
        input.currentHandoffStatus !== undefined ? input.currentHandoffStatus : undefined,
      lastDraftId: input.lastDraftId !== undefined ? input.lastDraftId : undefined,
      lastMessageDirection:
        input.lastMessageDirection !== undefined ? input.lastMessageDirection : undefined,
      lastMessagePreview:
        input.lastMessagePreview !== undefined ? input.lastMessagePreview : undefined,
      lastMessageAt:
        input.lastMessageAt !== undefined && input.lastMessageAt !== null
          ? new Date(input.lastMessageAt)
          : input.lastMessageAt === null
            ? null
            : undefined,
      messageCount:
        typeof input.messageCountIncrement === "number"
          ? { increment: input.messageCountIncrement }
          : undefined,
    };

    if (!existing) {
      const created = await this.prisma.frontOfficeThread.create({
        data: {
          companyId: input.companyId,
          threadKey: input.threadKey,
          channel: input.channel,
          farmAccountId: input.farmAccountId ?? null,
          farmNameSnapshot: input.farmNameSnapshot ?? null,
          representativeUserId: input.representativeUserId ?? null,
          representativeTelegramId: input.representativeTelegramId ?? null,
          threadExternalId: input.threadExternalId ?? null,
          dialogExternalId: input.dialogExternalId ?? null,
          senderExternalId: input.senderExternalId ?? null,
          recipientExternalId: input.recipientExternalId ?? null,
          route: input.route ?? null,
          currentClassification: input.currentClassification ?? null,
          currentOwnerRole: input.currentOwnerRole ?? null,
          currentHandoffStatus: input.currentHandoffStatus ?? null,
          lastDraftId: input.lastDraftId ?? null,
          lastMessageDirection: input.lastMessageDirection ?? null,
          lastMessagePreview: input.lastMessagePreview ?? null,
          lastMessageAt: input.lastMessageAt ? new Date(input.lastMessageAt) : null,
          messageCount: input.messageCountIncrement ?? 0,
        } satisfies Prisma.FrontOfficeThreadUncheckedCreateInput,
      });
      return this.mapThread(created);
    }

    const updated = await this.prisma.frontOfficeThread.update({
      where: { id: existing.id },
      data,
    });
    return this.mapThread(updated);
  }

  async createMessage(input: {
    companyId: string;
    threadId: string;
    draftId?: string | null;
    auditLogId?: string | null;
    traceId?: string | null;
    channel: FrontOfficeChannel;
    direction: "inbound" | "outbound";
    messageText: string;
    sourceMessageId?: string | null;
    chatId?: string | null;
    route?: string | null;
    evidence?: any[] | null;
    metadata?: Record<string, any> | null;
    kind?: FrontOfficeThreadMessageKind;
    authorType?: FrontOfficeThreadMessageAuthorType;
    deliveryStatus?: FrontOfficeThreadDeliveryStatus;
  }): Promise<FrontOfficeMessageRecord> {
    const metadata = {
      ...(input.metadata ?? {}),
      kind: input.kind ?? input.metadata?.kind ?? "system_event",
      authorType: input.authorType ?? input.metadata?.authorType ?? "system",
      deliveryStatus:
        input.deliveryStatus ?? input.metadata?.deliveryStatus ?? "SKIPPED",
    };
    const created = await this.prisma.frontOfficeThreadMessage.create({
      data: {
        companyId: input.companyId,
        threadId: input.threadId,
        draftId: input.draftId ?? null,
        auditLogId: input.auditLogId ?? null,
        traceId: input.traceId ?? null,
        channel: input.channel,
        direction: input.direction,
        messageText: input.messageText,
        sourceMessageId: input.sourceMessageId ?? null,
        chatId: input.chatId ?? null,
        route: input.route ?? null,
        evidenceJson: input.evidence ?? null,
        metadataJson: metadata,
      },
    });

    return this.mapMessage(created);
  }

  async createHandoff(input: {
    companyId: string;
    threadId: string;
    draftId?: string | null;
    traceId?: string | null;
    targetOwnerRole?: string | null;
    sourceIntent: FrontOfficeIntent;
    status: FrontOfficeHandoffStatus;
    summary: string;
    ownerRoute?: string | null;
    nextAction?: string | null;
    ownerResultRef?: string | null;
    evidence?: any[] | null;
    operatorNotes?: FrontOfficeHandoffRecord["operatorNotes"];
  }): Promise<FrontOfficeHandoffRecord> {
    const created = await this.prisma.frontOfficeHandoffRecord.create({
      data: {
        companyId: input.companyId,
        threadId: input.threadId,
        draftId: input.draftId ?? null,
        traceId: input.traceId ?? null,
        targetOwnerRole: input.targetOwnerRole ?? null,
        sourceIntent: input.sourceIntent,
        status: input.status,
        summary: input.summary,
        ownerRoute: input.ownerRoute ?? null,
        nextAction: input.nextAction ?? null,
        ownerResultRef: input.ownerResultRef ?? null,
        evidenceJson: input.evidence ?? null,
        operatorNotesJson: input.operatorNotes ?? null,
      },
    });

    return this.mapHandoff(created);
  }

  async updateHandoff(
    companyId: string,
    handoffId: string,
    patch: {
      status?: FrontOfficeHandoffStatus;
      nextAction?: string | null;
      ownerResultRef?: string | null;
      rejectionReason?: string | null;
      claimedBy?: string | null;
      claimedAt?: string | Date | null;
      resolvedBy?: string | null;
      resolvedAt?: string | Date | null;
      operatorNotes?: FrontOfficeHandoffRecord["operatorNotes"];
    },
  ): Promise<FrontOfficeHandoffRecord> {
    const updated = await this.prisma.frontOfficeHandoffRecord.updateMany({
      where: { id: handoffId, companyId },
      data: {
        status: patch.status,
        nextAction: patch.nextAction !== undefined ? patch.nextAction : undefined,
        ownerResultRef:
          patch.ownerResultRef !== undefined ? patch.ownerResultRef : undefined,
        rejectionReason:
          patch.rejectionReason !== undefined ? patch.rejectionReason : undefined,
        claimedBy: patch.claimedBy !== undefined ? patch.claimedBy : undefined,
        claimedAt:
          patch.claimedAt !== undefined
            ? patch.claimedAt
              ? new Date(patch.claimedAt)
              : null
            : undefined,
        resolvedBy: patch.resolvedBy !== undefined ? patch.resolvedBy : undefined,
        resolvedAt:
          patch.resolvedAt !== undefined
            ? patch.resolvedAt
              ? new Date(patch.resolvedAt)
              : null
            : undefined,
        operatorNotesJson:
          patch.operatorNotes !== undefined ? patch.operatorNotes : undefined,
      },
    });

    if (updated.count !== 1) {
      throw new NotFoundException("Front-office handoff not found");
    }

    return this.getHandoff(companyId, handoffId);
  }

  async getHandoff(companyId: string, handoffId: string): Promise<FrontOfficeHandoffRecord> {
    const handoff = await this.prisma.frontOfficeHandoffRecord.findFirst({
      where: { id: handoffId, companyId },
    });

    if (!handoff) {
      throw new NotFoundException("Front-office handoff not found");
    }

    return this.mapHandoff(handoff);
  }

  async listHandoffs(
    companyId: string,
    params?: {
      status?: FrontOfficeHandoffStatus;
      targetOwnerRole?: string;
      take?: number;
    },
  ): Promise<FrontOfficeHandoffRecord[]> {
    const rows = await this.prisma.frontOfficeHandoffRecord.findMany({
      where: {
        companyId,
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.targetOwnerRole ? { targetOwnerRole: params.targetOwnerRole } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: params?.take ?? 100,
    });

    return rows.map((row) => this.mapHandoff(row));
  }

  async getThreadByKey(companyId: string, threadKey: string): Promise<FrontOfficeThreadRecord> {
    const thread = await this.prisma.frontOfficeThread.findFirst({
      where: { companyId, threadKey },
    });

    if (!thread) {
      throw new NotFoundException("Front-office thread not found");
    }

    return this.mapThread(thread);
  }

  async getThreadById(companyId: string, threadId: string): Promise<FrontOfficeThreadRecord> {
    const thread = await this.prisma.frontOfficeThread.findFirst({
      where: { companyId, id: threadId },
    });

    if (!thread) {
      throw new NotFoundException("Front-office thread not found");
    }

    return this.mapThread(thread);
  }

  async listThreads(
    companyId: string,
    params?: {
      currentHandoffStatus?: FrontOfficeHandoffStatus;
      farmAccountId?: string;
      farmAccountIds?: string[];
      boundOnly?: boolean;
      take?: number;
    },
  ): Promise<FrontOfficeThreadRecord[]> {
    const rows = await this.prisma.frontOfficeThread.findMany({
      where: {
        companyId,
        ...(params?.currentHandoffStatus
          ? { currentHandoffStatus: params.currentHandoffStatus }
          : {}),
        ...(params?.farmAccountId ? { farmAccountId: params.farmAccountId } : {}),
        ...(params?.farmAccountIds?.length
          ? { farmAccountId: { in: params.farmAccountIds } }
          : {}),
        ...(params?.boundOnly ? { farmAccountId: { not: null } } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: params?.take ?? 100,
    });

    return rows.map((row) => this.mapThread(row));
  }

  async listMessages(companyId: string, threadId: string): Promise<FrontOfficeMessageRecord[]> {
    const rows = await this.prisma.frontOfficeThreadMessage.findMany({
      where: { companyId, threadId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    return rows.map((row) => this.mapMessage(row));
  }

  async listMessagesForThreads(
    companyId: string,
    threadIds: string[],
  ): Promise<FrontOfficeMessageRecord[]> {
    if (threadIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.frontOfficeThreadMessage.findMany({
      where: { companyId, threadId: { in: threadIds } },
      orderBy: [{ threadId: "asc" }, { createdAt: "asc" }],
      take: 2000,
    });

    return rows.map((row) => this.mapMessage(row));
  }

  async listAssignments(
    companyId: string,
    params?: { userId?: string; status?: string; take?: number },
  ): Promise<BackOfficeFarmAssignmentRecord[]> {
    const rows = await this.prisma.backOfficeFarmAssignment.findMany({
      where: {
        companyId,
        ...(params?.userId ? { userId: params.userId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      include: {
        farmAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: params?.take ?? 200,
    });

    return rows.map((row) => this.mapAssignment(row));
  }

  async createAssignment(input: {
    companyId: string;
    userId: string;
    farmAccountId: string;
    status?: string;
    priority?: number;
  }): Promise<BackOfficeFarmAssignmentRecord> {
    const created = await this.prisma.backOfficeFarmAssignment.upsert({
      where: {
        back_office_farm_assignment_unique: {
          companyId: input.companyId,
          userId: input.userId,
          farmAccountId: input.farmAccountId,
        },
      },
      create: {
        companyId: input.companyId,
        userId: input.userId,
        farmAccountId: input.farmAccountId,
        status: input.status ?? "ACTIVE",
        priority: input.priority ?? 0,
      },
      update: {
        status: input.status ?? "ACTIVE",
        priority: input.priority ?? 0,
      },
      include: {
        farmAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapAssignment(created);
  }

  async deleteAssignment(companyId: string, assignmentId: string): Promise<void> {
    const deleted = await this.prisma.backOfficeFarmAssignment.deleteMany({
      where: { id: assignmentId, companyId },
    });

    if (deleted.count !== 1) {
      throw new NotFoundException("Back-office farm assignment not found");
    }
  }

  async findAssignment(
    companyId: string,
    userId: string,
    farmAccountId: string,
  ): Promise<BackOfficeFarmAssignmentRecord | null> {
    const row = await this.prisma.backOfficeFarmAssignment.findFirst({
      where: { companyId, userId, farmAccountId, status: "ACTIVE" },
      include: {
        farmAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return row ? this.mapAssignment(row) : null;
  }

  async upsertParticipantState(input: {
    companyId: string;
    threadId: string;
    userId: string;
    lastReadMessageId?: string | null;
    lastReadAt?: string | Date | null;
  }): Promise<FrontOfficeThreadParticipantStateRecord> {
    const row = await this.prisma.frontOfficeThreadParticipantState.upsert({
      where: {
        front_office_participant_state_unique: {
          companyId: input.companyId,
          threadId: input.threadId,
          userId: input.userId,
        },
      },
      create: {
        companyId: input.companyId,
        threadId: input.threadId,
        userId: input.userId,
        lastReadMessageId: input.lastReadMessageId ?? null,
        lastReadAt: input.lastReadAt ? new Date(input.lastReadAt) : null,
      },
      update: {
        lastReadMessageId:
          input.lastReadMessageId !== undefined
            ? input.lastReadMessageId
            : undefined,
        lastReadAt:
          input.lastReadAt !== undefined
            ? input.lastReadAt
              ? new Date(input.lastReadAt)
              : null
            : undefined,
      },
    });

    return this.mapParticipantState(row);
  }

  async listParticipantStates(
    companyId: string,
    userId: string,
    threadIds?: string[],
  ): Promise<FrontOfficeThreadParticipantStateRecord[]> {
    const rows = await this.prisma.frontOfficeThreadParticipantState.findMany({
      where: {
        companyId,
        userId,
        ...(threadIds?.length ? { threadId: { in: threadIds } } : {}),
      },
    });

    return rows.map((row) => this.mapParticipantState(row));
  }

  private mapThread(row: any): FrontOfficeThreadRecord {
    return {
      id: row.id,
      companyId: row.companyId,
      threadKey: row.threadKey,
      channel: row.channel,
      farmAccountId: row.farmAccountId ?? null,
      farmNameSnapshot: row.farmNameSnapshot ?? null,
      representativeUserId: row.representativeUserId ?? null,
      representativeTelegramId: row.representativeTelegramId ?? null,
      threadExternalId: row.threadExternalId ?? null,
      dialogExternalId: row.dialogExternalId ?? null,
      senderExternalId: row.senderExternalId ?? null,
      recipientExternalId: row.recipientExternalId ?? null,
      route: row.route ?? null,
      currentClassification: row.currentClassification ?? null,
      currentOwnerRole: row.currentOwnerRole ?? null,
      currentHandoffStatus: row.currentHandoffStatus ?? null,
      lastDraftId: row.lastDraftId ?? null,
      lastMessageDirection: row.lastMessageDirection ?? null,
      lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
      lastMessagePreview: row.lastMessagePreview ?? null,
      messageCount: row.messageCount ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapMessage(row: any): FrontOfficeMessageRecord {
    const metadata =
      row.metadataJson && typeof row.metadataJson === "object"
        ? row.metadataJson
        : null;
    return {
      id: row.id,
      companyId: row.companyId,
      threadId: row.threadId,
      draftId: row.draftId ?? null,
      auditLogId: row.auditLogId ?? null,
      traceId: row.traceId ?? null,
      channel: row.channel,
      direction: row.direction,
      messageText: row.messageText,
      sourceMessageId: row.sourceMessageId ?? null,
      chatId: row.chatId ?? null,
      route: row.route ?? null,
      evidence: Array.isArray(row.evidenceJson) ? row.evidenceJson : row.evidenceJson ?? null,
      metadata,
      kind: (metadata?.kind as FrontOfficeThreadMessageKind | undefined) ?? "system_event",
      authorType:
        (metadata?.authorType as FrontOfficeThreadMessageAuthorType | undefined) ??
        "system",
      deliveryStatus:
        (metadata?.deliveryStatus as FrontOfficeThreadDeliveryStatus | undefined) ??
        "SKIPPED",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapHandoff(row: any): FrontOfficeHandoffRecord {
    return {
      id: row.id,
      companyId: row.companyId,
      threadId: row.threadId,
      draftId: row.draftId ?? null,
      traceId: row.traceId ?? null,
      targetOwnerRole: row.targetOwnerRole ?? null,
      sourceIntent: row.sourceIntent,
      status: row.status,
      summary: row.summary,
      ownerRoute: row.ownerRoute ?? null,
      nextAction: row.nextAction ?? null,
      ownerResultRef: row.ownerResultRef ?? null,
      rejectionReason: row.rejectionReason ?? null,
      claimedBy: row.claimedBy ?? null,
      claimedAt: row.claimedAt ? row.claimedAt.toISOString() : null,
      resolvedBy: row.resolvedBy ?? null,
      resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
      evidence: Array.isArray(row.evidenceJson) ? row.evidenceJson : row.evidenceJson ?? null,
      operatorNotes: Array.isArray(row.operatorNotesJson)
        ? row.operatorNotesJson
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapAssignment(row: any): BackOfficeFarmAssignmentRecord {
    return {
      id: row.id,
      companyId: row.companyId,
      userId: row.userId,
      farmAccountId: row.farmAccountId,
      farmName: row.farmAccount?.name ?? null,
      status: row.status,
      priority: row.priority ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapParticipantState(row: any): FrontOfficeThreadParticipantStateRecord {
    return {
      id: row.id,
      companyId: row.companyId,
      threadId: row.threadId,
      userId: row.userId,
      lastReadMessageId: row.lastReadMessageId ?? null,
      lastReadAt: row.lastReadAt ? row.lastReadAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
