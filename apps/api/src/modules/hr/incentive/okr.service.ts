import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class OkrService {
    constructor(private readonly prisma: PrismaService) { }

    async createCycle(data: { title: string; startDate: Date; endDate: Date }, companyId: string) {
        return this.prisma.okrCycle.create({
            data: {
                ...data,
                company: { connect: { id: companyId } },
            },
        });
    }

    async addObjective(cycleId: string, data: { title: string; ownerId: string }) {
        return this.prisma.objective.create({
            data: {
                title: data.title,
                cycle: { connect: { id: cycleId } },
                owner: { connect: { id: data.ownerId } },
            },
        });
    }

    async updateKeyResult(id: string, currentValue: number) {
        // Logic for progress calculation would go here
        return this.prisma.keyResult.update({
            where: { id },
            data: { currentValue },
        });
    }
}
