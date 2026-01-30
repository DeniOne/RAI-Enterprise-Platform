import { prisma } from '../../config/prisma';
import {
    CanonicalViolationType,
    CanonicalViolationError,
    CanonType,
} from './index';

/**
 * Service for logging canonical violations to database
 * 
 * All violations are logged for audit and analysis purposes,
 * even if the operation is blocked.
 */
export class CanonicalViolationLogger {
    /**
     * Log a canonical violation to the database
     */
    static async log(
        canon: CanonType,
        violation: CanonicalViolationType,
        source: string,
        action: string,
        payload?: any,
        userId?: string,
    ): Promise<void> {
        try {
            await prisma.canonicalViolation.create({
                data: {
                    canon,
                    violation,
                    source,
                    action,
                    payload: payload || {},
                    user_id: userId,
                },
            });
        } catch (error) {
            // Log to console if database logging fails
            // Don't throw - logging failure shouldn't block the violation error
            console.error('[CANONICAL VIOLATION LOGGER] Failed to log violation:', error);
        }
    }

    /**
     * Log a violation from CanonicalViolationError
     */
    static async logFromError(
        error: CanonicalViolationError,
        source: string,
        action: string,
        payload?: any,
        userId?: string,
    ): Promise<void> {
        await this.log(error.canon, error.violation, source, action, payload, userId);
    }

    /**
     * Get recent violations for analysis
     */
    static async getRecentViolations(limit: number = 100) {
        return await prisma.canonicalViolation.findMany({
            take: limit,
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Get violations by type
     */
    static async getViolationsByType(violation: CanonicalViolationType) {
        return await prisma.canonicalViolation.findMany({
            where: { violation },
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Get violations by canon
     */
    static async getViolationsByCanon(canon: CanonType) {
        return await prisma.canonicalViolation.findMany({
            where: { canon },
            orderBy: { created_at: 'desc' },
        });
    }
}
