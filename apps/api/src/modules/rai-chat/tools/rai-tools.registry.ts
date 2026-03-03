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
  ComputeDeviationsPayload,
  ComputePlanFactPayload,
  EchoMessagePayload,
  EmitAlertsPayload,
  GenerateTechMapDraftPayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  WorkspaceSnapshotPayload,
} from "./rai-tools.types";
import { DeviationService } from "../../consulting/deviation.service";
import { KpiService } from "../../consulting/kpi.service";
import { TechMapService } from "../../tech-map/tech-map.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

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
    private readonly kpiService: KpiService,
    private readonly prisma: PrismaService,
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

    this.register(
      RaiToolName.ComputeDeviations,
      Joi.object<ComputeDeviationsPayload>({
        scope: Joi.object({
          seasonId: Joi.string().trim().max(128).optional(),
          fieldId: Joi.string().trim().max(128).optional(),
        })
          .default({})
          .required(),
      }),
      async (payload, actorContext) => {
        const active = await this.deviationService.getActiveDeviations({
          companyId: actorContext.companyId,
        });

        const filtered = active.filter((item) => {
          if (
            payload.scope.seasonId &&
            item.harvestPlan?.seasonId !== payload.scope.seasonId
          ) {
            return false;
          }

          if (
            payload.scope.fieldId &&
            !(item.harvestPlan?.techMaps ?? []).some(
              (techMap) => techMap.fieldId === payload.scope.fieldId,
            )
          ) {
            return false;
          }

          return true;
        });

        return {
          count: filtered.length,
          seasonId: payload.scope.seasonId,
          fieldId: payload.scope.fieldId,
          items: filtered.map((item) => ({
            id: item.id,
            status: item.status,
            harvestPlanId: item.harvestPlanId,
            budgetPlanId: item.budgetPlanId,
          })),
        };
      },
    );

    this.register(
      RaiToolName.ComputePlanFact,
      Joi.object<ComputePlanFactPayload>({
        scope: Joi.object({
          planId: Joi.string().trim().max(128).optional(),
          seasonId: Joi.string().trim().max(128).optional(),
        })
          .default({})
          .required(),
      }),
      async (payload, actorContext) => {
        let planId = payload.scope.planId;

        if (!planId) {
          const plan = await this.prisma.harvestPlan.findFirst({
            where: {
              companyId: actorContext.companyId,
              ...(payload.scope.seasonId
                ? { seasonId: payload.scope.seasonId }
                : {}),
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (!plan) {
            throw new BadRequestException("No harvest plan found for tool scope");
          }

          planId = plan.id;
        }

        const plan = await this.prisma.harvestPlan.findFirst({
          where: {
            id: planId,
            companyId: actorContext.companyId,
          },
        });

        if (!plan) {
          throw new BadRequestException("Harvest plan not found in tenant scope");
        }

        const result = await this.kpiService.calculatePlanKPI(plan.id, {
          companyId: actorContext.companyId,
          role: UserRole.ADMIN,
          userId: "rai-agent",
        });

        return {
          planId: plan.id,
          status: plan.status,
          seasonId: plan.seasonId,
          hasData: result.hasData,
          roi: result.roi,
          ebitda: result.ebitda,
          revenue: result.revenue,
          totalActualCost: result.totalActualCost,
          totalPlannedCost: result.totalPlannedCost,
        };
      },
    );

    this.register(
      RaiToolName.EmitAlerts,
      Joi.object<EmitAlertsPayload>({
        severity: Joi.string().valid("S3", "S4").default("S3"),
      }),
      async (payload, actorContext) => {
        const severities =
          payload.severity === "S4" ? ["S4"] : (["S3", "S4"] as const);
        const items = await this.prisma.agroEscalation.findMany({
          where: {
            companyId: actorContext.companyId,
            status: "OPEN",
            severity: { in: [...severities] },
          },
          orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
          take: 20,
        });

        return {
          count: items.length,
          severity: payload.severity,
          items: items.map((item) => ({
            id: item.id,
            severity: item.severity,
            reason: item.reason,
            status: item.status,
            references:
              item.references && typeof item.references === "object"
                ? (item.references as Record<string, unknown>)
                : {},
          })),
        };
      },
    );

    this.register(
      RaiToolName.GenerateTechMapDraft,
      Joi.object<GenerateTechMapDraftPayload>({
        fieldRef: Joi.string().trim().max(128).required(),
        seasonRef: Joi.string().trim().max(128).required(),
        crop: Joi.string()
          .valid("rapeseed", "sunflower")
          .required(),
      }),
      async (payload, actorContext) =>
        this.techMapService.createDraftStub({
          fieldRef: payload.fieldRef,
          seasonRef: payload.seasonRef,
          crop: payload.crop,
          companyId: actorContext.companyId,
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
