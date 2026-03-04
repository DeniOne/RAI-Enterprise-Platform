import { TriggerOperator, TriggerType } from "@rai/prisma-client";
import { z } from "zod";

const cuidSchema = z.string().cuid();

export const AdaptiveRuleConditionSchema = z.object({
  parameter: z.string().min(1),
  operator: z.nativeEnum(TriggerOperator),
  threshold: z.number(),
  unit: z.string().min(1).optional(),
});

export const AdaptiveRuleCreateDtoSchema = z.object({
  techMapId: cuidSchema,
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  triggerType: z.nativeEnum(TriggerType),
  condition: AdaptiveRuleConditionSchema,
  affectedOperationIds: z.array(cuidSchema),
  changeTemplate: z.record(z.unknown()),
  requiresApprovalRole: z.string().min(1).max(128).optional(),
  isActive: z.boolean().optional(),
});

export const AdaptiveRuleResponseDtoSchema = AdaptiveRuleCreateDtoSchema.extend({
  id: cuidSchema,
  companyId: z.string().min(1).max(128),
  lastEvaluatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AdaptiveRuleCreateDto = z.infer<typeof AdaptiveRuleCreateDtoSchema>;
export type AdaptiveRuleResponseDto = z.infer<typeof AdaptiveRuleResponseDtoSchema>;
