import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import { UserRole } from "@rai/prisma-client";
import {
  EchoMessagePayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  TOOL_RISK_MAP,
  WorkspaceSnapshotPayload,
} from "./rai-tools.types";
import { DeviationService } from "../../consulting/deviation.service";
import { TechMapService } from "../../tech-map/tech-map.service";
import { AgroToolsRegistry } from "./agro-tools.registry";
import { FinanceToolsRegistry } from "./finance-tools.registry";
import { RiskToolsRegistry } from "./risk-tools.registry";
import { KnowledgeToolsRegistry } from "./knowledge-tools.registry";
import { RiskPolicyEngineService } from "../security/risk-policy-engine.service";
import { PendingActionService } from "../security/pending-action.service";
import { RiskPolicyBlockedError } from "../security/risk-policy-blocked.error";

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

  constructor(
    private readonly techMapService: TechMapService,
    private readonly deviationService: DeviationService,
    private readonly agroToolsRegistry: AgroToolsRegistry,
    private readonly financeToolsRegistry: FinanceToolsRegistry,
    private readonly riskToolsRegistry: RiskToolsRegistry,
    private readonly knowledgeToolsRegistry: KnowledgeToolsRegistry,
    private readonly riskPolicyEngine: RiskPolicyEngineService,
    private readonly pendingActionService: PendingActionService,
  ) {}

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
    const riskInfo = TOOL_RISK_MAP[name];
    if (riskInfo) {
      const verdict = this.riskPolicyEngine.evaluate(
        riskInfo.riskLevel,
        riskInfo.domain,
        actorContext.userRole as UserRole | undefined,
      );
      if (this.pendingActionService.requiresConfirmation(verdict)) {
        const action = await this.pendingActionService.create({
          companyId: actorContext.companyId,
          traceId: actorContext.traceId,
          toolName: name,
          payload: (payload ?? {}) as Record<string, unknown>,
          riskLevel: riskInfo.riskLevel,
          requestedByUserId: actorContext.userId,
        });
        this.logToolCall(name, actorContext, false, payload, "risk_policy_blocked");
        throw new RiskPolicyBlockedError(
          action.id,
          name,
          `Выполнение инструмента заблокировано RiskPolicy. Создан PendingAction #${action.id}. Ожидается подтверждение человека.`,
        );
      }
    }

    if (this.agroToolsRegistry.has(name)) {
      return this.agroToolsRegistry.execute(
        name as TName & (RaiToolName.ComputeDeviations | RaiToolName.GenerateTechMapDraft),
        payload,
        actorContext,
      );
    }
    if (this.financeToolsRegistry.has(name)) {
      return this.financeToolsRegistry.execute(name as never, payload, actorContext) as Promise<RaiToolResultMap[TName]>;
    }
    if (this.riskToolsRegistry.has(name)) {
      return this.riskToolsRegistry.execute(name as never, payload, actorContext) as Promise<RaiToolResultMap[TName]>;
    }
    if (this.knowledgeToolsRegistry.has(name)) {
      return this.knowledgeToolsRegistry.execute(name as never, payload, actorContext) as Promise<RaiToolResultMap[TName]>;
    }

    const tool = this.tools.get(name) as RegisteredTool<TName> | undefined;
    if (!tool) {
      this.logToolCall(name, actorContext, false, payload, "tool_not_registered");
      throw new BadRequestException(`Unknown tool: ${name}`);
    }

    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });

    if (validation.error) {
      this.logToolCall(name, actorContext, false, payload, "validation_failed");
      throw new BadRequestException(
        `Invalid payload for tool ${name}: ${validation.error.message}`,
      );
    }

    try {
      const result = await tool.handler(validation.value, actorContext);
      this.logToolCall(name, actorContext, true, validation.value);
      return result;
    } catch (error) {
      this.logToolCall(
        name,
        actorContext,
        false,
        validation.value,
        "handler_failed",
      );
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
    payload: unknown,
    reason?: string,
  ) {
    const logPayload = JSON.stringify({
      toolName,
      companyId: actorContext.companyId,
      traceId: actorContext.traceId,
      status: success ? "success" : "fail",
      payload: this.serializePayload(payload),
      reason,
    });

    if (success) {
      this.logger.log(logPayload);
      return;
    }

    this.logger.warn(logPayload);
  }

  private serializePayload(payload: unknown): unknown {
    if (payload === undefined) {
      return null;
    }

    try {
      return JSON.parse(JSON.stringify(payload));
    } catch {
      return "[unserializable_payload]";
    }
  }
}
