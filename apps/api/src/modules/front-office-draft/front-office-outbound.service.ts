import { Injectable, NotFoundException } from "@nestjs/common";
import {
  FrontOfficeHandoffStatus,
  FrontOfficeReplyStatus,
  FrontOfficeThreadMessageAuthorType,
  FrontOfficeThreadMessageKind,
  FrontOfficeThreadRecord,
} from "./front-office-draft.types";
import { FrontOfficeCommunicationRepository } from "./front-office-communication.repository";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";

@Injectable()
export class FrontOfficeOutboundService {
  constructor(
    private readonly communicationRepository: FrontOfficeCommunicationRepository,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async sendToThread(params: {
    companyId: string;
    thread: FrontOfficeThreadRecord;
    messageText: string;
    kind: FrontOfficeThreadMessageKind;
    authorType: FrontOfficeThreadMessageAuthorType;
    draftId?: string | null;
    auditLogId?: string | null;
    traceId?: string | null;
    route?: string | null;
    evidence?: any[] | null;
    metadata?: Record<string, any> | null;
    currentOwnerRole?: string | null;
    currentHandoffStatus?: FrontOfficeHandoffStatus | null;
    actorUserId?: string | null;
    actorUserRole?: string | null;
    throwOnFailure?: boolean;
  }): Promise<{
    thread: FrontOfficeThreadRecord;
    message: {
      id: string;
      createdAt: string;
    };
    delivery: any;
    replyStatus: FrontOfficeReplyStatus;
  }> {
    const route = params.route ?? params.thread.route ?? null;
    const chatId = this.normalizeTelegramChatId(
      params.thread.threadExternalId ?? params.thread.representativeTelegramId,
      params.thread.representativeTelegramId,
    );

    let replyStatus: FrontOfficeReplyStatus = "SKIPPED";
    let delivery: any = null;
    let sourceMessageId: string | null = null;
    let transportError: Error | null = null;

    if (params.thread.channel === "telegram") {
      if (!chatId) {
        transportError = new NotFoundException(
          "Telegram chat is not available for this thread",
        );
      } else {
        try {
          delivery = await this.telegramNotificationService.sendFrontOfficeReply(
            chatId,
            params.messageText,
          );
          sourceMessageId =
            typeof delivery?.messageId === "string"
              ? delivery.messageId
              : delivery?.messageId?.toString?.() ?? null;
          replyStatus = "SENT";
        } catch (error) {
          transportError = error as Error;
          replyStatus = "FAILED";
        }
      }
    }

    const thread = await this.communicationRepository.upsertThread({
      companyId: params.companyId,
      threadKey: params.thread.threadKey,
      channel: params.thread.channel,
      farmAccountId: params.thread.farmAccountId,
      farmNameSnapshot: params.thread.farmNameSnapshot,
      representativeUserId: params.thread.representativeUserId,
      representativeTelegramId: params.thread.representativeTelegramId,
      threadExternalId: params.thread.threadExternalId,
      dialogExternalId: params.thread.dialogExternalId,
      senderExternalId: params.thread.senderExternalId,
      recipientExternalId: params.thread.recipientExternalId,
      route,
      currentClassification: params.thread.currentClassification,
      currentOwnerRole:
        params.currentOwnerRole !== undefined
          ? params.currentOwnerRole
          : params.thread.currentOwnerRole,
      currentHandoffStatus:
        params.currentHandoffStatus !== undefined
          ? params.currentHandoffStatus
          : params.thread.currentHandoffStatus,
      lastDraftId: params.draftId ?? params.thread.lastDraftId,
      lastMessageDirection: "outbound",
      lastMessagePreview: params.messageText.slice(0, 240),
      lastMessageAt: new Date(),
      messageCountIncrement: 1,
    });

    const message = await this.communicationRepository.createMessage({
      companyId: params.companyId,
      threadId: thread.id,
      draftId: params.draftId ?? null,
      auditLogId: params.auditLogId ?? null,
      traceId: params.traceId ?? null,
      channel: thread.channel,
      direction: "outbound",
      messageText: params.messageText,
      sourceMessageId,
      chatId,
      route,
      evidence: params.evidence ?? null,
      kind: params.kind,
      authorType: params.authorType,
      deliveryStatus:
        replyStatus === "SENT"
          ? "SENT"
          : replyStatus === "FAILED"
            ? "FAILED"
            : "SKIPPED",
      metadata: {
        ...(params.metadata ?? {}),
        deliveryGateway:
          params.thread.channel === "telegram" ? "telegram-bot-gateway" : "none",
        actorUserId: params.actorUserId ?? null,
        actorUserRole: params.actorUserRole ?? null,
      },
    });

    if (params.actorUserId) {
      await this.communicationRepository.upsertParticipantState({
        companyId: params.companyId,
        threadId: thread.id,
        userId: params.actorUserId,
        lastReadMessageId: message.id,
        lastReadAt: message.createdAt,
      });
    }

    if (transportError && params.throwOnFailure !== false) {
      throw transportError;
    }

    return {
      thread,
      message: {
        id: message.id,
        createdAt: message.createdAt,
      },
      delivery,
      replyStatus,
    };
  }

  private normalizeTelegramChatId(
    rawChatId?: string | null,
    fallbackChatId?: string | null,
  ): string | null {
    const candidate = rawChatId ?? fallbackChatId ?? null;
    if (!candidate) {
      return null;
    }
    if (candidate.startsWith("telegram:")) {
      return candidate.slice("telegram:".length);
    }
    return candidate;
  }
}
