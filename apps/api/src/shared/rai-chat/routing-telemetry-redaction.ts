import {
  RoutingTelemetryEvent,
  RoutingOutcomeType,
} from "./semantic-routing.types";

const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN =
  /(?<!\d)(?:\+?\d[\d\s().-]{8,}\d)(?!\d)/g;
const LONG_NUMBER_PATTERN = /\b\d{10,19}\b/g;

export function redactRoutingFreeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value
    .replace(EMAIL_PATTERN, "[скрыт_email]")
    .replace(PHONE_PATTERN, "[скрыт_телефон]")
    .replace(LONG_NUMBER_PATTERN, "[скрыт_номер]");
}

export function sanitizeRoutingTelemetry(
  event: RoutingTelemetryEvent,
): RoutingTelemetryEvent {
  return {
    ...event,
    userQueryRedacted: redactRoutingFreeText(event.userQueryRedacted),
    retrievedCaseMemory: event.retrievedCaseMemory?.map((item) => ({
      ...item,
      sampleQuery: redactRoutingFreeText(item.sampleQuery ?? null) || null,
    })),
    userCorrection: event.userCorrection
      ? {
          decision: event.userCorrection.decision,
          reason: redactRoutingFreeText(event.userCorrection.reason ?? null) || null,
        }
      : null,
    finalOutcome: event.finalOutcome ?? RoutingOutcomeType.Unknown,
  };
}
