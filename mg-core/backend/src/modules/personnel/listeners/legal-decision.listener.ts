import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';
import { HRDomainEventService } from '../services/hr-domain-event.service';

/**
 * LegalDecisionListener
 * 
 * Listens to Legal module decisions on document deletion
 * Executes deletion ONLY if approved by Legal
 */
@Injectable()
export class LegalDecisionListener {
    constructor(
        private readonly prisma: PrismaService,
        private readonly hrEventService: HRDomainEventService,
    ) { }

    @OnEvent('document.deletion_approved')
    async handleDeletionApproved(payload: DeletionApprovedEvent) {
        // Execute deletion
        await this.prisma.personnelDocument.delete({
            where: { id: payload.documentId },
        });

        // Emit audit event
        await this.hrEventService.emit({
            eventType: 'DOCUMENT_UPLOADED', // Reuse for deletion tracking
            aggregateType: 'PERSONNEL_DOCUMENT',
            aggregateId: payload.documentId,
            actorId: payload.approvedBy,
            actorRole: 'LEGAL',
            payload: {
                action: 'DELETE',
                reason: payload.reason,
                legalApproval: true,
            },
        });

        console.log(`[LegalDecisionListener] Document ${payload.documentId} deleted (Legal approved)`);
    }

    @OnEvent('document.deletion_denied')
    async handleDeletionDenied(payload: DeletionDeniedEvent) {
        // Log denial
        console.warn('[LEGAL] Document deletion denied:', {
            documentId: payload.documentId,
            reason: payload.reason,
            earliestDeletionDate: payload.earliestDeletionDate,
        });

        // TODO: Send notification to requester
        // TODO: Update document status to DELETION_DENIED
    }
}

interface DeletionApprovedEvent {
    documentId: string;
    approvedBy: string;
    reason: string;
}

interface DeletionDeniedEvent {
    documentId: string;
    reason: string;
    earliestDeletionDate: string;
}
