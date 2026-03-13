import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { ObjectSchema } from "joi";
import { AuditService } from "../../../shared/audit/audit.service";
import {
  buildThreadKey,
  classifyFrontOfficeMessage,
} from "../../../shared/rai-chat/front-office-tool-helpers";
import {
  classifyDialogThreadSchema,
  createFrontOfficeEscalationSchema,
  logDialogMessageSchema,
} from "../../../shared/rai-chat/front-office-tool-schemas";
import {
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
      logDialogMessageSchema,
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
      classifyDialogThreadSchema,
      async (payload, actorContext) => {
        const threadKey = buildThreadKey({
          companyId: actorContext.companyId,
          channel: payload.channel,
          threadExternalId: payload.threadExternalId,
          dialogExternalId: payload.threadExternalId,
          senderExternalId: payload.counterpartyHint,
        });
        const classification = classifyFrontOfficeMessage(payload.messageText);
        return {
          ...classification,
          threadKey,
        };
      },
    );

    this.register(
      RaiToolName.CreateFrontOfficeEscalation,
      createFrontOfficeEscalationSchema,
      async (payload, actorContext) => {
        const threadKey = buildThreadKey({
          companyId: actorContext.companyId,
          channel: payload.channel,
          threadExternalId: payload.threadExternalId,
          dialogExternalId: payload.threadExternalId,
        });
        const derived = classifyFrontOfficeMessage(payload.messageText);
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
