"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PersonnelArchivingListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelArchivingListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const document_service_1 = require("../services/document.service");
const version_service_1 = require("../services/version.service");
const link_service_1 = require("../services/link.service");
const event_emitter_2 = require("@nestjs/event-emitter");
let PersonnelArchivingListener = PersonnelArchivingListener_1 = class PersonnelArchivingListener {
    documentService;
    versionService;
    linkService;
    eventEmitter;
    logger = new common_1.Logger(PersonnelArchivingListener_1.name);
    constructor(documentService, versionService, linkService, eventEmitter) {
        this.documentService = documentService;
        this.versionService = versionService;
        this.linkService = linkService;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Handle personal_file.archived event from Module 33
     * CANON: This is the CRITICAL integration point
     */
    async handlePersonalFileArchived(payload) {
        this.logger.log(`Archiving PersonalFile ${payload.personalFileId} to Library`);
        try {
            // 1. Create Library Document
            const document = await this.documentService.createDocument({
                title: `Personal File ${payload.fileNumber} - Employee ${payload.employeeId}`,
                documentType: 'HR_PERSONAL_FILE', // 75 years retention
                businessOwnerRole: 'HR_MANAGER',
            }, 'SYSTEM');
            this.logger.log(`Created Library Document ${document.id} for PersonalFile ${payload.personalFileId}`);
            // 2. Upload all documents as versions
            let latestVersionId = null;
            for (const doc of payload.documents) {
                const version = await this.versionService.createVersion({
                    documentId: document.id,
                    version: '1.0.0', // TODO: Increment version for multiple docs
                    file: doc.file,
                    mimeType: doc.mimeType,
                }, 'SYSTEM');
                latestVersionId = version.id;
                this.logger.log(`Created version ${version.id} for document ${doc.title}`);
            }
            // 3. Set active version
            if (latestVersionId) {
                await this.versionService.setActiveVersion(document.id, latestVersionId, 'SYSTEM');
                this.logger.log(`Set active version ${latestVersionId} for document ${document.id}`);
            }
            // 4. Create link to Module 33
            await this.linkService.createLink(document.id, 'PERSONNEL', payload.personalFileId, 'MANDATORY');
            this.logger.log(`Created link from Library Document ${document.id} to PersonalFile ${payload.personalFileId}`);
            // 5. Emit success event
            this.eventEmitter.emit('library.archiving_completed', {
                documentId: document.id,
                personalFileId: payload.personalFileId,
                retentionYears: payload.retentionYears,
            });
            this.logger.log(`Successfully archived PersonalFile ${payload.personalFileId} to Library`);
        }
        catch (error) {
            this.logger.error(`Failed to archive PersonalFile ${payload.personalFileId}:`, error);
            // Emit failure event
            this.eventEmitter.emit('library.archiving_failed', {
                personalFileId: payload.personalFileId,
                error: error.message,
            });
            throw error;
        }
    }
};
exports.PersonnelArchivingListener = PersonnelArchivingListener;
__decorate([
    (0, event_emitter_1.OnEvent)('personal_file.archived'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PersonnelArchivingListener.prototype, "handlePersonalFileArchived", null);
exports.PersonnelArchivingListener = PersonnelArchivingListener = PersonnelArchivingListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [document_service_1.DocumentService,
        version_service_1.VersionService,
        link_service_1.LinkService,
        event_emitter_2.EventEmitter2])
], PersonnelArchivingListener);
