"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireDirectorGuard = void 0;
const common_1 = require("@nestjs/common");
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
let RequireDirectorGuard = class RequireDirectorGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // Extract role from user object (set by auth middleware)
        const userRole = user?.role || 'UNKNOWN';
        // CRITICAL: Only DIRECTOR can proceed
        if (userRole !== 'DIRECTOR') {
            throw new common_1.ForbiddenException({
                message: 'Only DIRECTOR can perform this action',
                requiredRole: 'DIRECTOR',
                actualRole: userRole,
            });
        }
        return true;
    }
};
exports.RequireDirectorGuard = RequireDirectorGuard;
exports.RequireDirectorGuard = RequireDirectorGuard = __decorate([
    (0, common_1.Injectable)()
], RequireDirectorGuard);
