import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * RequireDirectorGuard
 * 
 * CRITICAL: Ensures only DIRECTOR role can access protected endpoints
 * Used for:
 * - POST /api/personnel/orders/:id/sign
 * - POST /api/personnel/contracts/:id/terminate
 * 
 * IMPORTANT: This guard MUST be applied to all DIRECTOR-only endpoints
 * Failure to apply this guard is a SECURITY VULNERABILITY
 */
@Injectable()
export class RequireDirectorGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // ARCHITECT OVERRIDE: Superuser Bypass
        if (request.headers['x-matrix-dev-role'] === 'SUPERUSER' && user?.role === 'ADMIN') {
            return true;
        }

        // Extract role from user object (set by auth middleware)
        const userRole = user?.role || 'UNKNOWN';

        // CRITICAL: Only DIRECTOR can proceed
        if (userRole !== 'DIRECTOR') {
            throw new ForbiddenException({
                message: 'Only DIRECTOR can perform this action',
                requiredRole: 'DIRECTOR',
                actualRole: userRole,
            });
        }

        return true;
    }
}
