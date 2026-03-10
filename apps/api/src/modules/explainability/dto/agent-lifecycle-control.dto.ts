import { z } from "zod";

export const SetAgentLifecycleOverrideDtoSchema = z.object({
  role: z.string().trim().min(1),
  state: z.enum(["FROZEN", "RETIRED"]),
  reason: z.string().trim().min(3),
});

export const ClearAgentLifecycleOverrideDtoSchema = z.object({
  role: z.string().trim().min(1),
});

export type SetAgentLifecycleOverrideDto = z.infer<
  typeof SetAgentLifecycleOverrideDtoSchema
>;

export type ClearAgentLifecycleOverrideDto = z.infer<
  typeof ClearAgentLifecycleOverrideDtoSchema
>;
