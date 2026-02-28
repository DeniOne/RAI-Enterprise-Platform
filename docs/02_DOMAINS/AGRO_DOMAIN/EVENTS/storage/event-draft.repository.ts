import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../apps/api/src/shared/prisma/prisma.service';
import { EventDraft } from '../event-draft.schema';

@Injectable()
export class EventDraftRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createDraft(companyId: string, userId: string, draft: EventDraft): Promise<EventDraft> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const created = await this.prisma.agroEventDraft.create({
            data: {
                id: draft.id,
                companyId,
                userId,
                status: draft.status,
                eventType: draft.eventType,
                timestamp: new Date(draft.timestamp),
                farmRef: draft.farmRef || null,
                fieldRef: draft.fieldRef || null,
                taskRef: draft.taskRef || null,
                payloadJson: draft.payload as any,
                evidenceJson: draft.evidence as any,
                confidence: draft.confidence,
                missingMust: draft.missingMust,
                expiresAt,
            },
        });

        return this.mapToDraft(created);
    }

    async getDraft(companyId: string, userId: string, draftId: string): Promise<EventDraft> {
        const draft = await this.prisma.agroEventDraft.findFirst({
            where: { id: draftId, companyId, userId },
        });

        if (!draft) {
            throw new NotFoundException(`Draft ${draftId} not found or access denied`);
        }

        return this.mapToDraft(draft);
    }

    async updateDraft(companyId: string, userId: string, draftId: string, patch: Partial<EventDraft>): Promise<EventDraft> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const data: any = { ...patch };
        if (patch.timestamp) data.timestamp = new Date(patch.timestamp);
        if (patch.payload) data.payloadJson = patch.payload;
        if (patch.evidence) data.evidenceJson = patch.evidence;
        data.expiresAt = expiresAt;

        // Remove fields that are not in the DB model
        delete data.id;
        delete data.createdAt;
        delete data.payload;
        delete data.evidence;

        const updated = await this.prisma.agroEventDraft.update({
            where: { id: draftId, companyId, userId },
            data,
        });

        return this.mapToDraft(updated);
    }

    async markCommitted(companyId: string, userId: string, draftId: string): Promise<void> {
        await this.prisma.agroEventDraft.update({
            where: { id: draftId, companyId, userId },
            data: {
                status: 'COMMITTED',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
        });
    }

    async deleteExpired(now: Date): Promise<number> {
        const result = await this.prisma.agroEventDraft.deleteMany({
            where: {
                expiresAt: { lt: now },
                status: { not: 'COMMITTED' },
            },
        });
        return result.count;
    }

    private mapToDraft(db: any): EventDraft {
        return {
            id: db.id,
            eventType: db.eventType as any,
            timestamp: db.timestamp.toISOString(),
            farmRef: db.farmRef,
            fieldRef: db.fieldRef,
            taskRef: db.taskRef,
            payload: db.payloadJson,
            evidence: db.evidenceJson,
            confidence: db.confidence,
            missingMust: db.missingMust,
            status: db.status as any,
            createdAt: db.createdAt.toISOString(),
        };
    }
}
