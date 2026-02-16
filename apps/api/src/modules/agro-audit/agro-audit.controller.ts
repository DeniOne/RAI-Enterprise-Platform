import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AgroAuditService } from './agro-audit.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { UserRole, User } from '@rai/prisma-client';
import { AgriculturalAuditEvent } from './enums/audit-events.enum';
import { CurrentUser } from '../../shared/auth/current-user.decorator';

@Controller('agro-audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgroAuditController {
    constructor(private readonly auditService: AgroAuditService) { }

    @Post('event')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGRONOMIST, UserRole.FIELD_WORKER)
    async logEvent(
        @CurrentUser() user: User,
        @Body() body: { event: string; metadata: any },
    ) {
        return this.auditService.log(
            body.event as AgriculturalAuditEvent,
            user,
            body.metadata
        );
    }

    @Get('logs')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CEO)
    async getLogs(
        @CurrentUser() user: User,
        @Query('userId') targetUserId?: string,
    ) {
        // TODO: Implement list method in service if needed, for now just a placeholder for RBAC demonstration
        return { message: 'Audit logs access granted', requester: user.email };
    }
}
