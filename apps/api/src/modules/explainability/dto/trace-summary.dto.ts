import { z } from "zod";

export const TraceSummaryDtoSchema = z.object({
  id: z.string().min(1).max(128),
  traceId: z.string().min(1).max(128),
  companyId: z.string().min(1).max(128),

  totalTokens: z.number().int().min(0),
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  durationMs: z.number().int().min(0),

  modelId: z.string().min(1).max(256),
  promptVersion: z.string().min(1).max(256),
  toolsVersion: z.string().min(1).max(256),
  policyId: z.string().min(1).max(256),

  evidenceCoveragePct: z.number().min(0).max(100).nullable(),
  invalidClaimsPct: z.number().min(0).max(100).nullable(),
  bsScorePct: z.number().min(0).max(100).nullable(),

  createdAt: z.coerce.date(),
});

export type TraceSummaryDto = z.infer<typeof TraceSummaryDtoSchema>;

