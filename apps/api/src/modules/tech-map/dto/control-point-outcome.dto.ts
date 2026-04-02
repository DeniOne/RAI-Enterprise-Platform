import { z } from "zod";
import { changeOrderTypeSchema } from "./change-order.dto";

const jsonRecordSchema = z.record(z.unknown()).optional();

export const controlPointOutcomeSeveritySchema = z.enum([
  "INFO",
  "WARNING",
  "CRITICAL",
  "BLOCKER",
]);

export const controlPointOutcomeStatusSchema = z.enum([
  "PASS",
  "WARNING",
  "FAIL",
  "BLOCKED",
]);

export const ControlPointOutcomeDtoSchema = z.object({
  outcome: controlPointOutcomeStatusSchema,
  severity: controlPointOutcomeSeveritySchema,
  summary: z.string().min(1).max(2000),
  payload: jsonRecordSchema,
  observationId: z.string().min(1).max(128).optional(),
  operationId: z.string().min(1).max(128).optional(),
  decisiveAction: z.boolean().optional(),
  completeOperation: z.boolean().optional(),
  recommendationTitle: z.string().min(1).max(200).optional(),
  recommendationMessage: z.string().min(1).max(2000).optional(),
  decisionGateTitle: z.string().min(1).max(200).optional(),
  aiImpactAssessment: z.string().min(1).max(2000).optional(),
  changeOrder: z
    .object({
      changeType: changeOrderTypeSchema,
      reason: z.string().min(1).max(1000).optional(),
      diffPayload: z.record(z.unknown()),
      deltaCostRub: z.number().optional(),
    })
    .optional(),
});

export type ControlPointOutcomeDto = z.infer<typeof ControlPointOutcomeDtoSchema>;
