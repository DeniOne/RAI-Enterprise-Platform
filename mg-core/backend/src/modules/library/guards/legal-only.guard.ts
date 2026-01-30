import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class LegalOnlyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // CRITICAL: Only LEGAL_COUNSEL can destroy documents
        const legalRoles = ['LEGAL_COUNSEL', 'LEGAL_MANAGER'];

        if (!legalRoles.includes(user.role)) {
            throw new ForbiddenException('Only Legal personnel can destroy documents');
        }

        return true;
    }
}
