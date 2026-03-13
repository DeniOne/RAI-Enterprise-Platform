import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import { AuditService } from "../../../shared/audit/audit.service";
import {
  ClassifyDialogThreadPayload,
  CreateFrontOfficeEscalationPayload,
  LogDialogMessagePayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
} from "./rai-tools.types";

const FRONT_OFFICE_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.LogDialogMessage,
  RaiToolName.ClassifyDialogThread,
  RaiToolName.CreateFrontOfficeEscalation,
];

type FrontOfficeToolName =
  | RaiToolName.LogDialogMessage
  | RaiToolName.ClassifyDialogThread
  | RaiToolName.CreateFrontOfficeEscalation;

type ToolHandler<TName extends FrontOfficeToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredFrontOfficeTool<TName extends FrontOfficeToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

function buildThreadKey(params: {
  companyId: string;
  channel: "telegram" | "web_chat" | "internal";
  threadExternalId?: string;
  dialogExternalId?: string;
  senderExternalId?: string;
}): string {
  return [
    params.companyId,
    params.channel,
    params.threadExternalId ??
      params.dialogExternalId ??
      params.senderExternalId ??
      "unknown",
  ].join(":");
}

function detectTargetOwnerRole(text: string): string | undefined {
  const normalized = text.toLowerCase();
  if (/договор|контракт|услови[ея]|подпис/i.test(normalized)) {
    return "contracts_agent";
  }
  if (
    /контрагент|crm|лид|реквизит|карточк|контакт(?!\s+по\s+задаче)|встреч/i.test(
      normalized,
    )
  ) {
    return "crm_agent";
  }
  if (/поле|техкарт|сезон|сзр|агроном|урож/i.test(normalized)) {
    return "agronomist";
  }
  if (/финанс|план-факт|марж|бюджет|риск|cash/i.test(normalized)) {
    return "economist";
  }
  if (/алерт|инцидент|авари|сбой|критич|монитор/i.test(normalized)) {
    return "monitoring";
  }
  if (/регламент|политик|знан|документ/i.test(normalized)) {
    return "knowledge";
  }
  return undefined;
}

function collectMatches(text: string, pattern: RegExp): string[] {
  const values = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    const value = match[1]?.trim();
    if (value) {
      values.add(value);
    }
  }
  return Array.from(values);
}

function detectAnchorCandidates(text: string) {
  return {
    farmRefs: collectMatches(
      text,
      /(?:farm|farmRef|хозяйств(?:о|а)?|клиент)\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
    fieldIds: collectMatches(
      text,
      /(?:field|fieldId|поле)\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
    seasonIds: collectMatches(
      text,
      /(?:season|seasonId|сезон)\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
    taskIds: collectMatches(
      text,
      /(?:task|taskId|задач[аеи])\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
  };
}

function suggestMustClarifications(input: {
  classification: "free_chat" | "task_process" | "client_request" | "escalation_signal";
  confidence: number;
  anchorCandidates: ReturnType<typeof detectAnchorCandidates>;
}) {
  const mustClarifications = new Set<string>();
  if (input.confidence < 0.72) {
    mustClarifications.add("CONFIRM_INTENT");
  }

  if (input.classification === "task_process") {
    if (
      input.anchorCandidates.fieldIds.length === 0 &&
      input.anchorCandidates.taskIds.length === 0
    ) {
      mustClarifications.add("LINK_FIELD_OR_TASK");
    }
    if (input.anchorCandidates.seasonIds.length === 0) {
      mustClarifications.add("LINK_SEASON");
    }
  }

  if (
    input.classification === "client_request" &&
    input.anchorCandidates.fieldIds.length === 0 &&
    input.anchorCandidates.taskIds.length === 0 &&
    input.anchorCandidates.seasonIds.length === 0 &&
    input.anchorCandidates.farmRefs.length === 0
  ) {
    mustClarifications.add("LINK_OBJECT");
  }

  return Array.from(mustClarifications);
}

function buildHandoffSummary(params: {
  messageText: string;
  classification: "free_chat" | "task_process" | "client_request" | "escalation_signal";
  targetOwnerRole?: string;
  anchorCandidates: ReturnType<typeof detectAnchorCandidates>;
}) {
  const anchorSummary = [
    params.anchorCandidates.farmRefs[0]
      ? `farm=${params.anchorCandidates.farmRefs[0]}`
      : null,
    params.anchorCandidates.fieldIds[0]
      ? `field=${params.anchorCandidates.fieldIds[0]}`
      : null,
    params.anchorCandidates.seasonIds[0]
      ? `season=${params.anchorCandidates.seasonIds[0]}`
      : null,
    params.anchorCandidates.taskIds[0]
      ? `task=${params.anchorCandidates.taskIds[0]}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
  const messagePreview = params.messageText.trim().slice(0, 240);
  return [
    `classification=${params.classification}`,
    params.targetOwnerRole ? `owner=${params.targetOwnerRole}` : null,
    anchorSummary || null,
    messagePreview,
  ]
    .filter(Boolean)
    .join(" | ");
}

function classifyMessage(text: string): {
  classification:
    | "free_chat"
    | "task_process"
    | "client_request"
    | "escalation_signal";
  confidence: number;
  reasons: string[];
  targetOwnerRole?: string;
  needsEscalation: boolean;
  anchorCandidates: ReturnType<typeof detectAnchorCandidates>;
  mustClarifications: string[];
  handoffSummary: string;
} {
  const normalized = text.toLowerCase();
  const reasons: string[] = [];
  const targetOwnerRole = detectTargetOwnerRole(text);
  const anchorCandidates = detectAnchorCandidates(text);

  const buildResult = (params: {
    classification:
      | "free_chat"
      | "task_process"
      | "client_request"
      | "escalation_signal";
    confidence: number;
    needsEscalation: boolean;
    targetOwnerRole?: string;
  }) => ({
    ...params,
    reasons,
    anchorCandidates,
    mustClarifications: suggestMustClarifications({
      classification: params.classification,
      confidence: params.confidence,
      anchorCandidates,
    }),
    handoffSummary: buildHandoffSummary({
      messageText: text,
      classification: params.classification,
      targetOwnerRole: params.targetOwnerRole,
      anchorCandidates,
    }),
  });

  if (
    /срочно|эскалац|критич|не работает|проблем|авари|зависло/i.test(normalized)
  ) {
    reasons.push("critical_signal_detected");
    return buildResult({
      classification: "escalation_signal",
      confidence: 0.88,
      targetOwnerRole: targetOwnerRole ?? "monitoring",
      needsEscalation: true,
    });
  }

  if (/нужно|сделай|создай|поставь|поруч|в работу|заведи/i.test(normalized)) {
    reasons.push("task_language_detected");
    return buildResult({
      classification: "task_process",
      confidence: 0.82,
      targetOwnerRole,
      needsEscalation: Boolean(targetOwnerRole),
    });
  }

  if (
    /контрагент|договор|сч[её]т|crm|контакт|реквизит|карточк|подпис/i.test(
      normalized,
    )
  ) {
    reasons.push("business_request_detected");
    return buildResult({
      classification: "client_request",
      confidence: 0.78,
      targetOwnerRole: targetOwnerRole ?? "crm_agent",
      needsEscalation: true,
    });
  }

  reasons.push("no_process_signal_detected");
  return buildResult({
    classification: "free_chat",
    confidence: 0.65,
    targetOwnerRole,
    needsEscalation: false,
  });
}

@Injectable()
export class FrontOfficeToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<
    FrontOfficeToolName,
    RegisteredFrontOfficeTool<FrontOfficeToolName>
  >();

  constructor(private readonly auditService: AuditService) {}

  onModuleInit() {
    this.register(
      RaiToolName.LogDialogMessage,
      Joi.object<LogDialogMessagePayload>({
        channel: Joi.string()
          .valid("telegram", "web_chat", "internal")
          .required(),
        direction: Joi.string().valid("inbound", "outbound").required(),
        messageText: Joi.string().trim().min(1).max(5000).required(),
        threadExternalId: Joi.string().trim().max(256).optional(),
        dialogExternalId: Joi.string().trim().max(256).optional(),
        senderExternalId: Joi.string().trim().max(256).optional(),
        recipientExternalId: Joi.string().trim().max(256).optional(),
        route: Joi.string().trim().max(256).optional(),
        messageTs: Joi.string().trim().max(64).optional(),
      }),
      async (payload, actorContext) => {
        const threadKey = buildThreadKey({
          companyId: actorContext.companyId,
          channel: payload.channel,
          threadExternalId: payload.threadExternalId,
          dialogExternalId: payload.dialogExternalId,
          senderExternalId: payload.senderExternalId,
        });
        const auditLog = await this.auditService.log({
          action: "FRONT_OFFICE_DIALOG_MESSAGE_LOGGED",
          companyId: actorContext.companyId,
          userId: actorContext.userId,
          metadata: {
            traceId: actorContext.traceId,
            threadKey,
            channel: payload.channel,
            direction: payload.direction,
            route: payload.route ?? null,
            messageText: payload.messageText,
            threadExternalId: payload.threadExternalId ?? null,
            dialogExternalId: payload.dialogExternalId ?? null,
            senderExternalId: payload.senderExternalId ?? null,
            recipientExternalId: payload.recipientExternalId ?? null,
            messageTs: payload.messageTs ?? null,
          },
        });
        return {
          logged: true,
          auditLogId: auditLog.id,
          threadKey,
          channel: payload.channel,
          direction: payload.direction,
        };
      },
    );

    this.register(
      RaiToolName.ClassifyDialogThread,
      Joi.object<ClassifyDialogThreadPayload>({
        channel: Joi.string()
          .valid("telegram", "web_chat", "internal")
          .required(),
        messageText: Joi.string().trim().min(1).max(5000).required(),
        threadExternalId: Joi.string().trim().max(256).optional(),
        route: Joi.string().trim().max(256).optional(),
        counterpartyHint: Joi.string().trim().max(256).optional(),
      }),
      async (payload, actorContext) => {
        const threadKey = buildThreadKey({
          companyId: actorContext.companyId,
          channel: payload.channel,
          threadExternalId: payload.threadExternalId,
          dialogExternalId: payload.threadExternalId,
          senderExternalId: payload.counterpartyHint,
        });
        const classification = classifyMessage(payload.messageText);
        return {
          ...classification,
          threadKey,
        };
      },
    );

    this.register(
      RaiToolName.CreateFrontOfficeEscalation,
      Joi.object<CreateFrontOfficeEscalationPayload>({
        channel: Joi.string()
          .valid("telegram", "web_chat", "internal")
          .required(),
        messageText: Joi.string().trim().min(1).max(5000).required(),
        classification: Joi.string()
          .valid(
            "free_chat",
            "task_process",
            "client_request",
            "escalation_signal",
          )
          .optional(),
        threadExternalId: Joi.string().trim().max(256).optional(),
        route: Joi.string().trim().max(256).optional(),
        targetOwnerRole: Joi.string().trim().max(64).optional(),
        summary: Joi.string().trim().max(1000).optional(),
      }),
      async (payload, actorContext) => {
        const threadKey = buildThreadKey({
          companyId: actorContext.companyId,
          channel: payload.channel,
          threadExternalId: payload.threadExternalId,
          dialogExternalId: payload.threadExternalId,
        });
        const derived = classifyMessage(payload.messageText);
        const classification = payload.classification ?? derived.classification;
        const targetOwnerRole =
          payload.targetOwnerRole ?? derived.targetOwnerRole;
        const summary =
          payload.summary ??
          `Эскалация из ${payload.channel}: ${payload.messageText.slice(0, 240)}`;
        const auditLog = await this.auditService.log({
          action: "FRONT_OFFICE_ESCALATION_CREATED",
          companyId: actorContext.companyId,
          userId: actorContext.userId,
          metadata: {
            traceId: actorContext.traceId,
            threadKey,
            channel: payload.channel,
            route: payload.route ?? null,
            classification,
            targetOwnerRole: targetOwnerRole ?? null,
            summary,
            messageText: payload.messageText,
          },
        });
        return {
          created: true,
          auditLogId: auditLog.id,
          classification,
          targetOwnerRole,
          summary,
          threadKey,
        };
      },
    );
  }

  register<TName extends FrontOfficeToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`FRONT_OFFICE_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredFrontOfficeTool<FrontOfficeToolName>);
  }

  has(name: RaiToolName): boolean {
    return FRONT_OFFICE_TOOL_NAMES.includes(name);
  }

  async execute<TName extends FrontOfficeToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as
      | RegisteredFrontOfficeTool<TName>
      | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown front-office tool: ${name}`);
    }
    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });
    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for front-office tool ${name}: ${validation.error.message}`,
      );
    }
    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }
}
