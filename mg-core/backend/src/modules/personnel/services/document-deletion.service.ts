import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * DocumentDeletionService
 * 
 * CRITICAL: Decision-based deletion flow (NOT direct delete)
 * 
 * Architecture:
 * - Personnel requests deletion from Legal
 * - Legal checks retention policy
 * - Legal emits document.deletion_approved OR document.deletion_denied
 * - Personnel executes deletion ONLY if approved
 * 
 * Personnel does NOT:
 * - Check retention policies
 * - Make deletion decisions
 * - Delete without Legal approval
 */
@Injectable()
export class DocumentDeletionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async requestDeletion(documentId: string, actorId: string, reason: string): Promise<void> {
        const document = await this.prisma.personnelDocument.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Emit deletion request to Legal
        this.eventEmitter.emit('document.deletion_requested', {
            documentId,
            documentType: document.documentType,
            createdAt: document.createdAt,
            requestedBy: actorId,
            reason,
            timestamp: new Date().toISOString(),
        });

        console.log(`[DocumentDeletionService] Deletion requested for document ${documentId}`);

        // Legal will:
        // - Check retention policy
        // - Calculate earliestDeletionDate
        // - Emit document.deletion_approved OR document.deletion_denied
    }
}
