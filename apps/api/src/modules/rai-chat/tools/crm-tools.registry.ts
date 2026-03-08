import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import * as Joi from "joi";
import { ObjectSchema } from "joi";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PartyService } from "../../commerce/services/party.service";
import { PartyLookupService } from "../../commerce/services/party-lookup.service";
import { CrmService } from "../../crm/crm.service";
import {
  CreateCounterpartyRelationPayload,
  CreateCounterpartyRelationResult,
  CreateCrmAccountPayload,
  CreateCrmAccountResult,
  CreateCrmContactPayload,
  CreateCrmContactResult,
  CreateCrmInteractionPayload,
  CreateCrmObligationPayload,
  DeleteCrmContactPayload,
  DeleteCrmContactResult,
  DeleteCrmInteractionPayload,
  DeleteCrmInteractionResult,
  DeleteCrmObligationPayload,
  DeleteCrmObligationResult,
  GetCrmAccountWorkspacePayload,
  LookupCounterpartyByInnPayload,
  RaiToolActorContext,
  RaiToolName,
  RaiToolPayloadMap,
  RaiToolResultMap,
  RegisterCounterpartyPayload,
  UpdateCrmAccountPayload,
  UpdateCrmContactPayload,
  UpdateCrmContactResult,
  UpdateCrmInteractionPayload,
  UpdateCrmInteractionResult,
  UpdateCrmObligationPayload,
  UpdateCrmObligationResult,
} from "./rai-tools.types";

const CRM_TOOL_NAMES: RaiToolName[] = [
  RaiToolName.LookupCounterpartyByInn,
  RaiToolName.RegisterCounterparty,
  RaiToolName.CreateCounterpartyRelation,
  RaiToolName.CreateCrmAccount,
  RaiToolName.GetCrmAccountWorkspace,
  RaiToolName.UpdateCrmAccount,
  RaiToolName.CreateCrmContact,
  RaiToolName.UpdateCrmContact,
  RaiToolName.DeleteCrmContact,
  RaiToolName.CreateCrmInteraction,
  RaiToolName.UpdateCrmInteraction,
  RaiToolName.DeleteCrmInteraction,
  RaiToolName.CreateCrmObligation,
  RaiToolName.UpdateCrmObligation,
  RaiToolName.DeleteCrmObligation,
];

type CrmToolName =
  | RaiToolName.LookupCounterpartyByInn
  | RaiToolName.RegisterCounterparty
  | RaiToolName.CreateCounterpartyRelation
  | RaiToolName.CreateCrmAccount
  | RaiToolName.GetCrmAccountWorkspace
  | RaiToolName.UpdateCrmAccount
  | RaiToolName.CreateCrmContact
  | RaiToolName.UpdateCrmContact
  | RaiToolName.DeleteCrmContact
  | RaiToolName.CreateCrmInteraction
  | RaiToolName.UpdateCrmInteraction
  | RaiToolName.DeleteCrmInteraction
  | RaiToolName.CreateCrmObligation
  | RaiToolName.UpdateCrmObligation
  | RaiToolName.DeleteCrmObligation;

type ToolHandler<TName extends CrmToolName> = (
  payload: RaiToolPayloadMap[TName],
  actorContext: RaiToolActorContext,
) => Promise<RaiToolResultMap[TName]>;

interface RegisteredCrmTool<TName extends CrmToolName> {
  name: TName;
  schema: ObjectSchema<RaiToolPayloadMap[TName]>;
  handler: ToolHandler<TName>;
}

@Injectable()
export class CrmToolsRegistry implements OnModuleInit {
  private readonly tools = new Map<CrmToolName, RegisteredCrmTool<CrmToolName>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly partyService: PartyService,
    private readonly partyLookupService: PartyLookupService,
    private readonly crmService: CrmService,
  ) {}

  onModuleInit() {
    this.register(
      RaiToolName.LookupCounterpartyByInn,
      Joi.object<LookupCounterpartyByInnPayload>({
        inn: Joi.string().trim().pattern(/^\d{10}(\d{2})?$/).required(),
        jurisdictionCode: Joi.string().valid("RU", "BY", "KZ").default("RU"),
        partyType: Joi.string().valid("LEGAL_ENTITY", "IP", "KFH").optional(),
      }),
      async (payload, actorContext) => {
        const normalizedInn = payload.inn.trim();
        const partyType = this.resolveLookupPartyType(normalizedInn, payload.partyType);
        const lookup = await this.partyLookupService.lookup({
          companyId: actorContext.companyId,
          userId: actorContext.userId,
          request: {
            jurisdictionId: payload.jurisdictionCode ?? "RU",
            partyType,
            identifiers: { inn: normalizedInn },
          },
        });
        const existing = await this.findExistingPartyByInn(
          actorContext.companyId,
          normalizedInn,
        );

        return {
          status: lookup.status,
          source: lookup.source,
          requestKey: lookup.requestKey,
          existingPartyId: existing?.id,
          existingPartyName: existing?.legalName,
          result: lookup.result
            ? {
                legalName: lookup.result.legalName,
                shortName: lookup.result.shortName,
                inn: lookup.result.requisites?.inn,
                kpp: lookup.result.requisites?.kpp,
                ogrn: lookup.result.requisites?.ogrn,
                ogrnip: lookup.result.requisites?.ogrnip,
                address: lookup.result.addresses?.[0]?.full,
                managerName: lookup.result.meta?.managerName,
                registeredAt: lookup.result.meta?.registeredAt,
              }
            : undefined,
          error: lookup.error,
        };
      },
    );

    this.register(
      RaiToolName.RegisterCounterparty,
      Joi.object<RegisterCounterpartyPayload>({
        inn: Joi.string().trim().pattern(/^\d{10}(\d{2})?$/).required(),
        jurisdictionCode: Joi.string().valid("RU", "BY", "KZ").default("RU"),
        partyType: Joi.string().valid("LEGAL_ENTITY", "IP", "KFH").optional(),
        legalName: Joi.string().trim().max(255).optional(),
        shortName: Joi.string().trim().max(255).optional(),
        comment: Joi.string().trim().max(500).optional(),
      }),
      async (payload, actorContext) => {
        const normalizedInn = payload.inn.trim();
        const partyType = this.resolveLookupPartyType(normalizedInn, payload.partyType);
        const existing = await this.findExistingPartyByInn(
          actorContext.companyId,
          normalizedInn,
        );
        if (existing) {
          return {
            created: false,
            source: "existing_registry",
            partyId: existing.id,
            legalName: existing.legalName,
            shortName: existing.shortName,
            inn: normalizedInn,
            jurisdictionCode: this.extractJurisdictionCode(existing),
            lookupStatus: "FOUND" as const,
            alreadyExisted: true,
          };
        }

        const lookup = await this.partyLookupService.lookup({
          companyId: actorContext.companyId,
          userId: actorContext.userId,
          request: {
            jurisdictionId: payload.jurisdictionCode ?? "RU",
            partyType,
            identifiers: { inn: normalizedInn },
          },
        });
        const jurisdiction = await this.resolveJurisdictionId(
          actorContext.companyId,
          payload.jurisdictionCode ?? "RU",
        );
        const legalName =
          lookup.result?.legalName?.trim() ||
          payload.legalName?.trim() ||
          null;
        if (!legalName) {
          throw new BadRequestException(
            "Не удалось определить наименование контрагента по ИНН. Укажите legalName вручную.",
          );
        }

        const registrationData = this.buildRegistrationData(normalizedInn, lookup);
        const created = await this.partyService.createParty(actorContext.companyId, {
          type: this.mapLookupTypeToPartyType(partyType),
          legalName,
          shortName: lookup.result?.shortName?.trim() || payload.shortName?.trim() || undefined,
          jurisdictionId: jurisdiction.id,
          comment: payload.comment?.trim(),
          registrationData,
        });

        return {
          created: true,
          source: lookup.source,
          partyId: created.id,
          legalName: created.legalName,
          shortName: created.shortName,
          inn: normalizedInn,
          jurisdictionCode: jurisdiction.code,
          lookupStatus: lookup.status,
          alreadyExisted: false,
        };
      },
    );

    this.register(
      RaiToolName.CreateCounterpartyRelation,
      Joi.object<CreateCounterpartyRelationPayload>({
        fromPartyId: Joi.string().trim().max(128).required(),
        toPartyId: Joi.string().trim().max(128).required(),
        relationType: Joi.string()
          .valid("OWNERSHIP", "MANAGEMENT", "AFFILIATED", "AGENCY")
          .required(),
        sharePct: Joi.number().min(0).max(100).optional(),
        validFrom: Joi.string().trim().required(),
        validTo: Joi.string().trim().optional(),
      }),
      async (payload, actorContext) => {
        const relation = await this.partyService.createPartyRelation(
          actorContext.companyId,
          {
            fromPartyId: payload.fromPartyId,
            toPartyId: payload.toPartyId,
            relationType: payload.relationType,
            sharePct: payload.sharePct,
            validFrom: payload.validFrom,
            validTo: payload.validTo,
          },
        );

        return {
          relationId: relation.id,
          fromPartyId: relation.sourcePartyId,
          toPartyId: relation.targetPartyId,
          relationType: String(relation.relationType),
          validFrom: relation.validFrom.toISOString(),
          validTo: relation.validTo?.toISOString() ?? null,
        } as CreateCounterpartyRelationResult;
      },
    );

    this.register(
      RaiToolName.CreateCrmAccount,
      Joi.object<CreateCrmAccountPayload>({
        name: Joi.string().trim().max(255).required(),
        inn: Joi.string().trim().pattern(/^\d{10}(\d{2})?$/).optional(),
        type: Joi.string().trim().max(64).optional(),
        holdingId: Joi.string().trim().max(128).optional(),
      }),
      async (payload, actorContext) => {
        const account = await this.crmService.createAccount(
          {
            name: payload.name,
            inn: payload.inn,
            type: payload.type,
            holdingId: payload.holdingId,
          },
          actorContext.companyId,
        );

        return {
          accountId: account.id,
          name: account.name,
          inn: account.inn,
          type: account.type,
          holdingId: account.holdingId,
          status: account.status,
        } as CreateCrmAccountResult;
      },
    );

    this.register(
      RaiToolName.GetCrmAccountWorkspace,
      Joi.object<GetCrmAccountWorkspacePayload>({
        accountId: Joi.string().trim().max(128).required(),
      }),
      async (payload, actorContext) =>
        this.crmService.getAccountWorkspace(payload.accountId, actorContext.companyId),
    );

    this.register(
      RaiToolName.UpdateCrmAccount,
      Joi.object<UpdateCrmAccountPayload>({
        accountId: Joi.string().trim().max(128).required(),
        name: Joi.string().trim().max(255).optional(),
        inn: Joi.string().trim().allow(null).optional(),
        type: Joi.string().trim().max(64).optional(),
        status: Joi.string().trim().max(64).optional(),
        holdingId: Joi.string().trim().allow(null).optional(),
        jurisdiction: Joi.string().trim().allow(null).optional(),
        riskCategory: Joi.string().trim().max(64).optional(),
        strategicValue: Joi.string().trim().max(64).optional(),
      }),
      async (payload, actorContext) => {
        const updated = await this.crmService.updateAccountProfile(payload.accountId, actorContext.companyId, {
          name: payload.name,
          inn: payload.inn,
          type: payload.type,
          status: payload.status,
          holdingId: payload.holdingId,
          jurisdiction: payload.jurisdiction,
          riskCategory: payload.riskCategory,
          strategicValue: payload.strategicValue,
        });

        return {
          accountId: updated.id,
          name: updated.name,
          inn: updated.inn,
          status: updated.status,
          riskCategory: updated.riskCategory,
          strategicValue: updated.strategicValue,
          updatedAt: updated.updatedAt.toISOString(),
        };
      },
    );

    this.register(
      RaiToolName.CreateCrmContact,
      Joi.object<CreateCrmContactPayload>({
        accountId: Joi.string().trim().max(128).required(),
        firstName: Joi.string().trim().max(120).required(),
        lastName: Joi.string().trim().max(120).optional(),
        role: Joi.string().trim().max(64).optional(),
        influenceLevel: Joi.number().min(0).max(10).optional(),
        email: Joi.string().trim().max(160).optional(),
        phone: Joi.string().trim().max(64).optional(),
        source: Joi.string().trim().max(160).optional(),
      }),
      async (payload, actorContext) => {
        const contact = await this.crmService.createContact(
          payload.accountId,
          actorContext.companyId,
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            role: payload.role,
            influenceLevel: payload.influenceLevel,
            email: payload.email,
            phone: payload.phone,
            source: payload.source,
          },
        );

        return {
          contactId: contact.id,
          accountId: contact.accountId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
        } as CreateCrmContactResult;
      },
    );

    this.register(
      RaiToolName.UpdateCrmContact,
      Joi.object<UpdateCrmContactPayload>({
        contactId: Joi.string().trim().max(128).required(),
        firstName: Joi.string().trim().max(120).optional(),
        lastName: Joi.string().trim().allow(null).max(120).optional(),
        role: Joi.string().trim().max(64).optional(),
        influenceLevel: Joi.number().min(0).max(10).allow(null).optional(),
        email: Joi.string().trim().allow(null).max(160).optional(),
        phone: Joi.string().trim().allow(null).max(64).optional(),
        source: Joi.string().trim().allow(null).max(160).optional(),
      }),
      async (payload, actorContext) => {
        const contact = await this.crmService.updateContact(
          payload.contactId,
          actorContext.companyId,
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            role: payload.role,
            influenceLevel: payload.influenceLevel,
            email: payload.email,
            phone: payload.phone,
            source: payload.source,
          },
        );

        return {
          contactId: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          role: contact.role,
          email: contact.email,
          phone: contact.phone,
        } as UpdateCrmContactResult;
      },
    );

    this.register(
      RaiToolName.DeleteCrmContact,
      Joi.object<DeleteCrmContactPayload>({
        contactId: Joi.string().trim().max(128).required(),
      }),
      async (payload, actorContext) => {
        const contact = await this.crmService.deleteContact(
          payload.contactId,
          actorContext.companyId,
        );
        return {
          contactId: contact.id,
          deleted: true,
        } as DeleteCrmContactResult;
      },
    );

    this.register(
      RaiToolName.CreateCrmInteraction,
      Joi.object<CreateCrmInteractionPayload>({
        accountId: Joi.string().trim().max(128).required(),
        type: Joi.string().trim().max(64).required(),
        summary: Joi.string().trim().max(1000).required(),
        date: Joi.string().trim().optional(),
        contactId: Joi.string().trim().allow(null).optional(),
        relatedEventId: Joi.string().trim().allow(null).optional(),
      }),
      async (payload, actorContext) => {
        const interaction = await this.crmService.createInteraction(payload.accountId, actorContext.companyId, {
          type: payload.type,
          summary: payload.summary,
          date: payload.date,
          contactId: payload.contactId,
          relatedEventId: payload.relatedEventId,
        });

        return {
          interactionId: interaction.id,
          accountId: interaction.accountId,
          type: String(interaction.type),
          summary: interaction.summary,
          date: interaction.date.toISOString(),
        };
      },
    );

    this.register(
      RaiToolName.UpdateCrmInteraction,
      Joi.object<UpdateCrmInteractionPayload>({
        interactionId: Joi.string().trim().max(128).required(),
        type: Joi.string().trim().max(64).optional(),
        summary: Joi.string().trim().max(1000).optional(),
        date: Joi.string().trim().optional(),
        contactId: Joi.string().trim().allow(null).optional(),
        relatedEventId: Joi.string().trim().allow(null).optional(),
      }),
      async (payload, actorContext) => {
        const interaction = await this.crmService.updateInteraction(
          payload.interactionId,
          actorContext.companyId,
          {
            type: payload.type,
            summary: payload.summary,
            date: payload.date,
            contactId: payload.contactId,
            relatedEventId: payload.relatedEventId,
          },
        );

        return {
          interactionId: interaction.id,
          accountId: interaction.accountId,
          type: String(interaction.type),
          summary: interaction.summary,
          date: interaction.date.toISOString(),
        } as UpdateCrmInteractionResult;
      },
    );

    this.register(
      RaiToolName.DeleteCrmInteraction,
      Joi.object<DeleteCrmInteractionPayload>({
        interactionId: Joi.string().trim().max(128).required(),
      }),
      async (payload, actorContext) => {
        const interaction = await this.crmService.deleteInteraction(
          payload.interactionId,
          actorContext.companyId,
        );
        return {
          interactionId: interaction.id,
          deleted: true,
        } as DeleteCrmInteractionResult;
      },
    );

    this.register(
      RaiToolName.CreateCrmObligation,
      Joi.object<CreateCrmObligationPayload>({
        accountId: Joi.string().trim().max(128).required(),
        description: Joi.string().trim().max(1000).required(),
        dueDate: Joi.string().trim().required(),
        responsibleUserId: Joi.string().trim().allow(null).optional(),
        status: Joi.string().trim().max(64).optional(),
      }),
      async (payload, actorContext) => {
        const obligation = await this.crmService.createObligation(payload.accountId, actorContext.companyId, {
          description: payload.description,
          dueDate: payload.dueDate,
          responsibleUserId: payload.responsibleUserId,
          status: payload.status,
        });

        return {
          obligationId: obligation.id,
          accountId: obligation.accountId,
          description: obligation.description,
          dueDate: obligation.dueDate.toISOString(),
          status: String(obligation.status),
        };
      },
    );

    this.register(
      RaiToolName.UpdateCrmObligation,
      Joi.object<UpdateCrmObligationPayload>({
        obligationId: Joi.string().trim().max(128).required(),
        description: Joi.string().trim().max(1000).optional(),
        dueDate: Joi.string().trim().optional(),
        responsibleUserId: Joi.string().trim().allow(null).optional(),
        status: Joi.string().trim().max(64).optional(),
      }),
      async (payload, actorContext) => {
        const obligation = await this.crmService.updateObligation(
          payload.obligationId,
          actorContext.companyId,
          {
            description: payload.description,
            dueDate: payload.dueDate,
            responsibleUserId: payload.responsibleUserId,
            status: payload.status,
          },
        );

        return {
          obligationId: obligation.id,
          accountId: obligation.accountId,
          description: obligation.description,
          dueDate: obligation.dueDate.toISOString(),
          status: String(obligation.status),
        } as UpdateCrmObligationResult;
      },
    );

    this.register(
      RaiToolName.DeleteCrmObligation,
      Joi.object<DeleteCrmObligationPayload>({
        obligationId: Joi.string().trim().max(128).required(),
      }),
      async (payload, actorContext) => {
        const obligation = await this.crmService.deleteObligation(
          payload.obligationId,
          actorContext.companyId,
        );
        return {
          obligationId: obligation.id,
          deleted: true,
        } as DeleteCrmObligationResult;
      },
    );
  }

  register<TName extends CrmToolName>(
    name: TName,
    schema: ObjectSchema<RaiToolPayloadMap[TName]>,
    handler: ToolHandler<TName>,
  ) {
    if (this.tools.has(name)) {
      throw new Error(`CRM_TOOL_REGISTRY_DUPLICATE: ${name}`);
    }
    this.tools.set(name, {
      name,
      schema,
      handler,
    } as RegisteredCrmTool<CrmToolName>);
  }

  has(name: RaiToolName): boolean {
    return CRM_TOOL_NAMES.includes(name);
  }

  async execute<TName extends CrmToolName>(
    name: TName,
    payload: unknown,
    actorContext: RaiToolActorContext,
  ): Promise<RaiToolResultMap[TName]> {
    const tool = this.tools.get(name) as RegisteredCrmTool<TName> | undefined;
    if (!tool) {
      throw new BadRequestException(`Unknown CRM tool: ${name}`);
    }
    const validation = tool.schema.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    });
    if (validation.error) {
      throw new BadRequestException(
        `Invalid payload for CRM tool ${name}: ${validation.error.message}`,
      );
    }
    return tool.handler(validation.value, actorContext) as Promise<
      RaiToolResultMap[TName]
    >;
  }

  private async resolveJurisdictionId(companyId: string, code: string) {
    const jurisdiction = await this.prisma.jurisdiction.findFirst({
      where: { companyId, code: code.trim().toUpperCase() },
      select: { id: true, code: true },
    });
    if (!jurisdiction) {
      throw new BadRequestException(
        `В компании не найдена юрисдикция ${code.toUpperCase()} для регистрации контрагента.`,
      );
    }
    return jurisdiction;
  }

  private async findExistingPartyByInn(companyId: string, inn: string) {
    const parties = await this.partyService.listParties(companyId);
    return (
      parties.find((party) => {
        const registrationData =
          party.registrationData && typeof party.registrationData === "object"
            ? (party.registrationData as Record<string, unknown>)
            : {};
        const requisites =
          registrationData.requisites &&
          typeof registrationData.requisites === "object"
            ? (registrationData.requisites as Record<string, unknown>)
            : {};
        return (
          registrationData.inn === inn ||
          requisites.inn === inn
        );
      }) ?? null
    );
  }

  private resolveLookupPartyType(
    inn: string,
    explicitType?: "LEGAL_ENTITY" | "IP" | "KFH",
  ): "LEGAL_ENTITY" | "IP" | "KFH" {
    if (explicitType) {
      return explicitType;
    }
    if (inn.length === 10) {
      return "LEGAL_ENTITY";
    }
    return "IP";
  }

  private mapLookupTypeToPartyType(partyType: "LEGAL_ENTITY" | "IP" | "KFH") {
    if (partyType === "IP") {
      return "IP" as const;
    }
    if (partyType === "KFH") {
      return "KFH" as const;
    }
    return "LEGAL_ENTITY" as const;
  }

  private buildRegistrationData(
    inn: string,
    lookup: {
      status: string;
      result?: {
        requisites?: Record<string, unknown>;
        addresses?: Array<{ type: string; full: string }>;
        meta?: Record<string, unknown>;
      };
    },
  ) {
    return {
      inn,
      requisites: {
        ...(lookup.result?.requisites ?? {}),
        inn,
      },
      addresses: lookup.result?.addresses ?? [],
      meta: lookup.result?.meta ?? {},
      lookupStatus: lookup.status,
    };
  }

  private extractJurisdictionCode(
    party: { jurisdiction?: { code?: string | null } | null },
  ): string {
    return party.jurisdiction?.code ?? "RU";
  }
}
