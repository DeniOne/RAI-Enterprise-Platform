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
exports.LibraryArchivingCompletedListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
/**
 * LibraryArchivingCompletedListener
 *
 * Listens to library.archiving_completed event from Module 29
 * Updates PersonalFile with libraryDocumentId and finalizes status
 */
let LibraryArchivingCompletedListener = class LibraryArchivingCompletedListener {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleArchivingCompleted(payload) {
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
};
exports.LibraryArchivingCompletedListener = LibraryArchivingCompletedListener;
__decorate([
    (0, event_emitter_1.OnEvent)('library.archiving_completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LibraryArchivingCompletedListener.prototype, "handleArchivingCompleted", null);
exports.LibraryArchivingCompletedListener = LibraryArchivingCompletedListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], LibraryArchivingCompletedListener);
