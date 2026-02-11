import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ConsultingService, UserContext } from './consulting.service';
import { CreateHarvestPlanDto } from './dto/create-harvest-plan.dto';
import { UpdateDraftPlanDto } from './dto/update-draft-plan.dto';
import { TransitionPlanStatusDto } from './dto/transition-plan-status.dto';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { UserRole } from '@rai/prisma-client';

@Controller('consulting')
@UseGuards(JwtAuthGuard)
export class ConsultingController {
    constructor(private readonly consultingService: ConsultingService) { }

    @Post('plans')
    async create(@Body() dto: CreateHarvestPlanDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role, // Assuming roles are populated
            companyId: user.companyId,
        };
        return this.consultingService.createPlan(dto, context);
    }

    @Get('plans')
    async findAll(@CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.findAll(context);
    }

    @Get('plans/:id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.findOne(id, context);
    }

    @Patch('plans/:id/draft')
    async updateDraft(@Param('id') id: string, @Body() dto: UpdateDraftPlanDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.updateDraftPlan(id, dto, context);
    }

    @Post('plans/:id/transitions')
    async transition(@Param('id') id: string, @Body() dto: TransitionPlanStatusDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.transitionPlanStatus(id, dto.status, context);
    }
}
