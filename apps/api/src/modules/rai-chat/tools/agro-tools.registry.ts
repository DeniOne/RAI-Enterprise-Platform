import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  ComputeDeviationsPayload,
  GenerateTechMapDraftPayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
} from "./rai-tools.types";
import { DeviationService } from "../../consulting/deviation.service";
import { TechMapService } from "../../tech-map/tech-map.service";

const AGRO_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.ComputeDeviations,
  RaiToolName.GenerateTechMapDraft,
];

type AgroToolName =
  | RaiToolName.ComputeDeviations
  | RaiToolName.GenerateTechMapDraft;

type ToolHandler<TName extends AgroToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredAgroTool<TName extends AgroToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class AgroToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<AgroToolName, RegisteredAgroTool<AgroToolName>>();

  constructor(
    private readonly deviationService: DeviationService,
    private readonly techMapService: TechMapService,
  ) {}

  onModuleInit() {
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

  register<TName extends AgroToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`AGRO_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredAgroTool<AgroToolName>);
  }

  has(name: RaiToolName): boolean {
    return AGRO_TOOL_NAMES.includes(name);
  }

  async execute<TName extends AgroToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as RegisteredAgroTool<TName> | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown agro tool: ${name}`);
    }

    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });

    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for agro tool ${name}: ${validation.error.message}`,
      );
    }

    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }
}
