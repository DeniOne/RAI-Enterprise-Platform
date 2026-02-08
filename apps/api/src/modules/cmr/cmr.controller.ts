import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { DeviationService } from './deviation.service';
import { RiskService } from './risk.service';
import { DecisionService } from './decision.service';
import { CreateDeviationDto } from './dto/create-deviation.dto'; // Validated in service, but good to have DTO
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('cmr')
@UseGuards(JwtAuthGuard)
export class CmrController {
    constructor(
        private readonly deviationService: DeviationService,
        private readonly riskService: RiskService,
        private readonly decisionService: DecisionService
    ) { }

    @Post('reviews')
    async createReview(@Body() data: any) {
        return this.deviationService.createReview(data);
    }

    @Post('reviews/:id/response')
    async handleClientResponse(
        @Param('id') id: string,
        @Body() body: { status: 'AGREED' | 'DISAGREED'; comment?: string }
    ) {
        // This method would need to be added to DeviationService or handle logic here
        // For now, mapping to update logic check
        return { message: "Response received", responsibility: "SHARED" }; // Placeholder for actual logic
    }

    @Get('risks/assess')
    async assessRisk(@Body() data: any) {
        return this.riskService.assessRisk({ stage: data.stage, conditions: data.conditions });
    }

    @Get('decisions')
    async getDecisions() {
        // Needs implementation in DecisionService to fetch
        return [];
    }
}
