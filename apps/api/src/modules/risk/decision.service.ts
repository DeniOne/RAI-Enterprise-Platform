import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RiskAssessment } from '@rai/prisma-client';

@Injectable()
export class ActionDecisionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Records an automated system decision based on risk assessment.
     * Use this when an important action is taken or blocked by the engine.
     */
    async record(
        companyId: string,
        actionType: string,
        targetId: string,
        assessment: any, // RiskAssessment from engine
        traceId?: string
    ) {
        return this.prisma.decisionRecord.create({
            data: {
                companyId,
                actionType,
                targetId,
                riskVerdict: assessment.verdict,
                riskState: assessment.explanation.fsmState,
                explanation: assessment.explanation,
                traceId
            }
        });
    }

    async getHistory(companyId: string, actionType?: string, targetId?: string) {
        return this.prisma.decisionRecord.findMany({
            where: {
                companyId,
                ...(actionType && { actionType }),
                ...(targetId && { targetId })
            },
            orderBy: { decidedAt: 'desc' },
            take: 50
        });
    }
}
