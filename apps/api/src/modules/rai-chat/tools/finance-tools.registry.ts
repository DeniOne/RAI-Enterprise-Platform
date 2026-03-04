import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import { UserRole } from "@rai/prisma-client";
import {
  ComputePlanFactPayload,
  ComputeRiskAssessmentPayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  SimulateScenarioPayload,
} from "./rai-tools.types";
import { KpiService } from "../../consulting/kpi.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

const FINANCE_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.ComputePlanFact,
  RaiToolName.SimulateScenario,
  RaiToolName.ComputeRiskAssessment,
];

type FinanceToolName =
  | RaiToolName.ComputePlanFact
  | RaiToolName.SimulateScenario
  | RaiToolName.ComputeRiskAssessment;

type ToolHandler<TName extends FinanceToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredFinanceTool<TName extends FinanceToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class FinanceToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<
    FinanceToolName,
    RegisteredFinanceTool<FinanceToolName>
  >();

  constructor(
    private readonly kpiService: KpiService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
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
            orderBy: { createdAt: "desc" },
          });
          if (!plan) {
            throw new BadRequestException("No harvest plan found for tool scope");
          }
          planId = plan.id;
        }
        const plan = await this.prisma.harvestPlan.findFirst({
          where: { id: planId, companyId: actorContext.companyId },
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
      RaiToolName.SimulateScenario,
      Joi.object<SimulateScenarioPayload>({
        scope: Joi.object({
          planId: Joi.string().trim().max(128).optional(),
          seasonId: Joi.string().trim().max(128).optional(),
        }).optional(),
      }),
      async (_payload, _actorContext) => ({
        scenarioId: "stub-scenario",
        roi: 0,
        ebitda: 0,
        source: "stub",
      }),
    );

    this.register(
      RaiToolName.ComputeRiskAssessment,
      Joi.object<ComputeRiskAssessmentPayload>({
        scope: Joi.object({
          planId: Joi.string().trim().max(128).optional(),
          seasonId: Joi.string().trim().max(128).optional(),
        }).optional(),
      }),
      async (_payload, _actorContext) => ({
        planId: "stub-plan",
        riskLevel: "LOW",
        factors: [],
        source: "stub",
      }),
    );
  }

  register<TName extends FinanceToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`FINANCE_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredFinanceTool<FinanceToolName>);
  }

  has(name: RaiToolName): boolean {
    return FINANCE_TOOL_NAMES.includes(name);
  }

  async execute<TName extends FinanceToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as
      | RegisteredFinanceTool<TName>
      | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown finance tool: ${name}`);
    }
    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });
    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for finance tool ${name}: ${validation.error.message}`,
      );
    }
    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }
}
