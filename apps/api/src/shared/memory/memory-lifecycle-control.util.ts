export interface MemoryLifecyclePauseState {
  paused: boolean;
  until: string | null;
  remainingSeconds: number;
  reason: string | null;
  invalid: boolean;
}

export function resolveMemoryLifecyclePause(
  untilRaw?: string,
  reasonRaw?: string,
  nowMs: number = Date.now(),
): MemoryLifecyclePauseState {
  const normalizedUntil = untilRaw?.trim();
  const normalizedReason = reasonRaw?.trim() || null;

  if (!normalizedUntil) {
    return {
      paused: false,
      until: null,
      remainingSeconds: 0,
      reason: normalizedReason,
      invalid: false,
    };
  }

  const untilMs = Date.parse(normalizedUntil);
  if (!Number.isFinite(untilMs)) {
    return {
      paused: false,
      until: normalizedUntil,
      remainingSeconds: 0,
      reason: normalizedReason,
      invalid: true,
    };
  }

  return {
    paused: untilMs > nowMs,
    until: new Date(untilMs).toISOString(),
    remainingSeconds: Math.max(0, Math.ceil((untilMs - nowMs) / 1000)),
    reason: normalizedReason,
    invalid: false,
  };
}
