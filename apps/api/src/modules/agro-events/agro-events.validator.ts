import { Injectable } from "@nestjs/common";
import { AgroEventDraftRecord } from "./agro-events.types";

@Injectable()
export class AgroEventsMustValidator {
  validateMust(draft: AgroEventDraftRecord): string[] {
    const missing: string[] = [];

    if (!draft.fieldRef) {
      missing.push("fieldRef");
    }

    if (!draft.timestamp) {
      missing.push("timestamp");
    }

    if (!draft.evidence || draft.evidence.length === 0) {
      missing.push("evidence");
    }

    if (draft.eventType === "OBSERVATION" && !draft.payload?.observationKind) {
      missing.push("payload.observationKind");
    }

    if (draft.eventType === "FIELD_OPERATION" && !draft.payload?.operationType) {
      missing.push("payload.operationType");
    }

    return missing;
  }
}
