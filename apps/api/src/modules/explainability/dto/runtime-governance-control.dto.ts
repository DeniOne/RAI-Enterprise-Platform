import { z } from "zod";

export const SetRuntimeAutonomyOverrideDtoSchema = z.object({
  level: z.enum(["TOOL_FIRST", "QUARANTINE"]),
  reason: z.string().min(3).max(500),
});

export type SetRuntimeAutonomyOverrideDto = z.infer<
  typeof SetRuntimeAutonomyOverrideDtoSchema
>;
