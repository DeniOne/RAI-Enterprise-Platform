import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

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
@Injectable()
export class PersonnelAccessGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // ARCHITECT OVERRIDE: Superuser Bypass
        if (request.headers['x-matrix-dev-role'] === 'SUPERUSER' && user?.role === 'ADMIN') {
            return true;
        }

        // Extract role from user object
        const userRole = user?.role || 'UNKNOWN';

        // Define allowed roles for Personnel module
        const allowedRoles = ['HR_SPECIALIST', 'HR_MANAGER', 'DIRECTOR', 'ADMIN'];

        if (!allowedRoles.includes(userRole)) {
            throw new ForbiddenException({
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
}
