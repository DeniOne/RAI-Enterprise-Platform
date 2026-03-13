export interface RaiToolCallLogPayloadInput {
  toolName: string;
  companyId: string;
  traceId: string;
  success: boolean;
  payload: unknown;
  reason?: string;
}

export function serializeToolPayload(payload: unknown): unknown {
  if (payload === undefined) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return "[unserializable_payload]";
  }
}

export function buildToolCallLogPayload(
  input: RaiToolCallLogPayloadInput,
): string {
  return JSON.stringify({
    toolName: input.toolName,
    companyId: input.companyId,
    traceId: input.traceId,
    status: input.success ? "success" : "fail",
    payload: serializeToolPayload(input.payload),
    reason: input.reason,
  });
}
