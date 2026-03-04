import { z } from "zod";

const jsonRecordSchema = z.record(z.unknown()).optional();

export const evidenceTypeSchema = z.enum([
  "PHOTO",
  "VIDEO",
  "GEO_TRACK",
  "LAB_REPORT",
  "INVOICE",
  "CONTRACT",
  "WEATHER_API_SNAPSHOT",
  "SATELLITE_IMAGE",
]);

export const EvidenceCreateDtoSchema = z.object({
  operationId: z.string().min(1).max(128).optional(),
  observationId: z.string().min(1).max(128).optional(),
  evidenceType: evidenceTypeSchema,
  fileUrl: z.string().url().max(2048),
  geoPoint: jsonRecordSchema,
  capturedAt: z.coerce.date(),
  capturedByUserId: z.string().min(1).max(128).optional(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  metadata: jsonRecordSchema,
  companyId: z.string().min(1).max(128),
});

export const EvidenceResponseDtoSchema = EvidenceCreateDtoSchema.extend({
  id: z.string().min(1).max(128),
  createdAt: z.coerce.date(),
});

export type EvidenceCreateDto = z.infer<typeof EvidenceCreateDtoSchema>;
export type EvidenceResponseDto = z.infer<typeof EvidenceResponseDtoSchema>;
