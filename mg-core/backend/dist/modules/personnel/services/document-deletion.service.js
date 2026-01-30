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
exports.DocumentDeletionService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
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
let DocumentDeletionService = class DocumentDeletionService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async requestDeletion(documentId, actorId, reason) {
        const document = await this.prisma.personnelDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
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
};
exports.DocumentDeletionService = DocumentDeletionService;
exports.DocumentDeletionService = DocumentDeletionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, event_emitter_1.EventEmitter2])
], DocumentDeletionService);
