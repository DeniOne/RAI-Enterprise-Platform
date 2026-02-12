import { Controller, Post, Body, Param, Get, Patch, UseGuards } from '@nestjs/common';
import { TechMapService } from './tech-map.service';
import { TechMapStatus } from '@rai/prisma-client';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { CurrentUser } from '../../shared/auth/current-user.decorator';

@Controller('tech-map')
@UseGuards(JwtAuthGuard)
export class TechMapController {
    constructor(private readonly techMapService: TechMapService) { }

    @Post('generate')
    async generate(@Body() body: { harvestPlanId: string; seasonId: string }) {
        return this.techMapService.generateMap(body.harvestPlanId, body.seasonId);
    }

    @Patch(':id/draft')
    async updateDraft(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
        return this.techMapService.updateDraft(id, data, user.companyId);
    }

    @Patch(':id/transition')
    async transition(@Param('id') id: string, @Body() body: { status: TechMapStatus }, @CurrentUser() user: any) {
        return this.techMapService.transitionStatus(id, body.status, user.companyId, user.role, user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.techMapService.findOne(id, user.companyId);
    }

    @Get('season/:seasonId')
    async findBySeason(@Param('seasonId') seasonId: string, @CurrentUser() user: any) {
        return this.techMapService.findBySeason(seasonId, user.companyId);
    }
}
