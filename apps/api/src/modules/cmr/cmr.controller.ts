import { Controller, Post, Body, Get, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { DeviationService } from './deviation.service';
import { RiskService } from './risk.service';
import { DecisionService } from './decision.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { CurrentUser } from '../../shared/auth/current-user.decorator';

@Controller('cmr')
@UseGuards(JwtAuthGuard)
export class CmrController {
    constructor(
        private readonly deviationService: DeviationService,
        private readonly riskService: RiskService,
        private readonly decisionService: DecisionService
    ) { }

    @Post('reviews')
    async createReview(@Body() data: any, @CurrentUser() user: any) {
        return this.deviationService.createReview({
            ...data,
            companyId: user.companyId,
            userId: user.userId,
        });
    }

    @Get('reviews')
    async listReviews(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
        return this.deviationService.findAll(user.companyId, {
            skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
            limit: pagination.limit || 20,
            page: pagination.page || 1
        });
    }

    @Get('reviews/:id')
    async getReview(@Param('id') id: string, @CurrentUser() user: any) {
        return this.deviationService.findOne(id, user.companyId);
    }

    @Patch('reviews/:id/transition')
    async transitionReview(
        @Param('id') id: string,
        @Body('status') status: any,
        @CurrentUser() user: any,
    ) {
        return this.deviationService.transitionStatus(id, status, user.companyId, user.userId);
    }

    @Get('decisions')
    async getDecisions(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
        return this.decisionService.findAll(user.companyId, {
            skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
            limit: pagination.limit || 20,
            page: pagination.page || 1
        });
    }

    @Get('decisions/season/:seasonId')
    async getDecisionsBySeason(
        @Param('seasonId') seasonId: string,
        @CurrentUser() user: any,
        @Query() pagination: PaginationDto,
    ) {
        return this.decisionService.findBySeason(seasonId, user.companyId, {
            skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
            limit: pagination.limit || 20,
            page: pagination.page || 1
        });
    }
}
