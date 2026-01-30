import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentService } from '../services/document.service';
import { VersionService } from '../services/version.service';
import { LinkService } from '../services/link.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface PersonalFileArchivedPayload {
    personalFileId: string;
    employeeId: string;
    fileNumber: string;
    documents: Array<{
        id: string;
        title: string;
        file: Buffer;
        mimeType: string;
    }>;
    retentionYears: number; // 75 for HR documents
}

@Injectable()
export class PersonnelArchivingListener {
    private readonly logger = new Logger(PersonnelArchivingListener.name);

    constructor(
        private documentService: DocumentService,
        private versionService: VersionService,
        private linkService: LinkService,
        private eventEmitter: EventEmitter2,
    ) { }

    /**
     * Handle personal_file.archived event from Module 33
     * CANON: This is the CRITICAL integration point
     */
    @OnEvent('personal_file.archived')
    async handlePersonalFileArchived(payload: PersonalFileArchivedPayload) {
        this.logger.log(`Archiving PersonalFile ${payload.personalFileId} to Library`);

        try {
            // 1. Create Library Document
            const document = await this.documentService.createDocument(
                {
                    title: `Personal File ${payload.fileNumber} - Employee ${payload.employeeId}`,
                    documentType: 'HR_PERSONAL_FILE', // 75 years retention
                    businessOwnerRole: 'HR_MANAGER',
                },
                'SYSTEM',
            );

            this.logger.log(`Created Library Document ${document.id} for PersonalFile ${payload.personalFileId}`);

            // 2. Upload all documents as versions
            let latestVersionId: string | null = null;

            for (const doc of payload.documents) {
                const version = await this.versionService.createVersion(
                    {
                        documentId: document.id,
                        version: '1.0.0', // TODO: Increment version for multiple docs
                        file: doc.file,
                        mimeType: doc.mimeType,
                    },
                    'SYSTEM',
                );

                latestVersionId = version.id;
                this.logger.log(`Created version ${version.id} for document ${doc.title}`);
            }

            // 3. Set active version
            if (latestVersionId) {
                await this.versionService.setActiveVersion(document.id, latestVersionId, 'SYSTEM');
                this.logger.log(`Set active version ${latestVersionId} for document ${document.id}`);
            }

            // 4. Create link to Module 33
            await this.linkService.createLink(
                document.id,
                'PERSONNEL',
                payload.personalFileId,
                'MANDATORY',
            );

            this.logger.log(`Created link from Library Document ${document.id} to PersonalFile ${payload.personalFileId}`);

            // 5. Emit success event
            this.eventEmitter.emit('library.archiving_completed', {
                documentId: document.id,
                personalFileId: payload.personalFileId,
                retentionYears: payload.retentionYears,
            });

            this.logger.log(`Successfully archived PersonalFile ${payload.personalFileId} to Library`);
        } catch (error) {
            this.logger.error(`Failed to archive PersonalFile ${payload.personalFileId}:`, error);

            // Emit failure event
            this.eventEmitter.emit('library.archiving_failed', {
                personalFileId: payload.personalFileId,
                error: error.message,
            });

            throw error;
        }
    }
}
