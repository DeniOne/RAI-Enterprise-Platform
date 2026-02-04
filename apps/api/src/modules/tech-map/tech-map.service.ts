import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TechMapStatus } from '@prisma/client';

@Injectable()
export class TechMapService {
    constructor(private readonly prisma: PrismaService) { }

    async generateMap(seasonId: string, soilId: string, historyId: string) {
        // Placeholder logic for "Construction"
        // In real implementation, this would use agro-algorithms
        const season = await this.prisma.season.findUnique({
            where: { id: seasonId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Create a draft TechMap
        // Using upsert to ensure 1-to-1 relation mostly
        return this.prisma.techMap.upsert({
            where: { seasonId },
            update: {
                status: TechMapStatus.DRAFT,
                // Update logic if needed
            },
            create: {
                seasonId,
                companyId: season.companyId,
                status: TechMapStatus.DRAFT,
                version: 1,
                // soilType and other metadata would come from inputs
            },
        });
    }

    async validateMap(mapId: string) {
        // Check constraints
        const map = await this.prisma.techMap.findUnique({
            where: { id: mapId },
            include: { stages: { include: { operations: true } } },
        });

        if (!map) {
            throw new NotFoundException('TechMap not found');
        }

        // Dummy validation logic
        return { valid: true, issues: [] };
    }
}
