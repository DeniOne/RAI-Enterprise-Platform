import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

import { FOUNDATION_VERSION } from '../config/foundation.constants';

const prisma = new PrismaClient();
const ACTIVE_FOUNDATION_VERSION = FOUNDATION_VERSION;

/**
 * FoundationMiddleware (Express)
 * CANON v2.2: Hard Block for Foundation Admission
 * 
 * Express-compatible version of FoundationGuard.
 */
export const foundationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const userId = user?.id;

        // ARCHITECT OVERRIDE: Superuser Bypass
        // Allowed based on header if user is ADMIN. 
        // Note: in some development cases, we allow bypass if header is present 
        // to troubleshoot admission flow itself.
        const isSuperuser = req.headers['x-matrix-dev-role'] === 'SUPERUSER' && (user?.role === 'ADMIN' || !userId);

        if (isSuperuser && process.env.NODE_ENV !== 'production') {
            return next();
        }

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
    } catch (error) {
        logger.error('Foundation Middleware Error', error);
        res.status(500).json({ error: 'Internal Server Error during Foundation Check' });
    }
};

async function logBlock(userId: string, endpoint: string, reason: string, meta: any) {
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
        logger.warn(`Foundation Blocked user ${userId} at ${endpoint}: ${reason}`);
    } catch (e) {
        logger.error(`Failed to write Foundation Audit Log for user ${userId}`, e);
    }
}
