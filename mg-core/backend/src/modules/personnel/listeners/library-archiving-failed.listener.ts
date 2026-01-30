import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * LibraryArchivingFailedListener
 * 
 * Listens to library.archiving_failed event from Module 29
 * Rollbacks PersonalFile status to ARCHIVING_FAILED for manual intervention
 */
@Injectable()
export class LibraryArchivingFailedListener {
    constructor(private readonly prisma: PrismaService) { }

    @OnEvent('library.archiving_failed')
    async handleArchivingFailed(payload: LibraryArchivingFailedEvent) {
        if (payload.sourceModule !== 'PERSONNEL') {
            return;
        }

        // Rollback to ARCHIVING_FAILED state
        await this.prisma.personalFile.update({
            where: { id: payload.sourceId },
            data: {
                hrStatus: 'ARCHIVING_FAILED',
            },
        });

        // Log for manual intervention
        console.error('[CRITICAL] PersonalFile archiving failed:', {
            personalFileId: payload.sourceId,
            reason: payload.reason,
            timestamp: new Date().toISOString(),
        });
    }
}

interface LibraryArchivingFailedEvent {
    sourceModule: string;
    sourceId: string;
    reason: string;
}
