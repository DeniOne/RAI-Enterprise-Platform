import { z } from "zod";

export const changeOrderTypeSchema = z.enum([
  "SHIFT_DATE",
  "CHANGE_INPUT",
  "CHANGE_RATE",
  "CANCEL_OP",
  "ADD_OP",
]);

export const changeOrderStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
]);

export const ChangeOrderCreateDtoSchema = z.object({
  versionFrom: z.number().int().min(1),
  changeType: changeOrderTypeSchema,
  reason: z.string().min(1).max(1000),
  diffPayload: z.record(z.unknown()),
  deltaCostRub: z.number().optional(),
  triggeredByObsId: z.string().min(1).max(128).optional(),
  createdByUserId: z.string().min(1).max(128).optional(),
});

export const ChangeOrderResponseDtoSchema = ChangeOrderCreateDtoSchema.extend({
  id: z.string().min(1).max(128),
  techMapId: z.string().min(1).max(128),
  versionTo: z.number().int().min(1).optional(),
  status: changeOrderStatusSchema,
  appliedAt: z.coerce.date().optional(),
  companyId: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ChangeOrderCreateDto = z.infer<typeof ChangeOrderCreateDtoSchema>;
export type ChangeOrderResponseDto = z.infer<typeof ChangeOrderResponseDtoSchema>;
