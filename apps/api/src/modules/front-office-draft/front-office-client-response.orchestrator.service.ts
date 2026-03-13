import { Injectable } from "@nestjs/common";
import {
  RaiChatRequestDto,
  WorkspaceEntityKind,
  WorkspaceContextDto,
} from "../../shared/rai-chat/rai-chat.dto";
import { RaiChatService } from "../rai-chat/rai-chat.service";
import {
  FrontOfficeDraftRecord,
  FrontOfficeReplyStatus,
  FrontOfficeThreadRecord,
} from "./front-office-draft.types";
import { FrontOfficeOutboundService } from "../../shared/front-office/front-office-outbound.service";

@Injectable()
export class FrontOfficeClientResponseOrchestrator {
  constructor(
    private readonly raiChatService: RaiChatService,
    private readonly outboundService: FrontOfficeOutboundService,
  ) {}

  async sendAutoReply(params: {
    companyId: string;
    userId?: string;
    thread: FrontOfficeThreadRecord;
    draft: FrontOfficeDraftRecord;
    targetOwnerRole?: string | null;
    responseRisk: string;
  }): Promise<{
    replyStatus: FrontOfficeReplyStatus;
    autoReplyTraceId: string | null;
    ownerRole: string | null;
    messageId?: string;
    deliveredText?: string;
    failureReason?: string;
  }> {
    const request: RaiChatRequestDto = {
      message: String(params.draft.payload.messageText ?? "").trim(),
      threadId: params.thread.threadKey,
      clientTraceId: params.draft.payload.traceId ?? undefined,
      audience: "client_front_office",
      workspaceContext: this.buildWorkspaceContext(params.thread, params.draft),
    };

    const userId =
      params.thread.representativeUserId ?? params.userId ?? params.draft.userId;
    const response = await this.raiChatService.handleChat(
      request,
      params.companyId,
      userId,
    );
    const text = String(response.text ?? "").trim();
    if (!text) {
      return {
        replyStatus: "FAILED",
        autoReplyTraceId: response.traceId ?? null,
        ownerRole: params.targetOwnerRole ?? response.agentRole ?? null,
        failureReason: "EMPTY_RESPONSE",
      };
    }
    if (!response.evidence || response.evidence.length === 0) {
      return {
        replyStatus: "FAILED",
        autoReplyTraceId: response.traceId ?? null,
        ownerRole: params.targetOwnerRole ?? response.agentRole ?? null,
        failureReason: "NO_EVIDENCE",
      };
    }

    const outbound = await this.outboundService.sendToThread({
      companyId: params.companyId,
      thread: params.thread,
      draftId: params.draft.id,
      traceId: response.traceId ?? params.draft.payload.traceId ?? null,
      messageText: text,
      kind: "auto_reply",
      authorType: "rai",
      evidence: response.evidence,
      currentOwnerRole: params.targetOwnerRole ?? response.agentRole ?? null,
      metadata: {
        source: "rai_chat",
        audience: "client_front_office",
        responseRisk: params.responseRisk,
        ownerRole: params.targetOwnerRole ?? response.agentRole ?? null,
        runtimeGovernance: response.runtimeGovernance ?? null,
        fallbackUsed: response.fallbackUsed ?? null,
        evidenceCount: response.evidence.length,
      },
    });

    return {
      replyStatus: outbound.replyStatus,
      autoReplyTraceId: response.traceId ?? null,
      ownerRole: params.targetOwnerRole ?? response.agentRole ?? null,
      messageId: outbound.message.id,
      deliveredText: text,
    };
  }

  async sendClarification(params: {
    companyId: string;
    thread: FrontOfficeThreadRecord;
    draft: FrontOfficeDraftRecord;
    missingContext: string[];
    targetOwnerRole?: string | null;
  }): Promise<{
    replyStatus: FrontOfficeReplyStatus;
    messageId?: string;
    text: string;
  }> {
    const text = this.buildClarificationText(
      params.missingContext,
      params.targetOwnerRole ?? null,
    );
    const outbound = await this.outboundService.sendToThread({
      companyId: params.companyId,
      thread: params.thread,
      draftId: params.draft.id,
      traceId: params.draft.payload.traceId ?? null,
      messageText: text,
      kind: "clarification_request",
      authorType: "rai",
      currentOwnerRole: params.targetOwnerRole ?? params.thread.currentOwnerRole,
      metadata: {
        source: "front_office_router",
        missingContext: params.missingContext,
        audience: "client_front_office",
      },
    });

    return {
      replyStatus: outbound.replyStatus,
      messageId: outbound.message.id,
      text,
    };
  }

  async sendHandoffReceipt(params: {
    companyId: string;
    thread: FrontOfficeThreadRecord;
    draft: FrontOfficeDraftRecord;
    targetOwnerRole?: string | null;
    handoffId?: string | null;
    handoffStatus?: string | null;
  }): Promise<{
    replyStatus: FrontOfficeReplyStatus;
    messageId?: string;
    text: string;
  }> {
    const text = this.buildHandoffReceiptText(params.targetOwnerRole ?? null);
    const outbound = await this.outboundService.sendToThread({
      companyId: params.companyId,
      thread: params.thread,
      draftId: params.draft.id,
      traceId: params.draft.payload.traceId ?? null,
      messageText: text,
      kind: "handoff_receipt",
      authorType: "system",
      currentOwnerRole: params.targetOwnerRole ?? params.thread.currentOwnerRole,
      currentHandoffStatus:
        (params.handoffStatus as any) ?? params.thread.currentHandoffStatus,
      metadata: {
        source: "front_office_router",
        handoffId: params.handoffId ?? null,
        handoffStatus: params.handoffStatus ?? null,
        targetOwnerRole: params.targetOwnerRole ?? null,
      },
    });

    return {
      replyStatus: outbound.replyStatus,
      messageId: outbound.message.id,
      text,
    };
  }

  private buildWorkspaceContext(
    thread: FrontOfficeThreadRecord,
    draft: FrontOfficeDraftRecord,
  ): WorkspaceContextDto {
    const activeEntityRefs: Array<{ kind: WorkspaceEntityKind; id: string }> = [];
    if (thread.farmAccountId) {
      activeEntityRefs.push({
        kind: WorkspaceEntityKind.farm,
        id: thread.farmAccountId,
      });
    }
    if (draft.anchor.fieldId) {
      activeEntityRefs.push({
        kind: WorkspaceEntityKind.field,
        id: draft.anchor.fieldId,
      } as any);
    }
    if (draft.anchor.taskId) {
      activeEntityRefs.push({
        kind: WorkspaceEntityKind.task,
        id: draft.anchor.taskId,
      });
    }
    return {
      route: "/telegram/front-office",
      activeEntityRefs,
      selectedRowSummary: thread.farmAccountId
        ? {
            kind: "farm",
            id: thread.farmAccountId,
            title: thread.farmNameSnapshot ?? "Хозяйство",
          }
        : undefined,
      lastUserAction: "front_office_client_auto_reply",
    };
  }

  private buildClarificationText(
    missingContext: string[],
    targetOwnerRole: string | null,
  ): string {
    const labels = missingContext.map((item) => this.describeMissingContext(item));
    const ownerLabel = this.describeOwnerRole(targetOwnerRole);
    if (labels.length === 0) {
      return `Чтобы ответить точнее, уточните, пожалуйста, контекст запроса${ownerLabel ? ` для контура «${ownerLabel}»` : ""}.`;
    }
    return `Чтобы ответить точно, уточните, пожалуйста: ${labels.join(", ")}.`;
  }

  private buildHandoffReceiptText(targetOwnerRole: string | null): string {
    const ownerLabel = this.describeOwnerRole(targetOwnerRole);
    if (!ownerLabel) {
      return "Запрос принят и передан консультанту. Ответ появится в этом диалоге.";
    }
    return `Запрос принят и передан в контур «${ownerLabel}». Ответ появится в этом диалоге.`;
  }

  private describeMissingContext(item: string): string {
    switch (item) {
      case "FARM_CONTEXT":
        return "хозяйство";
      case "FIELD_CONTEXT":
        return "поле";
      case "SEASON_CONTEXT":
        return "сезон";
      case "FIELD_OR_SEASON_CONTEXT":
        return "поле или сезон";
      case "INTENT_CONFIDENCE":
        return "что именно вы хотите узнать";
      default:
        return item.toLowerCase();
    }
  }

  private describeOwnerRole(targetOwnerRole: string | null): string | null {
    switch (targetOwnerRole) {
      case "agronomist":
        return "Агрономия";
      case "economist":
        return "Экономика";
      case "monitoring":
        return "Мониторинг";
      case "contracts_agent":
        return "Договоры";
      case "crm_agent":
        return "CRM";
      case "knowledge":
        return "База знаний";
      default:
        return null;
    }
  }
}
