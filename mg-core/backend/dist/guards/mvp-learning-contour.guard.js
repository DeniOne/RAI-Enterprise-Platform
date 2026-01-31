"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseMVPGuard = exports.MVPLearningContourGuard = void 0;
// @ts-ignore
const common_1 = require("@nestjs/common");
const mvp_learning_contour_config_1 = require("../config/mvp-learning-contour.config");
let MVPLearningContourGuard = class MVPLearningContourGuard {
    /**
     * Check if request is allowed in MVP mode
     */
    canActivate(context) {
        // If MVP mode disabled, allow all
        if (!mvp_learning_contour_config_1.MVP_LEARNING_CONTOUR_CONFIG.enabled) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        // ARCHITECT OVERRIDE: Superuser Bypass
        if (request.headers['x-matrix-dev-role'] === 'SUPERUSER' && process.env.NODE_ENV !== 'production') {
            return true;
        }
        const path = request.url;
        // Check if path is forbidden
        const isForbidden = mvp_learning_contour_config_1.MVP_LEARNING_CONTOUR_CONFIG.forbiddenEndpoints.some((forbiddenPath) => path.startsWith(forbiddenPath));
        if (isForbidden) {
            // Log attempt (security audit trail)
            console.warn('[MVP Guard] Blocked access to forbidden endpoint:', {
                path,
                method: request.method,
                userId: request.user?.id || 'anonymous',
                timestamp: new Date().toISOString(),
            });
            // Return 403 with clear explanation
            throw new common_1.ForbiddenException('This feature is disabled in MVP Learning Contour. ' +
                'See documentation/06-MVP-LEARNING-CONTOUR for details.');
        }
        return true;
    }
};
exports.MVPLearningContourGuard = MVPLearningContourGuard;
exports.MVPLearningContourGuard = MVPLearningContourGuard = __decorate([
    (0, common_1.Injectable)()
], MVPLearningContourGuard);
/**
 * Decorator for applying MVP guard to routes
 *
 * Usage:
 * @UseGuards(MVPLearningContourGuard)
 * @Post('forbidden-endpoint')
 * async forbiddenAction() { ... }
 */
const UseMVPGuard = () => {
    // @ts-ignore
    const { UseGuards } = require('@nestjs/common');
    return UseGuards(MVPLearningContourGuard);
};
exports.UseMVPGuard = UseMVPGuard;
