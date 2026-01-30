"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mvpLearningContourMiddleware = void 0;
const mvp_learning_contour_config_1 = require("../config/mvp-learning-contour.config");
/**
 * MVP Learning Contour Middleware (Express)
 *
 * Enforces MVP boundaries by blocking access to forbidden endpoints.
 * Returns 403 Forbidden if feature is disabled.
 */
const mvpLearningContourMiddleware = (req, res, next) => {
    if (mvp_learning_contour_config_1.MVP_LEARNING_CONTOUR_CONFIG.enabled) {
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
exports.mvpLearningContourMiddleware = mvpLearningContourMiddleware;
