
import { prisma } from '../config/prisma';

export interface CreateAuditLogDto {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

class AuditLogService {
    async createLog(data: CreateAuditLogDto): Promise<void> {
        try {
            await prisma.auditLog.create({
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
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // We don't throw here to avoid blocking the main flow
        }
    }
}

export default new AuditLogService();

