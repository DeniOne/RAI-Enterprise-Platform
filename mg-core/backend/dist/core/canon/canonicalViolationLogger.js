"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalViolationLogger = void 0;
const prisma_1 = require("../../config/prisma");
/**
 * Service for logging canonical violations to database
 *
 * All violations are logged for audit and analysis purposes,
 * even if the operation is blocked.
 */
class CanonicalViolationLogger {
    /**
     * Log a canonical violation to the database
     */
    static async log(canon, violation, source, action, payload, userId) {
        try {
            await prisma_1.prisma.canonicalViolation.create({
                data: {
                    canon,
                    violation,
                    source,
                    action,
                    payload: payload || {},
                    user_id: userId,
                },
            });
        }
        catch (error) {
            // Log to console if database logging fails
            // Don't throw - logging failure shouldn't block the violation error
            console.error('[CANONICAL VIOLATION LOGGER] Failed to log violation:', error);
        }
    }
    /**
     * Log a violation from CanonicalViolationError
     */
    static async logFromError(error, source, action, payload, userId) {
        await this.log(error.canon, error.violation, source, action, payload, userId);
    }
    /**
     * Get recent violations for analysis
     */
    static async getRecentViolations(limit = 100) {
        return await prisma_1.prisma.canonicalViolation.findMany({
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }
    /**
     * Get violations by type
     */
    static async getViolationsByType(violation) {
        return await prisma_1.prisma.canonicalViolation.findMany({
            where: { violation },
            orderBy: { created_at: 'desc' },
        });
    }
    /**
     * Get violations by canon
     */
    static async getViolationsByCanon(canon) {
        return await prisma_1.prisma.canonicalViolation.findMany({
            where: { canon },
            orderBy: { created_at: 'desc' },
        });
    }
}
exports.CanonicalViolationLogger = CanonicalViolationLogger;
