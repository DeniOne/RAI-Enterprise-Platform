export const DEFAULT_EVENT_VERSION = 1;

// Event contract registry. Keep versions explicit for controlled evolution.
export const EVENT_CONTRACT_VERSIONS: Record<string, number[]> = {
  "consulting.operation.completed": [1],
  "finance.economic_event.created": [1],
};

export function resolveEventVersion(eventType: string, payload: any): number {
  const candidate = payload?.eventVersion;
  if (Number.isInteger(candidate) && candidate > 0) {
    return candidate;
  }
  const allowed = EVENT_CONTRACT_VERSIONS[eventType];
  if (Array.isArray(allowed) && allowed.length > 0) {
    return allowed[allowed.length - 1];
  }
  return DEFAULT_EVENT_VERSION;
}

export function isEventVersionAllowed(
  eventType: string,
  version: number,
): boolean {
  if (!Number.isInteger(version) || version <= 0) {
    return false;
  }
  const allowed = EVENT_CONTRACT_VERSIONS[eventType];
  if (!allowed || allowed.length === 0) {
    // For unknown event types, accept v1 by default to avoid hard break.
    return version === DEFAULT_EVENT_VERSION;
  }
  return allowed.includes(version);
}
