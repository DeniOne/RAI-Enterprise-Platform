import { ForbiddenException, Logger } from '@nestjs/common';
import { prisma } from '../config/prisma';

/**
 * FoundationGuard
 * CANON v2.2: Hard Block for Foundation Admission
 */
export class FoundationGuard {
    private readonly logger = new Logger(FoundationGuard.name);
    private readonly ACTIVE_FOUNDATION_VERSION = 'v1.0';

    async canActivate(context: any): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id; // Assuming user ID is available on request.user
        const path = request.url;

        if (!userId) {
            return true;
        }

        // ARCHITECT OVERRIDE: Superuser Bypass
        if (request.headers['x-matrix-dev-role'] === 'SUPERUSER' && process.env.NODE_ENV !== 'production') {
            return true;
        }

        // 1. Fetch Acceptance
        const acceptance = await prisma.foundationAcceptance.findUnique({
            where: { person_id: userId }
        });

        // 2. Check Decision
        if (!acceptance || acceptance.decision !== 'ACCEPTED') {
            await this.logBlock(userId, path, 'FOUNDATION_NOT_ACCEPTED', null);
            throw new ForbiddenException({
                code: 'FOUNDATION_REQUIRED',
                message: 'You must accept the Corporate University Foundation to proceed.',
                action: 'REDIRECT_TO_IMMERSION'
            });
        }

        // 3. Check Version Mismatch
        if (acceptance.version !== this.ACTIVE_FOUNDATION_VERSION) {
            await this.logBlock(userId, path, 'VERSION_MISMATCH', {
                userVersion: acceptance.version,
                requiredVersion: this.ACTIVE_FOUNDATION_VERSION
            });
            throw new ForbiddenException({
                code: 'FOUNDATION_VERSION_MISMATCH',
                message: 'New Foundation version available. Re-immersion required.',
                action: 'REDIRECT_TO_IMMERSION'
            });
        }

        return true;
    }

    private async logBlock(userId: string, endpoint: string, reason: string, meta: any) {
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
            this.logger.warn(`Foundation Check BLOCKED user ${userId} at ${endpoint}: ${reason}`);
        } catch (e) {
            this.logger.error(`Failed to write Audit Log for user ${userId}`, e);
        }
    }
}
