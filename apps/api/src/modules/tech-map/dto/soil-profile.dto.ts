import { z } from "zod";

const provenanceSchema = z.record(z.unknown()).optional();
const otherElementsSchema = z.record(z.unknown()).optional();

export const soilGranulometricTypeSchema = z.enum([
  "CLAY",
  "CLAY_LOAM",
  "LOAM",
  "SANDY_LOAM",
  "LOAMY_SAND",
  "SAND",
]);

export const SoilProfileCreateDtoSchema = z.object({
  fieldId: z.string().min(1).max(128),
  sampleDate: z.coerce.date(),
  ph: z.number().min(3.5).max(9.0).optional(),
  humusPercent: z.number().min(0).max(15).optional(),
  p2o5MgKg: z.number().min(0).max(1000).optional(),
  k2oMgKg: z.number().min(0).max(1000).optional(),
  sMgKg: z.number().min(0).max(500).optional(),
  bMgKg: z.number().min(0).max(10).optional(),
  nMineralMgKg: z.number().min(0).optional(),
  bulkDensityGCm3: z.number().min(0.8).max(1.7).optional(),
  granulometricType: soilGranulometricTypeSchema.optional(),
  otherElements: otherElementsSchema,
  provenance: provenanceSchema,
  confidence: z.number().min(0).max(1).optional(),
  companyId: z.string().min(1).max(128),
});

export const SoilProfileResponseDtoSchema = SoilProfileCreateDtoSchema.extend({
  id: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type SoilProfileCreateDto = z.infer<typeof SoilProfileCreateDtoSchema>;
export type SoilProfileResponseDto = z.infer<typeof SoilProfileResponseDtoSchema>;
