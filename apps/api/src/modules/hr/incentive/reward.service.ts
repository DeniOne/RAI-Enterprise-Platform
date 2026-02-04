import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RewardService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Reward events are append-only.
     */
    async recordReward(data: {
        employeeId: string;
        type: 'BONUS' | 'EQUITY' | 'PERK';
        amount?: number;
        reason: string;
    }) {
        return this.prisma.hrRewardEvent.create({
            data: {
                employee: { connect: { id: data.employeeId } },
                type: data.type,
                amount: data.amount,
                reason: data.reason,
            },
        });
    }

    async getEmployeeRewards(employeeId: string) {
        return this.prisma.hrRewardEvent.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
