/**
 * MVP Learning Contour Guard
 * 
 * PRIMARY ENFORCEMENT MECHANISM for MVP mode boundaries
 * 
 * Architecture:
 * - Guard is SOURCE OF TRUTH (not commented code)
 * - Commented controllers = safety layer
 * - Guard = active runtime enforcement
 * - Even if controller accidentally imported → Guard blocks
 * 
 * See: documentation/06-MVP-LEARNING-CONTOUR
 */

// @ts-ignore
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MVP_LEARNING_CONTOUR_CONFIG } from '../config/mvp-learning-contour.config';

@Injectable()
export class MVPLearningContourGuard implements CanActivate {

    /**
     * Check if request is allowed in MVP mode
     */
    canActivate(context: ExecutionContext): boolean {
        // If MVP mode disabled, allow all
        if (!MVP_LEARNING_CONTOUR_CONFIG.enabled) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        // ARCHITECT OVERRIDE: Superuser Bypass
        if (request.headers['x-matrix-dev-role'] === 'SUPERUSER' && process.env.NODE_ENV !== 'production') {
            return true;
        }

        const path = request.url;

        // Check if path is forbidden
        const isForbidden = MVP_LEARNING_CONTOUR_CONFIG.forbiddenEndpoints.some(
            (forbiddenPath) => path.startsWith(forbiddenPath)
        );

        if (isForbidden) {
            // Log attempt (security audit trail)
            console.warn('[MVP Guard] Blocked access to forbidden endpoint:', {
                path,
                method: request.method,
                userId: request.user?.id || 'anonymous',
                timestamp: new Date().toISOString(),
            });

            // Return 403 with clear explanation
            throw new ForbiddenException(
                'This feature is disabled in MVP Learning Contour. ' +
                'See documentation/06-MVP-LEARNING-CONTOUR for details.'
            );
        }

        return true;
    }
}

/**
 * Decorator for applying MVP guard to routes
 * 
 * Usage:
 * @UseGuards(MVPLearningContourGuard)
 * @Post('forbidden-endpoint')
 * async forbiddenAction() { ... }
 */
export const UseMVPGuard = () => {
    // @ts-ignore
    const { UseGuards } = require('@nestjs/common');
    return UseGuards(MVPLearningContourGuard);
};
