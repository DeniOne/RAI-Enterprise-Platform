import { PrismaClient, ComplianceStatus, LegalObligation, LegalObligationStatus } from '@rai/prisma-client';
import { IComplianceSignal } from '../interfaces/index';

export class ComplianceEngine {
    constructor(private prisma: PrismaClient) { }

    /**
     * Запуск проверки комплаенса для конкретного требования.
     * Вычисляет статус, но НЕ блокирует операции.
     */
    async checkRequirement(requirementId: string): Promise<IComplianceSignal> {
        const requirement = await this.prisma.legalRequirement.findUnique({
            where: { id: requirementId },
            include: { obligations: true }
        });

        if (!requirement) {
            throw new Error(`Requirement ${requirementId} not found`);
        }

        // Логика вычисления статуса на основе обязательств
        let status: ComplianceStatus = ComplianceStatus.COMPLIANT;
        let observation = "All obligations are met.";

        const overdueObligations = requirement.obligations.filter((o: LegalObligation) => o.status === LegalObligationStatus.OVERDUE);

        if (overdueObligations.length > 0) {
            status = ComplianceStatus.VIOLATED;
            observation = `Found ${overdueObligations.length} overdue obligations.`;
        } else if (requirement.obligations.some((o: LegalObligation) => o.status === LegalObligationStatus.PENDING)) {
            status = ComplianceStatus.AT_RISK;
            observation = "Some obligations are pending.";
        }

        const signal: IComplianceSignal = {
            requirementId,
            status,
            observation,
            confidenceLevel: 1.0,
            checkedAt: new Date()
        };

        // Сохраняем результат в историю проверок
        await this.prisma.complianceCheck.create({
            data: {
                requirementId: signal.requirementId,
                status: signal.status,
                observation: signal.observation,
                confidenceLevel: signal.confidenceLevel,
                companyId: requirement.companyId
            }
        });

        // Обновляем статус в самом требовании
        await this.prisma.legalRequirement.update({
            where: { id: requirementId },
            data: { status }
        });

        return signal;
    }

    /**
     * Массовая проверка по тенанту
     */
    async checkAllForCompany(companyId: string): Promise<IComplianceSignal[]> {
        const requirements = await this.prisma.legalRequirement.findMany({
            where: { companyId },
            select: { id: true }
        });

        const results: IComplianceSignal[] = await Promise.all(
            requirements.map((req: { id: string }) => this.checkRequirement(req.id))
        );

        return results;
    }
}
