import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../dto/common/common.enums';

/**
 * Middleware to check if user has required role(s)
 * @param roles - Array of allowed roles
 */
export const requireRoles = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as any;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // ARCHITECT OVERRIDE: Superuser Bypass
        const isSuperuser = req.headers['x-matrix-dev-role'] === 'SUPERUSER' && user.role === 'ADMIN';
        if (isSuperuser) {
            return next();
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                message: 'Forbidden: Insufficient permissions',
                requiredRoles: roles,
                userRole: user.role
            });
        }

        next();
    };
};

/**
 * Alternative function name for convenience
 * @param roles - Array of allowed roles as strings
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as any;

        if (!user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // ARCHITECT OVERRIDE: Superuser Bypass
        const isSuperuser = req.headers['x-matrix-dev-role'] === 'SUPERUSER' && user.role === 'ADMIN';
        if (isSuperuser) {
            return next();
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Insufficient permissions',
                requiredRoles: roles,
                userRole: user.role
            });
        }

        next();
    };
};
