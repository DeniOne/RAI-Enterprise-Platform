import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtAuthGuard } from '../../../shared/auth/jwt-auth.guard';

@Controller('gr')
@UseGuards(JwtAuthGuard)
export class GrController {
    constructor(private prisma: PrismaService) { }

    @Get('regulators')
    async getRegulators(@Query('companyId') companyId: string) {
        return this.prisma.regulatoryBody.findMany({
            where: { companyId },
            include: { documents: true }
        });
    }

    @Get('interactions')
    async getInteractions(@Query('companyId') companyId: string) {
        return this.prisma.grInteraction.findMany({
            where: { companyId },
            orderBy: { date: 'desc' }
        });
    }

    @Get('signals')
    async getSignals(@Query('companyId') companyId: string) {
        return this.prisma.policySignal.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
