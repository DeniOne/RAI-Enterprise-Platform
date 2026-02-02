import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { IdentityRegistryService } from './identity-registry.service';
import { LifecycleStatus } from '@prisma/client';

@Controller('registry/identities')
export class IdentityRegistryController {
    constructor(private readonly registryService: IdentityRegistryService) { }

    @Post('roles')
    async createRole(@Body() body: { name: string; description?: string; companyId: string }) {
        return this.registryService.createRole(body, body.companyId);
    }

    @Get('roles/:companyId')
    async getRoles(@Param('companyId') companyId: string) {
        return this.registryService.findRoles(companyId);
    }

    @Post('profiles')
    async createProfile(
        @Body() body: {
            firstName: string;
            lastName: string;
            roleId: string;
            companyId: string;
            clientId?: string;
            holdingId?: string
        }
    ) {
        const { companyId, ...data } = body;
        return this.registryService.createProfile(data, companyId);
    }

    @Get('profiles/:companyId')
    async getProfiles(
        @Param('companyId') companyId: string,
        @Query('clientId') clientId?: string,
        @Query('holdingId') holdingId?: string
    ) {
        return this.registryService.findProfiles(companyId, { clientId, holdingId });
    }

    @Put('profiles/:id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: LifecycleStatus; companyId: string }
    ) {
        return this.registryService.updateProfileStatus(id, body.status, body.companyId);
    }
}
