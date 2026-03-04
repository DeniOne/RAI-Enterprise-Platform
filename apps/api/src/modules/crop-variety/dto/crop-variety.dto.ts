import { z } from "zod";

export const CropTypeSchema = z.enum([
  "RAPESEED",
  "WINTER_WHEAT",
  "SPRING_WHEAT",
  "CORN",
  "SUNFLOWER",
  "BARLEY",
  "OTHER",
]);

export const CropVarietyCreateDtoSchema = z.object({
  name: z.string().min(1).max(120),
  variety: z.string().max(120).optional(),
  reproduction: z.string().max(120).optional(),
  type: z.enum(["WINTER", "SPRING"]),
  cropType: CropTypeSchema,
  oilContent: z.number().optional(),
  erucicAcid: z.number().optional(),
  glucosinolates: z.number().optional(),
  vegetationPeriod: z.number().int().positive(),
  sowingNormMin: z.number().optional(),
  sowingNormMax: z.number().optional(),
  sowingDepthMin: z.number().optional(),
  sowingDepthMax: z.number().optional(),
});

export const CropVarietyUpdateDtoSchema = CropVarietyCreateDtoSchema.partial().extend({
  id: z.string().min(1),
  changeReason: z.string().max(300).optional(),
});

export const CropVarietyResponseDtoSchema = CropVarietyCreateDtoSchema.extend({
  id: z.string(),
  version: z.number().int().positive(),
  isLatest: z.boolean(),
  companyId: z.string().nullable().optional(),
});

export type CropVarietyCreateDto = z.infer<typeof CropVarietyCreateDtoSchema>;
export type CropVarietyUpdateDto = z.infer<typeof CropVarietyUpdateDtoSchema>;
export type CropVarietyResponseDto = z.infer<typeof CropVarietyResponseDtoSchema>;
