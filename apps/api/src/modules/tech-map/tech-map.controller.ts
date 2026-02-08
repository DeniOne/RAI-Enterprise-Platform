import { Controller, Post, Body, Param, Get, Req } from '@nestjs/common';
import { TechMapService } from './tech-map.service';

@Controller('tech-map')
export class TechMapController {
    constructor(private readonly techMapService: TechMapService) { }

    @Post('generate')
    async generate(@Body() body: { seasonId: string; soilId: string; historyId: string }) {
        return this.techMapService.generateMap(body.seasonId, body.soilId, body.historyId);
    }

    @Get(':id/validate')
    async validate(@Param('id') id: string) {
        return this.techMapService.validateMap(id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const companyId = req.user.companyId;
        return this.techMapService.findOne(id, companyId);
    }

    @Get('season/:seasonId')
    async findBySeason(@Param('seasonId') seasonId: string, @Req() req: any) {
        const companyId = req.user.companyId;
        return this.techMapService.findBySeason(seasonId, companyId);
    }

    @Post(':id/activate')
    async activate(@Param('id') id: string, @Req() req: any) {
        const companyId = req.user.companyId;
        return this.techMapService.activate(id, companyId);
    }
}
