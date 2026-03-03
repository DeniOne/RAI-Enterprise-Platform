import { z } from "zod";

const stringArraySchema = z.array(z.string().min(1)).optional();
const jsonRecordSchema = z.record(z.unknown()).optional();

export const climateTypeSchema = z.enum([
  "MARITIME_HUMID",
  "STEPPE_DRY",
  "CONTINENTAL_COLD",
]);

export const RegionProfileCreateDtoSchema = z.object({
  name: z.string().min(1).max(160),
  climateType: climateTypeSchema,
  gddBaseTempC: z.number().min(0).max(10).optional(),
  avgGddSeason: z.number().min(0).optional(),
  precipitationMm: z.number().min(0).optional(),
  frostRiskIndex: z.number().min(0).max(1).optional(),
  droughtRiskIndex: z.number().min(0).max(1).optional(),
  waterloggingRiskIndex: z.number().min(0).max(1).optional(),
  majorDiseases: stringArraySchema,
  majorPests: stringArraySchema,
  htcCoefficient: z.number().optional(),
  typicalSowingWindows: jsonRecordSchema,
  overwinteringRiskProfile: jsonRecordSchema,
  updateSource: z.string().max(255).optional(),
  companyId: z.string().min(1).max(128).optional(),
});

export const RegionProfileResponseDtoSchema = RegionProfileCreateDtoSchema.extend({
  id: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type RegionProfileCreateDto = z.infer<typeof RegionProfileCreateDtoSchema>;
export type RegionProfileResponseDto = z.infer<typeof RegionProfileResponseDtoSchema>;
