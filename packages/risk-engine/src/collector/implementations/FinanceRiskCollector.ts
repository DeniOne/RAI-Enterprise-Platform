import { RiskSignalCollector } from '../RiskSignalCollector';
import { RiskSignal, RiskSource, RiskSeverity, RiskReferenceType, PrismaClient, BudgetStatus } from '@rai/prisma-client';

export class FinanceRiskCollector implements RiskSignalCollector {
    constructor(private prisma: PrismaClient) { }

    async collect(companyId: string): Promise<RiskSignal[]> {
        const signals: RiskSignal[] = [];

        // 1. Check Bad Budget Statuses
        const badBudgets = await this.prisma.budget.findMany({
            where: {
                companyId,
                status: {
                    in: [BudgetStatus.EXHAUSTED, BudgetStatus.BLOCKED]
                }
            }
        });

        for (const b of badBudgets) {
            signals.push({
                id: `fin-${b.id}`,
                source: RiskSource.FINANCE,
                severity: RiskSeverity.HIGH, // Exhausted budget is High Logic
                reasonCode: 'FIN-BUDGET-EXHAUSTED',
                description: `Budget ${b.name} is ${b.status}.`,
                referenceType: RiskReferenceType.TRANSACTION, // Closest match
                referenceId: b.id,
                companyId,
                createdAt: new Date()
            } as any);
        }

        return signals;
    }
}
