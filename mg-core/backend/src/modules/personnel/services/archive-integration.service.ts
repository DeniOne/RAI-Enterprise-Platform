import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * ArchiveIntegrationService
 * 
 * CRITICAL: Event-driven archiving WITHOUT ownership violations
 * 
 * Architecture:
 * - Personnel emits personal_file.archived event
 * - Library listens and requests documents via API
 * - Library applies mapping, retention, storage
 * - Library emits library.archiving_completed
 * 
 * Personnel does NOT:
 * - Form document payload
 * - Apply retention policies
 * - Store in archive
 */
@Injectable()
export class ArchiveIntegrationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async initiateArchiving(fileId: string, actorId: string): Promise<void> {
        // 1. Validate PersonalFile status
        const file = await this.prisma.personalFile.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('PersonalFile not found');
        }

        if (file.hrStatus !== 'ARCHIVED') {
            throw new BadRequestException(
                'PersonalFile must be in ARCHIVED status before archiving'
            );
        }

        // 2. Update status to ARCHIVING (intermediate state)
        await this.prisma.personalFile.update({
            where: { id: fileId },
            data: { hrStatus: 'ARCHIVING' },
        });

        // 3. Emit event — Library will handle the rest
        this.eventEmitter.emit('personal_file.archived', {
            personalFileId: fileId,
            employeeId: file.employeeId,
            fileNumber: file.fileNumber,
            initiatedBy: actorId,
            timestamp: new Date().toISOString(),
            // Library will:
            // - Call GET /api/personnel/files/:id/documents
            // - Apply document type mapping
            // - Apply retention policies (75 years)
            // - Store in archive
            // - Emit library.archiving_completed
        });

        console.log(`[ArchiveIntegrationService] Archiving initiated for PersonalFile ${fileId}`);
    }
}
