"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationMiddleware = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
const foundation_constants_1 = require("../config/foundation.constants");
const prisma = new client_1.PrismaClient();
const ACTIVE_FOUNDATION_VERSION = foundation_constants_1.FOUNDATION_VERSION;
/**
 * FoundationMiddleware (Express)
 * CANON v2.2: Hard Block for Foundation Admission
 *
 * Express-compatible version of FoundationGuard.
 */
const foundationMiddleware = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            // Auth middleware should have handled this, but just in case
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 1. Fetch Acceptance
        const acceptance = await prisma.foundationAcceptance.findUnique({
            where: { person_id: userId }
        });
        // 2. Check Decision
        if (!acceptance || acceptance.decision !== 'ACCEPTED') {
            await logBlock(userId, req.path, 'FOUNDATION_NOT_ACCEPTED', null);
            return res.status(403).json({
                error: 'FOUNDATION_REQUIRED',
                message: 'You must accept the Corporate University Foundation to proceed.',
                action: 'REDIRECT_TO_IMMERSION'
            });
        }
        // 3. Check Version Mismatch
        if (acceptance.version !== ACTIVE_FOUNDATION_VERSION) {
            await logBlock(userId, req.path, 'VERSION_MISMATCH', {
                userVersion: acceptance.version,
                requiredVersion: ACTIVE_FOUNDATION_VERSION
            });
            return res.status(403).json({
                error: 'FOUNDATION_VERSION_MISMATCH',
                message: 'New Foundation version available. Re-immersion required.',
                action: 'REDIRECT_TO_IMMERSION'
            });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Foundation Middleware Error', error);
        res.status(500).json({ error: 'Internal Server Error during Foundation Check' });
    }
};
exports.foundationMiddleware = foundationMiddleware;
async function logBlock(userId, endpoint, reason, meta) {
    try {
        await prisma.foundationAuditLog.create({
            data: {
                user_id: userId,
                event_type: 'BLOCKED_ACCESS',
                metadata: {
                    endpoint,
                    reason,
                    ...meta
                }
            }
        });
        logger_1.logger.warn(`Foundation Blocked user ${userId} at ${endpoint}: ${reason}`);
    }
    catch (e) {
        logger_1.logger.error(`Failed to write Foundation Audit Log for user ${userId}`, e);
    }
}
