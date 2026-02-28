import { Controller, Post, Body } from '@nestjs/common';
import { EventDraftRepository } from '../storage/event-draft.repository';
// import { DraftBuilderService } from './draft-builder.service'; // Placeholder
// import { DraftLinkerService } from '../linking/draft-linker.service';
// import { MustValidator } from '../validation/must-validator';

@Controller('api/agro/telegram')
export class TelegramIntakeController {
    constructor(
        private readonly repository: EventDraftRepository,
        // private readonly builder: DraftBuilderService,
        // private readonly linker: DraftLinkerService,
        // private readonly validator: MustValidator,
    ) { }

    @Post('intake')
    async intake(@Body() update: any) {
        // 1. Build draft from Telegram update (text/voice/photo)
        // const draft = await this.builder.build(update);

        // 2. Initial logic (Mock for now)
        const draft: any = {
            id: `draft_${Date.now()}`,
            eventType: 'OBSERVATION',
            timestamp: new Date().toISOString(),
            payload: { description: update.text || 'Voice/Media capture' },
            evidence: [],
            confidence: 0.8,
            status: 'DRAFT',
            missingMust: ['fieldRef', 'evidence']
        };

        // 3. Persist Draft
        const tenantId = '441610858';
        const userId = update.message?.from?.id?.toString() || 'system';

        const saved = await this.repository.createDraft(tenantId, userId, draft);

        // 4. Return UI response with draftId in buttons
        return {
            draft: saved,
            ui: {
                message: `Черновик создан (ID: ${saved.id}). Нужно уточнить поле и добавить фото.`,
                buttons: ['CONFIRM', 'FIX', 'LINK'],
                mustQuestions: ['В каком поле это происходит?', 'Пришли фото-доказательство'],
                draftId: saved.id
            }
        };
    }
}