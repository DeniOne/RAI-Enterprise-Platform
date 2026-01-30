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
exports.LinkService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let LinkService = class LinkService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create link to module entity
     * CANON: Links connect Library documents to other modules
     */
    async createLink(documentId, linkedModule, linkedEntityId, linkType) {
        // Verify document exists
        const document = await this.prisma.libraryDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document ${documentId} not found`);
        }
        const link = await this.prisma.libraryLink.create({
            data: {
                documentId,
                linkedModule,
                linkedEntityId,
                linkType,
            },
        });
        return link;
    }
    /**
     * List links for document
     */
    async listLinks(documentId) {
        const links = await this.prisma.libraryLink.findMany({
            where: { documentId },
            orderBy: { createdAt: 'desc' },
        });
        return links;
    }
    /**
     * Validate link integrity
     * CANON: Ensure linked entity still exists
     */
    async validateLinkIntegrity(linkId) {
        const link = await this.prisma.libraryLink.findUnique({
            where: { id: linkId },
        });
        if (!link) {
            throw new common_1.NotFoundException(`Link ${linkId} not found`);
        }
        // TODO: Verify linked entity exists in target module
        // This requires cross-module validation
        return true; // Placeholder
    }
};
exports.LinkService = LinkService;
exports.LinkService = LinkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], LinkService);
