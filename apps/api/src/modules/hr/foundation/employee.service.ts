import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { IdentityRegistryService } from '../../identity-registry/identity-registry.service';

@Injectable()
export class EmployeeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly identityRegistry: IdentityRegistryService,
    ) { }

    /**
     * Projection of external 'employee-hired' event.
     * Direct profile creation is forbidden - this is the ONLY entry point.
     */
    async projectEmployeeHired(
        event: {
            externalId: string;
            email?: string;
            roleId: string; // Internal role ref
            orgUnitId?: string; // Structural reference
            metadata?: any;
        },
        companyId: string,
    ) {
        // 1. Try to find user by email to link profile automatically
        let userId: string | undefined;
        if (event.email) {
            const user = await this.prisma.user.findFirst({
                where: { email: event.email, companyId },
            });
            userId = user?.id;
        }

        // 2. Create profile through registry (projection)
        return this.identityRegistry.createProfile(
            {
                externalId: event.externalId,
                userId,
                roleId: event.roleId,
                orgUnitId: event.orgUnitId,
            },
            companyId,
        );
    }

    async projectStatusChange(
        externalId: string,
        status: 'ACTIVE' | 'ARCHIVED' | 'TERMINATED',
        companyId: string,
    ) {
        const profile = await this.prisma.employeeProfile.findFirst({
            where: { externalId, companyId },
        });

        if (!profile) {
            throw new ForbiddenException(`Profile with externalId ${externalId} not found`);
        }

        return this.identityRegistry.updateProfileStatus(profile.id, status as any, companyId);
    }
}
