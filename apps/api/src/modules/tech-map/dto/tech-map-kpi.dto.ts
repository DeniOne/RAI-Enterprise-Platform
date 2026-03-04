import { z } from "zod";

export const TechMapKPIResponseDtoSchema = z.object({
  costPerHa: z.number(),
  costPerTon: z.number(),
  grossRevenuePerHa: z.number(),
  marginPerHa: z.number(),
  marginPct: z.number(),
  riskAdjustedMarginPerHa: z.number(),
  variancePct: z.number().nullable(),
});

export type TechMapKPIResponseDto = z.infer<typeof TechMapKPIResponseDtoSchema>;
