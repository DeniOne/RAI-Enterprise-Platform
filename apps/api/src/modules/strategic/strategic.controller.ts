import { Controller, Get, UseGuards } from '@nestjs/common';
import { StrategicService } from './strategic.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('strategic')
@UseGuards(JwtAuthGuard)
export class StrategicController {
    constructor(private readonly strategicService: StrategicService) { }

    @Get('state')
    async getGlobalState() {
        return this.strategicService.getGlobalState();
    }
}
