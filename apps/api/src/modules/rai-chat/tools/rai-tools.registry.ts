import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  EchoMessagePayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  WorkspaceSnapshotPayload,
} from "./rai-tools.types";

type ToolHandler<TName extends RaiToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredTool<TName extends RaiToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class RaiToolsRegistry implements OnModuleInit {
  private readonly logger = new Logger(RaiToolsRegistry.name);
  private readonly tools = new Map<RaiToolName, RegisteredTool<RaiToolName>>();

  onModuleInit() {
    this.registerBuiltInTools();
  }

  register<TName extends RaiToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`RAI_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }

    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredTool<RaiToolName>);
  }

  async execute<TName extends RaiToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as RegisteredTool<TName> | undefined;
    if (!tool) {
      this.logToolCall(name, actorContext, false, "tool_not_registered");
      throw new BadRequestException(`Unknown tool: ${name}`);
    }

    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });

    if (validation.error) {
      this.logToolCall(name, actorContext, false, "validation_failed");
      throw new BadRequestException(
        `Invalid payload for tool ${name}: ${validation.error.message}`,
      );
    }

    try {
      const result = await tool.handler(validation.value, actorContext);
      this.logToolCall(name, actorContext, true);
      return result;
    } catch (error) {
      this.logToolCall(name, actorContext, false, "handler_failed");
      throw error;
    }
  }

  private registerBuiltInTools() {
    this.register(
      RaiToolName.EchoMessage,
      Joi.object<EchoMessagePayload>({
        message: Joi.string().trim().max(1000).required(),
      }),
      async (payload, actorContext) => ({
        echoedMessage: payload.message,
        companyId: actorContext.companyId,
      }),
    );

    this.register(
      RaiToolName.WorkspaceSnapshot,
      Joi.object<WorkspaceSnapshotPayload>({
        route: Joi.string().trim().max(256).required(),
        lastUserAction: Joi.string().trim().max(200).optional(),
      }),
      async (payload) => ({
        route: payload.route,
        hasSelection: Boolean(payload.lastUserAction),
        lastUserAction: payload.lastUserAction,
      }),
    );
  }

  private logToolCall(
    toolName: string,
    actorContext: RaiToolActorContext,
    success: boolean,
    reason?: string,
  ) {
    const logPayload = JSON.stringify({
      toolName,
      companyId: actorContext.companyId,
      traceId: actorContext.traceId,
      status: success ? "success" : "fail",
      reason,
    });

    if (success) {
      this.logger.log(logPayload);
      return;
    }

    this.logger.warn(logPayload);
  }
}
