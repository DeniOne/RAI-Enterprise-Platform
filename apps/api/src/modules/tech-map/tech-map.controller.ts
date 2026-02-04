import { Controller, Post, Body, Param, Get } from '@nestjs/common';
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
}
