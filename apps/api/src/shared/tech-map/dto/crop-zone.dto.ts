import { z } from "zod";

const stringArraySchema = z.array(z.string().min(1)).optional();
const jsonRecordSchema = z.record(z.unknown()).optional();

export const CropZoneCreateDtoSchema = z.object({
  fieldId: z.string().min(1).max(128),
  seasonId: z.string().min(1).max(128),
  cropType: z.string().min(1).max(64),
  varietyHybrid: z.string().max(160).optional(),
  predecessorCrop: z.string().max(160).optional(),
  targetYieldTHa: z.number().min(0).optional(),
  targetQuality: jsonRecordSchema,
  assumptions: stringArraySchema,
  constraints: stringArraySchema,
  provenance: jsonRecordSchema,
  confidence: z.number().min(0).max(1).optional(),
  companyId: z.string().min(1).max(128),
});

export const CropZoneResponseDtoSchema = CropZoneCreateDtoSchema.extend({
  id: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CropZoneCreateDto = z.infer<typeof CropZoneCreateDtoSchema>;
export type CropZoneResponseDto = z.infer<typeof CropZoneResponseDtoSchema>;
