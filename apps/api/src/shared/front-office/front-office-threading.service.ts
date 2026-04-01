import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@rai/prisma-client";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotificationService } from "../../modules/telegram/telegram-notification.service";
import {
  BackOfficeFarmAssignmentRecord,
  FrontOfficeDraftAnchor,
  FrontOfficeDraftRecord,
  FrontOfficeIntakeInput,
  FrontOfficeManagerFarmInboxRecord,
  FrontOfficeThreadListItemRecord,
  FrontOfficeThreadRecord,
} from "../../modules/front-office-draft/front-office-draft.types";
import { FrontOfficeCommunicationRepository } from "./front-office-communication.repository";
import { FrontOfficeOutboundService } from "./front-office-outbound.service";

@Injectable()
export class FrontOfficeThreadingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationRepository: FrontOfficeCommunicationRepository,
    private readonly outboundService: FrontOfficeOutboundService,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async getThread(companyId: string, threadKey: string) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    const messages = await this.communicationRepository.listMessages(companyId, thread.id);

    return {
      thread,
      threadKey,
      messages,
      drafts: [],
      handoffs: [],
    };
  }

  async getThreadForViewer(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    threadKey: string,
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    await this.assertThreadAccess(companyId, viewer, thread);
    const messages = await this.communicationRepository.listMessages(companyId, thread.id);

    return {
      thread,
      threadKey,
      messages,
      drafts: [],
      handoffs: [],
    };
  }

  async listThreads(companyId: string) {
    return this.communicationRepository.listThreads(companyId);
  }

  async listThreadsForViewer(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
  ) {
    if (viewer.role !== UserRole.FRONT_OFFICE_USER) {
      return this.communicationRepository.listThreads(companyId);
    }

    if (!viewer.accountId) {
      throw new ForbiddenException("Front-office user is not bound to counterparty");
    }

    return this.communicationRepository.listThreads(companyId, {
      farmAccountId: viewer.accountId,
      boundOnly: true,
      take: 200,
    });
  }

  async listMessages(companyId: string, threadKey: string) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    return this.communicationRepository.listMessages(companyId, thread.id);
  }

  async listMessagesForViewer(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    threadKey: string,
    options?: {
      afterId?: string;
      limit?: number;
    },
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    await this.assertThreadAccess(companyId, viewer, thread);
    return this.communicationRepository.listMessages(companyId, thread.id, options);
  }

  async listMessagesWithCursor(
    companyId: string,
    threadKey: string,
    options?: {
      afterId?: string;
      limit?: number;
    },
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    return this.communicationRepository.listMessages(companyId, thread.id, options);
  }

  async listManagerFarms(
    companyId: string,
    userId: string,
  ): Promise<FrontOfficeManagerFarmInboxRecord[]> {
    const assignments = await this.communicationRepository.listAssignments(companyId, {
      userId,
      status: "ACTIVE",
    });
    if (assignments.length === 0) {
      return [];
    }

    const farmIds = assignments.map((item) => item.farmAccountId);
    const threads = await this.communicationRepository.listThreads(companyId, {
      farmAccountIds: farmIds,
      boundOnly: true,
      take: 500,
    });
    const threadItems = await this.buildThreadList(companyId, userId, threads);
    const byFarmId = new Map<string, FrontOfficeManagerFarmInboxRecord>();

    for (const assignment of assignments) {
      byFarmId.set(assignment.farmAccountId, {
        farmAccountId: assignment.farmAccountId,
        farmName: assignment.farmName ?? assignment.farmAccountId,
        unreadCount: 0,
        threadCount: 0,
        lastMessagePreview: null,
        lastMessageAt: null,
        lastHandoffStatus: null,
        needsHumanAction: false,
      });
    }

    for (const item of threadItems) {
      if (!item.farmAccountId) {
        continue;
      }
      const current = byFarmId.get(item.farmAccountId);
      if (!current) {
        continue;
      }

      current.unreadCount += item.unreadCount;
      current.threadCount += 1;
      current.needsHumanAction = current.needsHumanAction || item.needsHumanAction;
      if (
        !current.lastMessageAt ||
        (item.lastMessageAt && item.lastMessageAt > current.lastMessageAt)
      ) {
        current.lastMessageAt = item.lastMessageAt;
        current.lastMessagePreview = item.lastMessagePreview;
        current.lastHandoffStatus = item.currentHandoffStatus;
      }
    }

    return Array.from(byFarmId.values()).sort((left, right) => {
      const rightTs = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
      const leftTs = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      return rightTs - leftTs;
    });
  }

  async listManagerFarmThreads(
    companyId: string,
    userId: string,
    farmAccountId: string,
  ): Promise<FrontOfficeThreadListItemRecord[]> {
    await this.assertAssignment(companyId, userId, farmAccountId);
    const threads = await this.communicationRepository.listThreads(companyId, {
      farmAccountId,
      boundOnly: true,
      take: 200,
    });

    return this.buildThreadList(companyId, userId, threads);
  }

  async replyToThread(
    companyId: string,
    user: { id: string; role?: string; accountId?: string | null },
    threadKey: string,
    messageText: string,
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    if (!thread.farmAccountId) {
      throw new ForbiddenException("Thread is not bound to a farm account");
    }
    await this.assertThreadAccess(companyId, user, thread);

    const outbound = await this.outboundService.sendToThread({
      companyId,
      thread,
      messageText,
      kind: "manager_reply",
      authorType: "back_office_operator",
      route: "/telegram/workspace/farms",
      currentOwnerRole: user.role ?? thread.currentOwnerRole,
      currentHandoffStatus: thread.currentHandoffStatus,
      actorUserId: user.id,
      actorUserRole: user.role ?? null,
    });
    const deliveryStatus = this.mapReplyStatusToDeliveryStatus(outbound.replyStatus);

    return {
      thread: outbound.thread,
      message: {
        id: outbound.message.id,
        createdAt: outbound.message.createdAt,
        channel: outbound.thread.channel,
        direction: "outbound",
        messageText,
        deliveryStatus,
      },
      delivery: outbound.delivery,
      deliveryStatus,
      channel: outbound.thread.channel,
      messageId: outbound.message.id,
      createdAt: outbound.message.createdAt,
    };
  }

  async markThreadRead(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    threadKey: string,
    lastMessageId?: string,
  ) {
    const thread = await this.communicationRepository.getThreadByKey(companyId, threadKey);
    if (!thread.farmAccountId) {
      throw new ForbiddenException("Thread is not bound to a farm account");
    }
    await this.assertThreadAccess(companyId, viewer, thread);

    const messages = await this.communicationRepository.listMessages(companyId, thread.id);
    const targetMessage =
      (lastMessageId
        ? messages.find((item) => item.id === lastMessageId)
        : messages.at(-1)) ?? null;

    return this.communicationRepository.upsertParticipantState({
      companyId,
      threadId: thread.id,
      userId: viewer.id,
      lastReadMessageId: targetMessage?.id ?? null,
      lastReadAt: targetMessage?.createdAt ?? new Date().toISOString(),
    });
  }

  async listAssignments(companyId: string) {
    return this.communicationRepository.listAssignments(companyId);
  }

  async createAssignment(
    companyId: string,
    input: {
      userId: string;
      farmAccountId: string;
      status?: string;
      priority?: number;
    },
  ): Promise<BackOfficeFarmAssignmentRecord> {
    const [user, farm] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: input.userId, companyId },
        select: { id: true },
      }),
      this.prisma.account.findFirst({
        where: { id: input.farmAccountId, companyId },
        select: { id: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`User ${input.userId} not found`);
    }
    if (!farm) {
      throw new NotFoundException(`Farm ${input.farmAccountId} not found`);
    }

    return this.communicationRepository.createAssignment({
      companyId,
      userId: input.userId,
      farmAccountId: input.farmAccountId,
      status: input.status,
      priority: input.priority,
    });
  }

  async deleteAssignment(companyId: string, assignmentId: string) {
    await this.communicationRepository.deleteAssignment(companyId, assignmentId);
    return { success: true };
  }

  async syncInboundThreadState(params: {
    companyId: string;
    draft: FrontOfficeDraftRecord;
    input: FrontOfficeIntakeInput;
    traceId: string;
    actorUserId?: string;
    auditLogId?: string | null;
    classification?: string | null;
    targetOwnerRole?: string | null;
    evidence?: any[] | null;
  }): Promise<{
    thread: FrontOfficeThreadRecord;
    message: {
      id: string;
      createdAt: string;
    };
  }> {
    const binding = await this.resolveThreadBinding(
      params.companyId,
      params.actorUserId,
      params.draft.anchor,
      params.input,
    );
    const thread = await this.communicationRepository.upsertThread({
      companyId: params.companyId,
      threadKey: String(params.draft.payload.threadKey),
      channel: params.input.channel,
      farmAccountId: binding.farmAccountId,
      farmNameSnapshot: binding.farmNameSnapshot,
      representativeUserId: binding.representativeUserId,
      representativeTelegramId: binding.representativeTelegramId,
      threadExternalId: params.input.threadExternalId ?? null,
      dialogExternalId: params.input.dialogExternalId ?? null,
      senderExternalId: params.input.senderExternalId ?? null,
      recipientExternalId: params.input.recipientExternalId ?? null,
      route: params.input.route ?? null,
      currentClassification: (params.classification as any) ?? null,
      currentOwnerRole: params.targetOwnerRole ?? null,
      currentHandoffStatus:
        (params.draft.payload.commitResult?.handoffStatus as any) ?? null,
      lastDraftId: params.draft.id,
      lastMessageDirection: params.input.direction ?? "inbound",
      lastMessagePreview: String(params.input.messageText).slice(0, 240),
      lastMessageAt: new Date(),
      messageCountIncrement: 1,
    });

    const message = await this.communicationRepository.createMessage({
      companyId: params.companyId,
      threadId: thread.id,
      draftId: params.draft.id,
      auditLogId: params.auditLogId ?? null,
      traceId: params.traceId,
      channel: params.input.channel,
      direction: params.input.direction ?? "inbound",
      messageText: params.input.messageText,
      sourceMessageId: params.input.sourceMessageId ?? null,
      chatId: params.input.chatId ?? null,
      route: params.input.route ?? null,
      evidence: params.evidence ?? null,
      kind: "client_message",
      authorType: "farm_representative",
      deliveryStatus: "RECEIVED",
      metadata: {
        classification: params.classification ?? null,
        targetOwnerRole: params.targetOwnerRole ?? null,
        farmAccountId: binding.farmAccountId,
      },
    });

    return {
      thread,
      message: {
        id: message.id,
        createdAt: message.createdAt,
      },
    };
  }

  async syncSystemThreadState(
    companyId: string,
    draft: FrontOfficeDraftRecord,
    params: {
      messageText: string;
      auditLogId?: string | null;
      metadata?: Record<string, any>;
      handoffStatus?: string | null;
      targetOwnerRole?: string | null;
      ownerResultRef?: string | null;
    },
  ) {
    const existingThread = await this.communicationRepository
      .getThreadByKey(companyId, String(draft.payload.threadKey))
      .catch(() => null);
    const anchorBinding =
      existingThread?.farmAccountId ||
      existingThread?.farmNameSnapshot ||
      existingThread?.representativeUserId ||
      existingThread?.representativeTelegramId
        ? null
        : await this.resolveBindingFromAnchor(companyId, draft.anchor);
    const thread = await this.communicationRepository.upsertThread({
      companyId,
      threadKey: String(draft.payload.threadKey),
      channel: draft.payload.channel,
      farmAccountId: existingThread?.farmAccountId ?? anchorBinding?.farmAccountId ?? null,
      farmNameSnapshot:
        existingThread?.farmNameSnapshot ?? anchorBinding?.farmNameSnapshot ?? null,
      representativeUserId:
        existingThread?.representativeUserId ?? anchorBinding?.representativeUserId ?? null,
      representativeTelegramId:
        existingThread?.representativeTelegramId ??
        anchorBinding?.representativeTelegramId ??
        null,
      threadExternalId: draft.payload.threadExternalId ?? existingThread?.threadExternalId ?? null,
      dialogExternalId: draft.payload.dialogExternalId ?? existingThread?.dialogExternalId ?? null,
      senderExternalId: draft.payload.senderExternalId ?? existingThread?.senderExternalId ?? null,
      recipientExternalId: draft.payload.recipientExternalId ?? existingThread?.recipientExternalId ?? null,
      route: draft.payload.route ?? null,
      currentClassification: (draft.payload.classification as any) ?? null,
      currentOwnerRole: params.targetOwnerRole ?? draft.payload.targetOwnerRole ?? null,
      currentHandoffStatus: (params.handoffStatus as any) ?? null,
      lastDraftId: draft.id,
      lastMessageDirection: "outbound",
      lastMessagePreview: params.messageText.slice(0, 240),
      lastMessageAt: new Date(),
    });

    await this.communicationRepository.createMessage({
      companyId,
      threadId: thread.id,
      draftId: draft.id,
      auditLogId: params.auditLogId ?? null,
      traceId: draft.payload.traceId ?? null,
      channel: draft.payload.channel,
      direction: "outbound",
      messageText: params.messageText,
      sourceMessageId: draft.payload.sourceMessageId ?? null,
      chatId: draft.payload.chatId ?? null,
      route: draft.payload.route ?? null,
      evidence: draft.evidence,
      kind: "system_event",
      authorType: "system",
      deliveryStatus: "SKIPPED",
      metadata: {
        ...(params.metadata ?? {}),
        ownerResultRef: params.ownerResultRef ?? null,
      },
    });
  }

  async notifyAssignedManagers(thread: FrontOfficeThreadRecord) {
    if (!thread.farmAccountId) {
      return;
    }

    const assignmentModel = (this.prisma as any).backOfficeFarmAssignment;
    if (!assignmentModel?.findMany) {
      return;
    }

    try {
      const rows = await assignmentModel.findMany({
        where: {
          companyId: thread.companyId,
          farmAccountId: thread.farmAccountId,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              telegramId: true,
            },
          },
        },
      });
      const telegramIds = rows
        .map((item: any) => item.user?.telegramId)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0);

      if (telegramIds.length === 0) {
        return;
      }

      await this.telegramNotificationService.notifyFrontOfficeThread({
        telegramIds,
        farmName: thread.farmNameSnapshot ?? "Хозяйство",
        threadKey: thread.threadKey,
        preview: thread.lastMessagePreview ?? "Новое сообщение во Front Office",
      });
    } catch {
      // Best-effort notification path. Do not fail ingress on manager push errors.
    }
  }

  private async resolveBindingFromAnchor(
    companyId: string,
    anchor: FrontOfficeDraftAnchor,
  ) {
    let farmAccountId: string | null = null;
    let farmNameSnapshot: string | null = null;

    if (anchor.farmRef) {
      const farm = await this.resolveFarmAccount(companyId, anchor.farmRef);
      if (farm) {
        farmAccountId = farm.id;
        farmNameSnapshot = farm.name;
      }
    }

    if (!farmAccountId && anchor.fieldId) {
      const field = await this.prisma.field.findFirst({
        where: { id: anchor.fieldId, companyId },
        select: {
          clientId: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });
      if (field?.clientId) {
        farmAccountId = field.clientId;
        farmNameSnapshot = field.client?.name ?? null;
      }
    }

    return {
      farmAccountId,
      farmNameSnapshot,
      representativeUserId: null,
      representativeTelegramId: null,
    };
  }

  private async buildThreadList(
    companyId: string,
    userId: string,
    threads: FrontOfficeThreadRecord[],
  ): Promise<FrontOfficeThreadListItemRecord[]> {
    if (threads.length === 0) {
      return [];
    }

    const [states, messages] = await Promise.all([
      this.communicationRepository.listParticipantStates(
        companyId,
        userId,
        threads.map((item) => item.id),
      ),
      this.communicationRepository.listMessagesForThreads(
        companyId,
        threads.map((item) => item.id),
      ),
    ]);

    const stateByThreadId = new Map(states.map((item) => [item.threadId, item]));
    const messagesByThreadId = new Map<string, typeof messages>();
    for (const message of messages) {
      const current = messagesByThreadId.get(message.threadId) ?? [];
      current.push(message);
      messagesByThreadId.set(message.threadId, current);
    }

    return threads.map((thread) => {
      const state = stateByThreadId.get(thread.id);
      const threadMessages = messagesByThreadId.get(thread.id) ?? [];
      const lastReadAtTs = state?.lastReadAt
        ? new Date(state.lastReadAt).getTime()
        : null;
      const unreadCount = threadMessages.filter((message) => {
        if (message.direction !== "inbound") {
          return false;
        }
        if (lastReadAtTs === null) {
          return true;
        }
        return new Date(message.createdAt).getTime() > lastReadAtTs;
      }).length;

      return {
        threadKey: thread.threadKey,
        threadId: thread.id,
        farmAccountId: thread.farmAccountId,
        farmNameSnapshot: thread.farmNameSnapshot,
        representativeTelegramId: thread.representativeTelegramId,
        lastMessagePreview: thread.lastMessagePreview,
        lastMessageAt: thread.lastMessageAt,
        lastMessageDirection: thread.lastMessageDirection,
        currentHandoffStatus: thread.currentHandoffStatus,
        currentOwnerRole: thread.currentOwnerRole,
        unreadCount,
        needsHumanAction: this.threadNeedsHumanAction(thread),
      };
    });
  }

  private async assertAssignment(
    companyId: string,
    userId: string,
    farmAccountId: string,
  ) {
    const assignment = await this.communicationRepository.findAssignment(
      companyId,
      userId,
      farmAccountId,
    );

    if (!assignment) {
      throw new ForbiddenException(
        `User ${userId} is not assigned to farm ${farmAccountId}`,
      );
    }

    return assignment;
  }

  private async assertThreadAccess(
    companyId: string,
    viewer: { id: string; role?: string; accountId?: string | null },
    thread: FrontOfficeThreadRecord,
  ) {
    if (!thread.farmAccountId) {
      return;
    }

    if (
      viewer.role === UserRole.ADMIN ||
      viewer.role === UserRole.CLIENT_ADMIN ||
      viewer.role === UserRole.CEO
    ) {
      return;
    }

    if (viewer.accountId && viewer.accountId === thread.farmAccountId) {
      return;
    }

    await this.assertAssignment(companyId, viewer.id, thread.farmAccountId);
  }

  private mapReplyStatusToDeliveryStatus(
    replyStatus: "NOT_SENT" | "SENT" | "SKIPPED" | "FAILED",
  ): "RECEIVED" | "SENT" | "SKIPPED" | "FAILED" {
    if (replyStatus === "SENT") {
      return "SENT";
    }
    if (replyStatus === "FAILED") {
      return "FAILED";
    }
    return "SKIPPED";
  }

  private async resolveThreadBinding(
    companyId: string,
    actorUserId: string | undefined,
    anchor: FrontOfficeDraftAnchor,
    input: FrontOfficeIntakeInput,
  ) {
    const existingThread = input.threadExternalId
      ? await this.communicationRepository
          .getThreadByKey(
            companyId,
            this.buildFallbackThreadKey(companyId, {
              channel: input.channel,
              threadExternalId: input.threadExternalId,
              dialogExternalId: input.dialogExternalId,
              senderExternalId: input.senderExternalId,
            }),
          )
          .catch(() => null)
      : null;

    let farmAccountId = existingThread?.farmAccountId ?? null;
    let farmNameSnapshot = existingThread?.farmNameSnapshot ?? null;
    let representativeUserId = existingThread?.representativeUserId ?? null;
    let representativeTelegramId =
      existingThread?.representativeTelegramId ??
      input.senderExternalId ??
      null;

    if (actorUserId && (input.direction ?? "inbound") === "inbound") {
      const user = await this.prisma.user.findFirst({
        where: { id: actorUserId, companyId },
        select: {
          id: true,
          telegramId: true,
          accountId: true,
          account: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (user) {
        representativeUserId = user.id;
        representativeTelegramId = user.telegramId ?? representativeTelegramId;
        if (user.accountId) {
          farmAccountId = user.accountId;
          farmNameSnapshot = user.account?.name ?? farmNameSnapshot;
        }
      }
    }

    if (!farmAccountId && anchor.farmRef) {
      const farm = await this.resolveFarmAccount(companyId, anchor.farmRef);
      if (farm) {
        farmAccountId = farm.id;
        farmNameSnapshot = farm.name;
      }
    }

    if (!farmAccountId && anchor.fieldId) {
      const field = await this.prisma.field.findFirst({
        where: { id: anchor.fieldId, companyId },
        select: {
          clientId: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });
      if (field?.clientId) {
        farmAccountId = field.clientId;
        farmNameSnapshot = field.client?.name ?? farmNameSnapshot;
      }
    }

    return {
      farmAccountId,
      farmNameSnapshot,
      representativeUserId,
      representativeTelegramId,
    };
  }

  private async resolveFarmAccount(companyId: string, farmRef: string) {
    return this.prisma.account.findFirst({
      where: {
        companyId,
        OR: [
          { id: farmRef },
          { name: { equals: farmRef, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private buildFallbackThreadKey(
    companyId: string,
    input: Pick<
      FrontOfficeIntakeInput,
      "channel" | "threadExternalId" | "dialogExternalId" | "senderExternalId"
    >,
  ) {
    return [
      companyId,
      input.channel,
      input.threadExternalId ??
        input.dialogExternalId ??
        input.senderExternalId ??
        "unknown",
    ].join(":");
  }

  private threadNeedsHumanAction(thread: FrontOfficeThreadRecord): boolean {
    return ["ROUTED", "PENDING_APPROVAL", "MANUAL_REQUIRED", "CLAIMED"].includes(
      thread.currentHandoffStatus ?? "",
    );
  }
}
