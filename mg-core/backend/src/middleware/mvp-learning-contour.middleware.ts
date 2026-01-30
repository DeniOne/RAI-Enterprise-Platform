import { Request, Response, NextFunction } from 'express';
import { MVP_LEARNING_CONTOUR_CONFIG } from '../config/mvp-learning-contour.config';

/**
 * MVP Learning Contour Middleware (Express)
 * 
 * Enforces MVP boundaries by blocking access to forbidden endpoints.
 * Returns 403 Forbidden if feature is disabled.
 */
export const mvpLearningContourMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // ARCHITECT OVERRIDE: Superuser Bypass
    if (req.headers['x-matrix-dev-role'] === 'SUPERUSER' && process.env.NODE_ENV !== 'production') {
        return next();
    }

    if (MVP_LEARNING_CONTOUR_CONFIG.enabled) {
        console.warn(`[MVP Guard] Blocked access to forbidden endpoint: ${req.method} ${req.originalUrl} from ${req.ip}`);

        return res.status(403).json({
            success: false,
            error: {
                code: 'MVP_BOUNDARY_VIOLATION',
                message: 'Доступ к этой функции ограничен в режиме MVP Learning Contour.',
                documentation: 'See: documentation/06-MVP-LEARNING-CONTOUR'
            }
        });
    }

    next();
};
