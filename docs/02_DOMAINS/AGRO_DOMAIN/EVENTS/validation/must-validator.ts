import { Injectable } from '@nestjs/common';
import { EventDraft } from '../event-draft.schema';

@Injectable()
export class MustValidator {
    validateMust(draft: EventDraft): string[] {
        const missing: string[] = [];

        if (!draft.fieldRef) missing.push('fieldRef');
        if (!draft.timestamp) missing.push('timestamp');
        if (!draft.evidence || draft.evidence.length === 0) {
            missing.push('evidence');
        }

        // Дополнительная логика по типам событий
        if (draft.eventType === 'OBSERVATION') {
            const payload = draft.payload as any;
            if (!payload.observationKind) missing.push('payload.observationKind');
        }

        if (draft.eventType === 'FIELD_OPERATION') {
            const payload = draft.payload as any;
            if (!payload.operationType) missing.push('payload.operationType');
        }

        return missing;
    }
}
