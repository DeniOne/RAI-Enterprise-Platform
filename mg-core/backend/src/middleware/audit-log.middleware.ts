import { Request, Response, NextFunction } from 'express';
import auditLogService from '../services/audit-log.service';

export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Log only state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        // We use a slight delay or fire-and-forget to not block the request
        // Also we try to get user from req.user (populated by passport)
        // Note: middleware order matters. This should be after auth middleware if we want user info.

        const user = (req as any).user;
        const userId = user ? user.id : undefined;

        auditLogService.createLog({
            userId,
            action: `${req.method} ${req.originalUrl}`,
            details: {
                body: req.body,
                query: req.query,
                params: req.params
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
    }

    next();
};
