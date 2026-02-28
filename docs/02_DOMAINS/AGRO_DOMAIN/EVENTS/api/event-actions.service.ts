import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventDraftRepository } from '../storage/event-draft.repository';
import { DraftLinkerService } from '../linking/draft-linker.service';
import { MustValidator } from '../validation/must-validator';
import { EventDraft } from '../event-draft.schema';
import * as crypto from 'crypto';

import { EventCommitterService } from '../commit/event-committer.service';
import { CommittedEvent } from '../event-draft.schema';

@Injectable()
export class EventActionsService {
    constructor(
        private readonly repository: EventDraftRepository,
        private readonly linker: DraftLinkerService,
        private readonly validator: MustValidator,
        private readonly committer: EventCommitterService,
    ) { }

    async fix(tenantId: string, userId: string, draftId: string, patch: any) {
        const draft = await this.repository.getDraft(tenantId, userId, draftId);

        // Патчим только разрешенные поля
        const updatedDraft = { ...draft };
        if (patch.farmRef) updatedDraft.farmRef = patch.farmRef;
        if (patch.fieldRef) updatedDraft.fieldRef = patch.fieldRef;
        if (patch.taskRef) updatedDraft.taskRef = patch.taskRef;

        if (patch.payload) {
            updatedDraft.payload = { ...(updatedDraft.payload as any), ...patch.payload };
        }

        if (patch.description) {
            (updatedDraft.payload as any).description = patch.description;
        }

        // Каскадный линкинг
        const linkedDraft = await this.linker.linkDraft(updatedDraft);

        // Перевалидация MUST
        linkedDraft.missingMust = this.validator.validateMust(linkedDraft);
        linkedDraft.status = linkedDraft.missingMust.length === 0 ? 'READY_FOR_CONFIRM' : 'DRAFT';

        const saved = await this.repository.updateDraft(tenantId, userId, draftId, linkedDraft);
        return { draft: saved, ui: this.buildUI(saved) };
    }

    async link(tenantId: string, userId: string, draftId: string, refs: any) {
        const draft = await this.repository.getDraft(tenantId, userId, draftId);

        if (refs.farmRef) draft.farmRef = refs.farmRef;
        if (refs.fieldRef) draft.fieldRef = refs.fieldRef;
        if (refs.taskRef) draft.taskRef = refs.taskRef;

        draft.missingMust = this.validator.validateMust(draft);
        draft.status = draft.missingMust.length === 0 ? 'READY_FOR_CONFIRM' : 'DRAFT';

        const saved = await this.repository.updateDraft(tenantId, userId, draftId, draft);
        return { draft: saved, ui: this.buildUI(saved) };
    }

    async confirm(tenantId: string, userId: string, draftId: string) {
        const draft = await this.repository.getDraft(tenantId, userId, draftId);

        if (draft.status === 'COMMITTED') {
            return { draft, ui: { message: '✅ Event already committed', buttons: ['CONFIRM', 'FIX', 'LINK'] } };
        }

        const missingMust = this.validator.validateMust(draft);
        if (missingMust.length > 0) {
            draft.missingMust = missingMust;
            draft.status = 'DRAFT';
            await this.repository.updateDraft(tenantId, userId, draftId, draft);
            return { draft, ui: this.buildUI(draft) };
        }

        // Формирование хеша провененса
        const provenanceHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({
                payload: draft.payload,
                evidence: draft.evidence,
                refs: { farm: draft.farmRef, field: draft.fieldRef, task: draft.taskRef },
                timestamp: draft.timestamp
            }))
            .digest('hex');

        // Коммит
        const event: CommittedEvent = {
            id: draft.id,
            tenantId,
            farmRef: draft.farmRef,
            fieldRef: draft.fieldRef,
            taskRef: draft.taskRef,
            eventType: draft.eventType,
            payload: draft.payload,
            evidence: draft.evidence,
            timestamp: draft.timestamp,
            committedAt: new Date().toISOString(),
            committedBy: userId,
            provenanceHash
        };

        await this.committer.commit(event);
        await this.repository.markCommitted(tenantId, userId, draftId);

        const finalDraft = await this.repository.getDraft(tenantId, userId, draftId);
        return {
            draft: finalDraft,
            ui: { message: '✅ Event committed successfully', buttons: ['CONFIRM', 'FIX', 'LINK'] }
        };
    }

    private buildUI(draft: EventDraft) {
        const mustQuestions = draft.missingMust.slice(0, 2).map(m => `Пожалуйста, укажи ${m}`);
        return {
            message: draft.status === 'READY_FOR_CONFIRM' ? 'Все данные готовы. Подтверждаем?' : 'Нужны уточнения по черновику.',
            buttons: ['CONFIRM', 'FIX', 'LINK'],
            mustQuestions: mustQuestions.length > 0 ? mustQuestions : undefined,
            linkCandidates: [] // Заглушка для кандидатов линковки
        };
    }
}
