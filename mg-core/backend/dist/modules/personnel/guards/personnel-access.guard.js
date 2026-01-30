"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelAccessGuard = void 0;
const common_1 = require("@nestjs/common");
/**
 * PersonnelAccessGuard
 *
 * Enforces role-based access control for Personnel module:
 * - HR_SPECIALIST: Access to own department only
 * - HR_MANAGER: Access to all departments
 * - DIRECTOR: Full access
 *
 * TODO: Implement department-based filtering
 * Currently allows all authenticated users with HR roles
 */
let PersonnelAccessGuard = class PersonnelAccessGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // Extract role from user object
        const userRole = user?.role || 'UNKNOWN';
        // Define allowed roles for Personnel module
        const allowedRoles = ['HR_SPECIALIST', 'HR_MANAGER', 'DIRECTOR', 'ADMIN'];
        if (!allowedRoles.includes(userRole)) {
            throw new common_1.ForbiddenException({
                message: 'Insufficient permissions to access Personnel module',
                requiredRoles: allowedRoles,
                actualRole: userRole,
            });
        }
        // TODO: Implement department-based access control
        // if (userRole === 'HR_SPECIALIST') {
        //   const userDepartmentId = user.departmentId;
        //   const requestedDepartmentId = request.params.departmentId || request.query.departmentId;
        //   if (userDepartmentId !== requestedDepartmentId) {
        //     throw new ForbiddenException('Access denied to other departments');
        //   }
        // }
        return true;
    }
};
exports.PersonnelAccessGuard = PersonnelAccessGuard;
exports.PersonnelAccessGuard = PersonnelAccessGuard = __decorate([
    (0, common_1.Injectable)()
], PersonnelAccessGuard);
