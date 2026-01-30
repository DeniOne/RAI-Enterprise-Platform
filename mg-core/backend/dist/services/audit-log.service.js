"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
class AuditLogService {
    async createLog(data) {
        try {
            await prisma_1.prisma.auditLog.create({
                data: {
                    user_id: data.userId,
                    action: data.action,
                    entity_type: data.entityType,
                    entity_id: data.entityId,
                    details: data.details || {},
                    ip_address: data.ipAddress,
                    user_agent: data.userAgent
                }
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't throw here to avoid blocking the main flow
        }
    }
}
exports.default = new AuditLogService();
