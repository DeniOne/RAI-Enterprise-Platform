import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  EchoMessagePayload,
  RaiToolActorContext,
  WorkspaceSnapshotPayload,
} from "./rai-tools.types";

export const echoMessageSchema: ObjectSchema<EchoMessagePayload> =
  Joi.object<EchoMessagePayload>({
    message: Joi.string().trim().max(1000).required(),
  });

export const workspaceSnapshotSchema: ObjectSchema<WorkspaceSnapshotPayload> =
  Joi.object<WorkspaceSnapshotPayload>({
    route: Joi.string().trim().max(256).required(),
    lastUserAction: Joi.string().trim().max(200).optional(),
  });

export function handleEchoMessage(
  payload: EchoMessagePayload,
  actorContext: RaiToolActorContext,
) {
  return {
    echoedMessage: payload.message,
    companyId: actorContext.companyId,
  };
}

export function handleWorkspaceSnapshot(payload: WorkspaceSnapshotPayload) {
  return {
    route: payload.route,
    hasSelection: Boolean(payload.lastUserAction),
    lastUserAction: payload.lastUserAction,
  };
}
