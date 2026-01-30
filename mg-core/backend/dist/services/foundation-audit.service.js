"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FoundationAuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoundationAuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../config/prisma");
let FoundationAuditService = FoundationAuditService_1 = class FoundationAuditService {
    logger = new common_1.Logger(FoundationAuditService_1.name);
    async createAuditLog(dto) {
        const { userId, eventType, foundationVersion, metadata } = dto;
        this.logger.log(`Creating Foundation Audit Log for user ${userId} - ${eventType}`);
        return prisma_1.prisma.foundationAuditLog.create({
            data: {
                user_id: userId,
                event_type: eventType,
                foundation_version: foundationVersion,
                metadata: metadata || {},
            },
        });
    }
    async getAuditLog(userId) {
        return prisma_1.prisma.foundationAuditLog.findFirst({
            where: { user_id: userId },
            orderBy: { timestamp: 'desc' },
        });
    }
};
exports.FoundationAuditService = FoundationAuditService;
exports.FoundationAuditService = FoundationAuditService = FoundationAuditService_1 = __decorate([
    (0, common_1.Injectable)()
], FoundationAuditService);
