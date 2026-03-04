import { BudgetCategory } from "@rai/prisma-client";
import { z } from "zod";

const cuidSchema = z.string().cuid();

export const BudgetLineCreateDtoSchema = z.object({
  id: cuidSchema.optional(),
  category: z.nativeEnum(BudgetCategory),
  description: z.string().max(500).optional(),
  plannedCost: z.number().positive(),
  actualCost: z.number().nonnegative().optional(),
  tolerancePct: z.number().min(0).max(1).default(0.1),
  unit: z.string().min(1).max(32).optional(),
  plannedQty: z.number().positive().optional(),
  actualQty: z.number().nonnegative().optional(),
  unitPrice: z.number().nonnegative().optional(),
  operationId: cuidSchema.optional(),
});

export const BudgetLineResponseDtoSchema = BudgetLineCreateDtoSchema.extend({
  id: cuidSchema,
  techMapId: cuidSchema,
  companyId: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type BudgetLineCreateDto = z.infer<typeof BudgetLineCreateDtoSchema>;
export type BudgetLineResponseDto = z.infer<typeof BudgetLineResponseDtoSchema>;
