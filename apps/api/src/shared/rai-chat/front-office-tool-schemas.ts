import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  ClassifyDialogThreadPayload,
  CreateFrontOfficeEscalationPayload,
  LogDialogMessagePayload,
} from "./rai-tools.types";

export const logDialogMessageSchema: ObjectSchema<LogDialogMessagePayload> =
  Joi.object<LogDialogMessagePayload>({
    channel: Joi.string().valid("telegram", "web_chat", "internal").required(),
    direction: Joi.string().valid("inbound", "outbound").required(),
    messageText: Joi.string().trim().min(1).max(5000).required(),
    threadExternalId: Joi.string().trim().max(256).optional(),
    dialogExternalId: Joi.string().trim().max(256).optional(),
    senderExternalId: Joi.string().trim().max(256).optional(),
    recipientExternalId: Joi.string().trim().max(256).optional(),
    route: Joi.string().trim().max(256).optional(),
    messageTs: Joi.string().trim().max(64).optional(),
  });

export const classifyDialogThreadSchema: ObjectSchema<ClassifyDialogThreadPayload> =
  Joi.object<ClassifyDialogThreadPayload>({
    channel: Joi.string().valid("telegram", "web_chat", "internal").required(),
    messageText: Joi.string().trim().min(1).max(5000).required(),
    threadExternalId: Joi.string().trim().max(256).optional(),
    route: Joi.string().trim().max(256).optional(),
    counterpartyHint: Joi.string().trim().max(256).optional(),
  });

export const createFrontOfficeEscalationSchema: ObjectSchema<CreateFrontOfficeEscalationPayload> =
  Joi.object<CreateFrontOfficeEscalationPayload>({
    channel: Joi.string().valid("telegram", "web_chat", "internal").required(),
    messageText: Joi.string().trim().min(1).max(5000).required(),
    classification: Joi.string()
      .valid("free_chat", "task_process", "client_request", "escalation_signal")
      .optional(),
    threadExternalId: Joi.string().trim().max(256).optional(),
    route: Joi.string().trim().max(256).optional(),
    targetOwnerRole: Joi.string().trim().max(64).optional(),
    summary: Joi.string().trim().max(1000).optional(),
  });
