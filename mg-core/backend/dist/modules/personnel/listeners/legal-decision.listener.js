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
exports.LegalDecisionListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
const hr_domain_event_service_1 = require("../services/hr-domain-event.service");
/**
 * LegalDecisionListener
 *
 * Listens to Legal module decisions on document deletion
 * Executes deletion ONLY if approved by Legal
 */
let LegalDecisionListener = class LegalDecisionListener {
    prisma;
    hrEventService;
    constructor(prisma, hrEventService) {
        this.prisma = prisma;
        this.hrEventService = hrEventService;
    }
    async handleDeletionApproved(payload) {
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
    async handleDeletionDenied(payload) {
        // Log denial
        console.warn('[LEGAL] Document deletion denied:', {
            documentId: payload.documentId,
            reason: payload.reason,
            earliestDeletionDate: payload.earliestDeletionDate,
        });
        // TODO: Send notification to requester
        // TODO: Update document status to DELETION_DENIED
    }
};
exports.LegalDecisionListener = LegalDecisionListener;
__decorate([
    (0, event_emitter_1.OnEvent)('document.deletion_approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegalDecisionListener.prototype, "handleDeletionApproved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('document.deletion_denied'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegalDecisionListener.prototype, "handleDeletionDenied", null);
exports.LegalDecisionListener = LegalDecisionListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, hr_domain_event_service_1.HRDomainEventService])
], LegalDecisionListener);
