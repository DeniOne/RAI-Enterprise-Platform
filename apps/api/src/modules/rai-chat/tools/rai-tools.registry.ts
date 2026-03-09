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
import { CrmToolsRegistry } from "./crm-tools.registry";
import { FrontOfficeToolsRegistry } from "./front-office-tools.registry";
import { RiskPolicyEngineService } from "../security/risk-policy-engine.service";
import { PendingActionService } from "../security/pending-action.service";
import { RiskPolicyBlockedError } from "../security/risk-policy-blocked.error";
import {
  AutonomyLevel,
  AutonomyPolicyService,
} from "../autonomy-policy.service";
import { AgentRuntimeConfigService } from "../agent-runtime-config.service";
import { AgentConfigBlockedError } from "../security/agent-config-blocked.error";
import { IncidentOpsService } from "../incident-ops.service";
import { SystemIncidentType } from "@rai/prisma-client";

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
    private readonly crmToolsRegistry: CrmToolsRegistry,
    private readonly frontOfficeToolsRegistry: FrontOfficeToolsRegistry,
    private readonly riskPolicyEngine: RiskPolicyEngineService,
    private readonly pendingActionService: PendingActionService,
    private readonly autonomyPolicy: AutonomyPolicyService,
    private readonly agentRuntimeConfig: AgentRuntimeConfigService,
    private readonly incidentOps: IncidentOpsService,
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
    if (actorContext.replayMode && riskInfo && riskInfo.riskLevel !== "READ") {
      this.logToolCall(name, actorContext, true, payload, "replay_mock");
      return { replayed: true, mock: true } as unknown as RaiToolResultMap[TName];
    }
    const configDecision = await this.agentRuntimeConfig.resolveToolAccess(
      actorContext.companyId,
      name,
    );
    if (!actorContext.replayMode && !configDecision.allowed) {
      this.logToolCall(
        name,
        actorContext,
        false,
        payload,
        configDecision.reasonCode === "AGENT_DISABLED"
          ? "agent_disabled"
          : "capability_denied",
      );
      throw new AgentConfigBlockedError(
        configDecision.reasonCode!,
        name,
        configDecision.reasonCode === "AGENT_DISABLED"
          ? `Выполнение инструмента ${name} заблокировано: агент ${configDecision.role} выключен в runtime-конфиге.`
          : `Выполнение инструмента ${name} заблокировано: у агента ${configDecision.role} отсутствует capability ${configDecision.requiredCapability}.`,
      );
    }
    let autonomyLevel: AutonomyLevel | null = null;
    if (riskInfo && riskInfo.riskLevel !== "READ") {
      autonomyLevel = await this.autonomyPolicy.getCompanyAutonomyLevel(
        actorContext.companyId,
      );
      if (autonomyLevel === AutonomyLevel.QUARANTINE) {
        this.incidentOps.logIncident({
          companyId: actorContext.companyId,
          traceId: actorContext.traceId,
          incidentType: SystemIncidentType.AUTONOMY_QUARANTINE,
          severity: "HIGH",
          details: {
            toolName: name,
            reason: "autonomy_quarantine_block",
          },
        });
        this.logToolCall(
          name,
          actorContext,
          false,
          payload,
          "autonomy_quarantine_block",
        );
        throw new RiskPolicyBlockedError(
          "AUTONOMY_QUARANTINE",
          name,
          "Выполнение инструмента заблокировано политикой автономности (QUARANTINE: только чтение, мутации запрещены).",
        );
      }
    }
    if (riskInfo) {
      const verdict = this.riskPolicyEngine.evaluate(
        riskInfo.riskLevel,
        riskInfo.domain,
        actorContext.userRole as UserRole | undefined,
      );
      const directCrmUserWrite =
        riskInfo.domain === "crm" &&
        riskInfo.riskLevel === "WRITE" &&
        actorContext.userConfirmed === true &&
        Boolean(actorContext.userId) &&
        !actorContext.isAutonomous &&
        !actorContext.replayMode;
      const requiresByRisk =
        this.pendingActionService.requiresConfirmation(verdict) &&
        !directCrmUserWrite;
      const requiresByAutonomy =
        autonomyLevel === AutonomyLevel.TOOL_FIRST &&
        riskInfo.riskLevel !== "READ";
      if (requiresByRisk || requiresByAutonomy) {
        const action = await this.pendingActionService.create({
          companyId: actorContext.companyId,
          traceId: actorContext.traceId,
          toolName: name,
          payload: (payload ?? {}) as Record<string, unknown>,
          riskLevel: riskInfo.riskLevel,
          requestedByUserId: actorContext.userId,
        });
        this.incidentOps.logIncident({
          companyId: actorContext.companyId,
          traceId: actorContext.traceId,
          incidentType: requiresByRisk
            ? SystemIncidentType.POLICY_BLOCKED_CRITICAL_ACTION
            : SystemIncidentType.AUTONOMY_TOOL_FIRST,
          severity: riskInfo.riskLevel === "CRITICAL" ? "HIGH" : "MEDIUM",
          details: {
            toolName: name,
            pendingActionId: action.id,
            riskLevel: riskInfo.riskLevel,
            policySource: requiresByRisk ? "RiskPolicy" : "AutonomyPolicy",
          },
        });
        this.logToolCall(
          name,
          actorContext,
          false,
          payload,
          requiresByRisk ? "risk_policy_blocked" : "autonomy_tool_first_block",
        );
        throw new RiskPolicyBlockedError(
          action.id,
          name,
          `Выполнение инструмента заблокировано ${
            requiresByRisk ? "RiskPolicy" : "AutonomyPolicy (TOOL_FIRST)"
          }. Создан PendingAction #${action.id}. Ожидается подтверждение человека.`,
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
    if (this.crmToolsRegistry.has(name)) {
      return this.crmToolsRegistry.execute(name as never, payload, actorContext) as Promise<RaiToolResultMap[TName]>;
    }
    if (this.frontOfficeToolsRegistry.has(name)) {
      return this.frontOfficeToolsRegistry.execute(name as never, payload, actorContext) as Promise<RaiToolResultMap[TName]>;
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
