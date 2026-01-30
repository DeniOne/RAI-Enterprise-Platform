import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * LibraryArchivingCompletedListener
 * 
 * Listens to library.archiving_completed event from Module 29
 * Updates PersonalFile with libraryDocumentId and finalizes status
 */
@Injectable()
export class LibraryArchivingCompletedListener {
    constructor(private readonly prisma: PrismaService) { }

    @OnEvent('library.archiving_completed')
    async handleArchivingCompleted(payload: LibraryArchivingCompletedEvent) {
        if (payload.sourceModule !== 'PERSONNEL') {
            return; // Not our event
        }

        // Update PersonalFile with Library document ID
        await this.prisma.personalFile.update({
            where: { id: payload.sourceId },
            data: {
                libraryDocumentId: payload.documentId,
                hrStatus: 'ARCHIVED', // Final state
            },
        });

        console.log(`[LibraryArchivingCompletedListener] PersonalFile ${payload.sourceId} archived successfully`);
    }
}

interface LibraryArchivingCompletedEvent {
    sourceModule: string;
    sourceId: string;
    documentId: string;
}
