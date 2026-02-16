import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RiskLevel } from '@rai/prisma-client';

@Injectable()
export class AssessmentService {
    constructor(private readonly prisma: PrismaService) { }

    async createSnapshot(
        data: {
            employeeId: string;
            burnoutRisk: RiskLevel;
            engagementLevel: number;
            ethicalAlignment: number;
            controllability: number;
            confidenceLevel?: number;
        },
        companyId: string,
    ) {
        return this.prisma.humanAssessmentSnapshot.create({
            data: {
                employee: { connect: { id: data.employeeId } },
                burnoutRisk: data.burnoutRisk,
                engagementLevel: data.engagementLevel,
                ethicalAlignment: data.ethicalAlignment,
                controllability: data.controllability,
                confidenceLevel: data.confidenceLevel ?? 1.0,
                company: { connect: { id: companyId } },
            },
        });
    }

    async getLatestSnapshot(employeeId: string, companyId: string) {
        return this.prisma.humanAssessmentSnapshot.findFirst({
            where: { employeeId, companyId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
