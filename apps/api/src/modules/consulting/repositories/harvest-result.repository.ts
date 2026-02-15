import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { HarvestResult, Prisma } from '@rai/prisma-client';

@Injectable()
export class HarvestResultRepository {
    constructor(private readonly prisma: PrismaService) { }

    async upsert(data: Prisma.HarvestResultUncheckedCreateInput): Promise<HarvestResult> {
        const existing = await this.prisma.harvestResult.findFirst({
            where: { planId: data.planId }
        });

        if (existing) {
            return this.prisma.harvestResult.update({
                where: { id: existing.id },
                data
            });
        }

        return this.prisma.harvestResult.create({
            data
        });
    }

    async findByPlanId(planId: string, companyId: string): Promise<HarvestResult | null> {
        return this.prisma.harvestResult.findFirst({
            where: { planId, companyId }
        });
    }

    async findManyBySeason(seasonId: string, companyId: string): Promise<HarvestResult[]> {
        return this.prisma.harvestResult.findMany({
            where: { seasonId, companyId },
            include: { plan: { include: { activeBudgetPlan: true } } }
        });
    }
}
