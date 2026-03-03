import { z } from "zod";

const stringArraySchema = z.array(z.string().min(1)).optional();

export const inputTypeSchema = z.enum([
  "SEED",
  "FERTILIZER_SOLID",
  "FERTILIZER_LIQUID",
  "PESTICIDE_HERBICIDE",
  "PESTICIDE_FUNGICIDE",
  "PESTICIDE_INSECTICIDE",
  "GROWTH_REGULATOR",
  "FUEL",
  "SERVICE",
]);

export const InputCatalogCreateDtoSchema = z.object({
  name: z.string().min(1).max(160),
  inputType: inputTypeSchema,
  formulation: z.string().max(160).optional(),
  activeSubstances: stringArraySchema,
  registrationNumber: z.string().max(128).optional(),
  supplier: z.string().max(160).optional(),
  legalRestrictions: stringArraySchema,
  incompatibleWith: z.array(z.string().min(1).max(128)).optional(),
  companyId: z.string().min(1).max(128).optional(),
});

export const InputCatalogResponseDtoSchema = InputCatalogCreateDtoSchema.extend({
  id: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type InputCatalogCreateDto = z.infer<typeof InputCatalogCreateDtoSchema>;
export type InputCatalogResponseDto = z.infer<typeof InputCatalogResponseDtoSchema>;
