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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
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
let ArchiveIntegrationService = class ArchiveIntegrationService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async initiateArchiving(fileId, actorId) {
        // 1. Validate PersonalFile status
        const file = await this.prisma.personalFile.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('PersonalFile not found');
        }
        if (file.hrStatus !== 'ARCHIVED') {
            throw new common_1.BadRequestException('PersonalFile must be in ARCHIVED status before archiving');
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
};
exports.ArchiveIntegrationService = ArchiveIntegrationService;
exports.ArchiveIntegrationService = ArchiveIntegrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, event_emitter_1.EventEmitter2])
], ArchiveIntegrationService);
