import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  EmitAlertsPayload,
  GetWeatherForecastPayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  ToolRiskLevel,
} from "./rai-tools.types";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { SecurityViolationError } from "../../../shared/rai-chat/security/security-violation.error";

const RISK_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.EmitAlerts,
  RaiToolName.GetWeatherForecast,
];

type RiskToolName =
  | RaiToolName.EmitAlerts
  | RaiToolName.GetWeatherForecast;

type ToolHandler<TName extends RiskToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredRiskTool<TName extends RiskToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
  riskLevel: ToolRiskLevel;
}

@Injectable()
export class RiskToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<
    RiskToolName,
    RegisteredRiskTool<RiskToolName>
  >();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.register(
      RaiToolName.EmitAlerts,
      Joi.object<EmitAlertsPayload>({
        severity: Joi.string().valid("S3", "S4").default("S3"),
      }),
      "READ",
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
      RaiToolName.GetWeatherForecast,
      Joi.object<GetWeatherForecastPayload>({
        region: Joi.string().trim().max(128).optional(),
        days: Joi.number().min(1).max(14).optional(),
      }),
      "READ",
      async () => ({
        forecast: "unavailable",
        source: "stub",
      }),
    );
  }

  register<TName extends RiskToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    riskLevel: ToolRiskLevel,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`RISK_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
      riskLevel,
    } as RegisteredRiskTool<RiskToolName>);
  }

  has(name: RaiToolName): boolean {
    return RISK_TOOL_NAMES.includes(name);
  }

  async execute<TName extends RiskToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as RegisteredRiskTool<TName> | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown risk tool: ${name}`);
    }
    if (
      actorContext.isAutonomous &&
      (tool.riskLevel === "WRITE" || tool.riskLevel === "CRITICAL")
    ) {
      throw new SecurityViolationError(
        name,
        tool.riskLevel,
        `Tool ${name} (${tool.riskLevel}) not allowed in autonomous context`,
      );
    }
    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });
    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for risk tool ${name}: ${validation.error.message}`,
      );
    }
    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }
}
