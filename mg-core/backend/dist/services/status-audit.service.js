"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusAuditService = exports.StatusAuditService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * StatusAuditService
 *
 * Immutable audit trail for status changes.
 * Canon: Append-only, no UPDATE/DELETE operations.
 */
class StatusAuditService {
    /**
     * Log a status change to the audit trail
     *
     * @param params - Status change details
     * @returns Created audit record
     */
    async logStatusChange(params) {
        const { userId, oldStatus, newStatus, reason, changedBy } = params;
        // Validate required fields
        if (!userId || !newStatus || !reason || !changedBy) {
            throw new Error('Missing required fields for status change audit');
        }
        // Create immutable audit record (INSERT only)
        const auditRecord = await prisma.participationStatusHistory.create({
            data: {
                user_id: userId,
                old_status: oldStatus,
                new_status: newStatus,
                reason,
                changed_by: changedBy,
                changed_at: new Date()
            }
        });
        return auditRecord;
    }
    /**
     * Get complete audit trail for a user
     *
     * @param userId - User ID
     * @returns Array of status changes, sorted by most recent first
     */
    async getAuditTrail(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        const history = await prisma.participationStatusHistory.findMany({
            where: {
                user_id: userId
            },
            orderBy: {
                changed_at: 'desc'
            }
        });
        return history;
    }
    /**
     * Get recent status changes across all users (ADMIN only)
     *
     * @param limit - Maximum number of records to return
     * @returns Recent status changes
     */
    async getRecentChanges(limit = 50) {
        const history = await prisma.participationStatusHistory.findMany({
            take: limit,
            orderBy: {
                changed_at: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                }
            }
        });
        return history;
    }
}
exports.StatusAuditService = StatusAuditService;
exports.statusAuditService = new StatusAuditService();
