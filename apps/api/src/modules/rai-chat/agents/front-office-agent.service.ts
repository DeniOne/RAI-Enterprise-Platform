import { Injectable } from "@nestjs/common";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import {
  ClassifyDialogThreadResult,
  CreateFrontOfficeEscalationResult,
  LogDialogMessageResult,
  RaiToolActorContext,
  RaiToolName,
} from "../tools/rai-tools.types";
import { FrontOfficeToolsRegistry } from "../tools/front-office-tools.registry";
import {
  AgentExecutionRequest,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";

export type FrontOfficeAgentIntent =
  | "log_dialog_message"
  | "classify_dialog_thread"
  | "create_front_office_escalation";

export interface FrontOfficeAgentInput {
  companyId: string;
  traceId: string;
  userId?: string;
  userRole?: string;
  userConfirmed?: boolean;
  intent: FrontOfficeAgentIntent;
  channel: "telegram" | "web_chat" | "internal";
  messageText: string;
  direction?: "inbound" | "outbound";
  threadExternalId?: string;
  dialogExternalId?: string;
  senderExternalId?: string;
  recipientExternalId?: string;
  route?: string;
  targetOwnerRole?: string;
}

export interface FrontOfficeAgentResult {
  agentName: "FrontOfficeAgent";
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
  data: unknown;
  confidence: number;
  explain: string;
  toolCallsCount: number;
  traceId: string;
  evidence: EvidenceReference[];
  fallbackUsed: boolean;
}

const INTENT_TOOL: Record<FrontOfficeAgentIntent, RaiToolName> = {
  log_dialog_message: RaiToolName.LogDialogMessage,
  classify_dialog_thread: RaiToolName.ClassifyDialogThread,
  create_front_office_escalation: RaiToolName.CreateFrontOfficeEscalation,
};

@Injectable()
export class FrontOfficeAgent {
  constructor(
    private readonly frontOfficeToolsRegistry: FrontOfficeToolsRegistry,
  ) {}

  async run(
    input: FrontOfficeAgentInput,
    options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
  ): Promise<FrontOfficeAgentResult> {
    if (!input.messageText.trim()) {
      return {
        agentName: "FrontOfficeAgent",
        status: "NEEDS_MORE_DATA",
        data: {},
        confidence: 0,
        explain: "Нужно сообщение или фрагмент диалога для front-office обработки.",
        toolCallsCount: 0,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: true,
      };
    }

    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
      userId: input.userId,
      userRole: input.userRole,
      userConfirmed: input.userConfirmed,
    };

    try {
      const logResult = await this.frontOfficeToolsRegistry.execute(
        RaiToolName.LogDialogMessage,
        {
          channel: input.channel,
          direction: input.direction ?? "inbound",
          messageText: input.messageText,
          threadExternalId: input.threadExternalId,
          dialogExternalId: input.dialogExternalId,
          senderExternalId: input.senderExternalId,
          recipientExternalId: input.recipientExternalId,
          route: input.route,
        },
        actorContext,
      );

      if (input.intent === "log_dialog_message") {
        return {
          agentName: "FrontOfficeAgent",
          status: "COMPLETED",
          data: logResult,
          confidence: 0.9,
          explain: this.explainLog(logResult),
          toolCallsCount: 1,
          traceId: input.traceId,
          evidence: this.buildEvidence(logResult, input.intent),
          fallbackUsed: true,
        };
      }

      const classification = await this.frontOfficeToolsRegistry.execute(
        RaiToolName.ClassifyDialogThread,
        {
          channel: input.channel,
          messageText: input.messageText,
          threadExternalId: input.threadExternalId,
          route: input.route,
          counterpartyHint: input.senderExternalId,
        },
        actorContext,
      );

      if (input.intent === "classify_dialog_thread") {
        return {
          agentName: "FrontOfficeAgent",
          status: "COMPLETED",
          data: {
            log: logResult,
            classification,
          },
          confidence: classification.confidence,
          explain:
            classification.classification === "free_chat"
              ? this.explainFreeChat(input.messageText)
              : this.explainClassification(classification),
          toolCallsCount: 2,
          traceId: input.traceId,
          evidence: this.buildEvidence(classification, input.intent),
          fallbackUsed: true,
        };
      }

      const escalation = await this.frontOfficeToolsRegistry.execute(
        RaiToolName.CreateFrontOfficeEscalation,
        {
          channel: input.channel,
          messageText: input.messageText,
          classification: classification.classification,
          threadExternalId: input.threadExternalId,
          route: input.route,
          targetOwnerRole: input.targetOwnerRole ?? classification.targetOwnerRole,
          summary: this.buildEscalationSummary(input.messageText, classification.targetOwnerRole),
        },
        actorContext,
      );

      return {
        agentName: "FrontOfficeAgent",
        status: "COMPLETED",
        data: {
          log: logResult,
          classification,
          escalation,
        },
        confidence: Math.max(classification.confidence, 0.82),
        explain: this.explainEscalation(escalation),
        toolCallsCount: 3,
        traceId: input.traceId,
        evidence: this.buildEvidence(escalation, input.intent),
        fallbackUsed: true,
      };
    } catch (err) {
      return {
        agentName: "FrontOfficeAgent",
        status: "FAILED",
        data: {},
        confidence: 0,
        explain: String((err as Error).message),
        toolCallsCount: 0,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: true,
      };
    }
  }

  private explainLog(data: LogDialogMessageResult): string {
    return `Сообщение зафиксировано в front-office журнале. Канал: ${data.channel}, направление: ${data.direction}, thread: ${data.threadKey}.`;
  }

  private explainClassification(data: ClassifyDialogThreadResult): string {
    const owner = data.targetOwnerRole ? ` Владелец для handoff: ${data.targetOwnerRole}.` : "";
    return `Диалог классифицирован как ${data.classification}. Уверенность: ${data.confidence.toFixed(2)}.${owner}`;
  }

  private explainFreeChat(messageText: string): string {
    return `Принял: ${messageText.trim()}`;
  }

  private explainEscalation(data: CreateFrontOfficeEscalationResult): string {
    const owner = data.targetOwnerRole ? ` Назначение: ${data.targetOwnerRole}.` : "";
    return `Эскалация создана из коммуникационного контура. Класс: ${data.classification}.${owner}`;
  }

  private buildEscalationSummary(messageText: string, targetOwnerRole?: string): string {
    const base = messageText.trim().slice(0, 240);
    return targetOwnerRole
      ? `Handoff для ${targetOwnerRole}: ${base}`
      : `Front-office escalation: ${base}`;
  }

  private buildEvidence(
    data:
      | LogDialogMessageResult
      | ClassifyDialogThreadResult
      | CreateFrontOfficeEscalationResult,
    intent: FrontOfficeAgentIntent,
  ): EvidenceReference[] {
    if ("auditLogId" in data) {
      return [
        {
          claim: `Front-office агент выполнил ${intent} и сохранил след в аудите.`,
          sourceType: "DB",
          sourceId: data.auditLogId,
          confidenceScore: 0.9,
        },
      ];
    }
    return [
      {
        claim: `Front-office агент выполнил ${intent} и отнёс диалог к классу ${data.classification}.`,
        sourceType: "TOOL_RESULT",
        sourceId: data.threadKey,
        confidenceScore: data.confidence,
      },
    ];
  }
}
