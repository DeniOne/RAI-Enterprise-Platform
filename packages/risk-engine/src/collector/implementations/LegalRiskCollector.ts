import { RiskSignalCollector } from '../RiskSignalCollector';
import { RiskSignal, RiskSource, RiskSeverity, RiskReferenceType, PrismaClient, ComplianceStatus } from '@rai/prisma-client';

export class LegalRiskCollector implements RiskSignalCollector {
    constructor(private prisma: PrismaClient) { }

    async collect(companyId: string): Promise<RiskSignal[]> {
        const signals: RiskSignal[] = [];

        // 1. Check for Active Violations (ComplianceStatus = VIOLATED)
        const violations = await this.prisma.legalRequirement.findMany({
            where: {
                companyId,
                status: ComplianceStatus.VIOLATED
            }
        });

        for (const v of violations) {
            signals.push({
                id: `legal-${v.id}`, // Temporary ID
                source: RiskSource.LEGAL,
                severity: RiskSeverity.CRITICAL,
                reasonCode: 'LR-VIOLATION',
                description: `Legal Requirement violated: ${v.summary?.substring(0, 50)}...`,
                referenceType: RiskReferenceType.REQUIREMENT,
                referenceId: v.id,
                companyId,
                createdAt: new Date(),
                // @ts-ignore - Prisma Client fields might differ slightly in generated type vs construction
                isMock: true // Using a mock approach if type strictness issues arise during dev
            } as any);
        }

        // 2. Check for Risks (ComplianceStatus = AT_RISK)
        const atRisk = await this.prisma.legalRequirement.findMany({
            where: {
                companyId,
                status: ComplianceStatus.AT_RISK
            }
        });

        for (const r of atRisk) {
            signals.push({
                id: `legal-${r.id}`,
                source: RiskSource.LEGAL,
                severity: RiskSeverity.HIGH,
                reasonCode: 'LR-AT-RISK',
                description: `Legal Requirement at risk: ${r.summary?.substring(0, 50)}...`,
                referenceType: RiskReferenceType.REQUIREMENT,
                referenceId: r.id,
                companyId,
                createdAt: new Date()
            } as any);
        }

        return signals;
    }
}
