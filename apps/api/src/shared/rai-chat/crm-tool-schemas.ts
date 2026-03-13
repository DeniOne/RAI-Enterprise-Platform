import * as Joi from "joi";
import { ObjectSchema } from "joi";
import {
  CreateCounterpartyRelationPayload,
  CreateCrmAccountPayload,
  CreateCrmContactPayload,
  CreateCrmInteractionPayload,
  CreateCrmObligationPayload,
  DeleteCrmContactPayload,
  DeleteCrmInteractionPayload,
  DeleteCrmObligationPayload,
  GetCrmAccountWorkspacePayload,
  LookupCounterpartyByInnPayload,
  RegisterCounterpartyPayload,
  UpdateCrmAccountPayload,
  UpdateCrmContactPayload,
  UpdateCrmInteractionPayload,
  UpdateCrmObligationPayload,
} from "./rai-tools.types";

export const lookupCounterpartyByInnSchema: ObjectSchema<LookupCounterpartyByInnPayload> =
  Joi.object<LookupCounterpartyByInnPayload>({
    inn: Joi.string().trim().pattern(/^\d{10}(\d{2})?$/).required(),
    jurisdictionCode: Joi.string().valid("RU", "BY", "KZ").default("RU"),
    partyType: Joi.string().valid("LEGAL_ENTITY", "IP", "KFH").optional(),
  });

export const registerCounterpartySchema: ObjectSchema<RegisterCounterpartyPayload> =
  Joi.object<RegisterCounterpartyPayload>({
    inn: Joi.string().trim().pattern(/^\d{10}(\d{2})?$/).required(),
    jurisdictionCode: Joi.string().valid("RU", "BY", "KZ").default("RU"),
    partyType: Joi.string().valid("LEGAL_ENTITY", "IP", "KFH").optional(),
    legalName: Joi.string().trim().max(255).optional(),
    shortName: Joi.string().trim().max(255).optional(),
    comment: Joi.string().trim().max(500).optional(),
  });

export const createCounterpartyRelationSchema: ObjectSchema<CreateCounterpartyRelationPayload> =
  Joi.object<CreateCounterpartyRelationPayload>({
    fromPartyId: Joi.string().trim().max(128).required(),
    toPartyId: Joi.string().trim().max(128).required(),
    relationType: Joi.string()
      .valid("OWNERSHIP", "MANAGEMENT", "AFFILIATED", "AGENCY")
      .required(),
    sharePct: Joi.number().min(0).max(100).optional(),
    validFrom: Joi.string().trim().required(),
    validTo: Joi.string().trim().optional(),
  });

export const createCrmAccountSchema: ObjectSchema<CreateCrmAccountPayload> =
  Joi.object<CreateCrmAccountPayload>({
    name: Joi.string().trim().max(255).required(),
    inn: Joi.string().trim().pattern(/^\d{10}(\d{2})?$/).optional(),
    type: Joi.string().trim().max(64).optional(),
    holdingId: Joi.string().trim().max(128).optional(),
  });

export const getCrmAccountWorkspaceSchema: ObjectSchema<GetCrmAccountWorkspacePayload> =
  Joi.object<GetCrmAccountWorkspacePayload>({
    accountId: Joi.string().trim().max(128).required(),
  });

export const updateCrmAccountSchema: ObjectSchema<UpdateCrmAccountPayload> =
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
  });

export const createCrmContactSchema: ObjectSchema<CreateCrmContactPayload> =
  Joi.object<CreateCrmContactPayload>({
    accountId: Joi.string().trim().max(128).required(),
    firstName: Joi.string().trim().max(120).required(),
    lastName: Joi.string().trim().max(120).optional(),
    role: Joi.string().trim().max(64).optional(),
    influenceLevel: Joi.number().min(0).max(10).optional(),
    email: Joi.string().trim().max(160).optional(),
    phone: Joi.string().trim().max(64).optional(),
    source: Joi.string().trim().max(160).optional(),
  });

export const updateCrmContactSchema: ObjectSchema<UpdateCrmContactPayload> =
  Joi.object<UpdateCrmContactPayload>({
    contactId: Joi.string().trim().max(128).required(),
    firstName: Joi.string().trim().max(120).optional(),
    lastName: Joi.string().trim().allow(null).max(120).optional(),
    role: Joi.string().trim().max(64).optional(),
    influenceLevel: Joi.number().min(0).max(10).allow(null).optional(),
    email: Joi.string().trim().allow(null).max(160).optional(),
    phone: Joi.string().trim().allow(null).max(64).optional(),
    source: Joi.string().trim().allow(null).max(160).optional(),
  });

export const deleteCrmContactSchema: ObjectSchema<DeleteCrmContactPayload> =
  Joi.object<DeleteCrmContactPayload>({
    contactId: Joi.string().trim().max(128).required(),
  });

export const createCrmInteractionSchema: ObjectSchema<CreateCrmInteractionPayload> =
  Joi.object<CreateCrmInteractionPayload>({
    accountId: Joi.string().trim().max(128).required(),
    type: Joi.string().trim().max(64).required(),
    summary: Joi.string().trim().max(1000).required(),
    date: Joi.string().trim().optional(),
    contactId: Joi.string().trim().allow(null).optional(),
    relatedEventId: Joi.string().trim().allow(null).optional(),
  });

export const updateCrmInteractionSchema: ObjectSchema<UpdateCrmInteractionPayload> =
  Joi.object<UpdateCrmInteractionPayload>({
    interactionId: Joi.string().trim().max(128).required(),
    type: Joi.string().trim().max(64).optional(),
    summary: Joi.string().trim().max(1000).optional(),
    date: Joi.string().trim().optional(),
    contactId: Joi.string().trim().allow(null).optional(),
    relatedEventId: Joi.string().trim().allow(null).optional(),
  });

export const deleteCrmInteractionSchema: ObjectSchema<DeleteCrmInteractionPayload> =
  Joi.object<DeleteCrmInteractionPayload>({
    interactionId: Joi.string().trim().max(128).required(),
  });

export const createCrmObligationSchema: ObjectSchema<CreateCrmObligationPayload> =
  Joi.object<CreateCrmObligationPayload>({
    accountId: Joi.string().trim().max(128).required(),
    description: Joi.string().trim().max(1000).required(),
    dueDate: Joi.string().trim().required(),
    responsibleUserId: Joi.string().trim().allow(null).optional(),
    status: Joi.string().trim().max(64).optional(),
  });

export const updateCrmObligationSchema: ObjectSchema<UpdateCrmObligationPayload> =
  Joi.object<UpdateCrmObligationPayload>({
    obligationId: Joi.string().trim().max(128).required(),
    description: Joi.string().trim().max(1000).optional(),
    dueDate: Joi.string().trim().optional(),
    responsibleUserId: Joi.string().trim().allow(null).optional(),
    status: Joi.string().trim().max(64).optional(),
  });

export const deleteCrmObligationSchema: ObjectSchema<DeleteCrmObligationPayload> =
  Joi.object<DeleteCrmObligationPayload>({
    obligationId: Joi.string().trim().max(128).required(),
  });
