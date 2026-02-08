import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RdService } from '../services/RdService';
import { JwtAuthGuard } from '../../../shared/auth/jwt-auth.guard';
import { ExperimentState } from '@rai/prisma-client';

@Controller('rd/experiments')
@UseGuards(JwtAuthGuard)
export class ExperimentController {
    constructor(private rdService: RdService) { }

    @Post(':id/transition')
    async transition(
        @Param('id') id: string,
        @Body('state') state: ExperimentState,
        @Request() req: any
    ) {
        return this.rdService.orchestrator.transitionState(id, state, req.user.id);
    }

    @Post('protocols/:id/approve')
    async approveProtocol(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.rdService.orchestrator.approveProtocol(id, req.user.id);
    }
}
