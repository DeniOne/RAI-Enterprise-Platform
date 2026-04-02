import { IntegrityStatus, ObservationIntent, ObservationType } from "@rai/prisma-client";
import { z } from "zod";

const jsonValueSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const ExecutionObservationCreateDtoSchema = z
  .object({
    operationId: z.string().min(1).max(128),
    type: z.nativeEnum(ObservationType),
    intent: z.nativeEnum(ObservationIntent).optional(),
    integrityStatus: z.nativeEnum(IntegrityStatus).optional(),
    content: z.string().min(1).max(4000).optional(),
    photoUrl: z.string().url().max(2048).optional(),
    voiceUrl: z.string().url().max(2048).optional(),
    coordinates: jsonValueSchema.optional(),
    telemetryJson: jsonValueSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasPayload = Boolean(
      value.content?.trim() ||
        value.photoUrl?.trim() ||
        value.voiceUrl?.trim() ||
        value.coordinates ||
        value.telemetryJson,
    );

    if (!hasPayload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Execution observation требует content, photoUrl, voiceUrl, coordinates или telemetryJson",
        path: ["content"],
      });
    }
  });

export type ExecutionObservationCreateDto = z.infer<
  typeof ExecutionObservationCreateDtoSchema
>;
