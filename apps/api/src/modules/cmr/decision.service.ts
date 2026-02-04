import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConfidenceLevel } from '@prisma/client';

@Injectable()
export class DecisionService {
    constructor(private readonly prisma: PrismaService) { }

    async logDecision(data: {
        seasonId: string;
        companyId: string;
        action: string;
        reason: string;
        actor: string;
        userId?: string;
    }) {
        return this.prisma.cmrDecision.create({
            data: {
                ...data,
                confidenceLevel: ConfidenceLevel.HIGH, // Default or calculated
            },
        });
    }
}
