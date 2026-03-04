import { z } from "zod";

export const HybridPhenologyCreateDtoSchema = z.object({
  hybridName: z.string().min(1).max(160),
  cropType: z.string().min(1).max(80),
  gddToStage: z.record(z.string(), z.number().nonnegative()),
  baseTemp: z.number().min(0).max(15),
  source: z.string().max(255).optional(),
  companyId: z.string().min(1).max(128).nullable().optional(),
});

export type HybridPhenologyCreateDto = z.infer<typeof HybridPhenologyCreateDtoSchema>;
