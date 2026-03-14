import { Injectable } from '@nestjs/common';
import { EventDraft } from '../event-draft.schema';

@Injectable()
export class DraftLinkerService {
    async linkDraft(draft: EventDraft): Promise<EventDraft> {
        // Stub: в реальности здесь будет поиск по контексту (геопозиция, время, активные задачи)
        // Сейчас просто возвращаем как есть.
        return draft;
    }
}
