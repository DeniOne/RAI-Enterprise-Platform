"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceEngine = void 0;
const prisma_client_1 = require("@rai/prisma-client");
class ComplianceEngine {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkRequirement(requirementId) {
        const requirement = await this.prisma.legalRequirement.findUnique({
            where: { id: requirementId },
            include: { obligations: true }
        });
        if (!requirement) {
            throw new Error(`Requirement ${requirementId} not found`);
        }
        let status = prisma_client_1.ComplianceStatus.COMPLIANT;
        let observation = "All obligations are met.";
        const overdueObligations = requirement.obligations.filter((o) => o.status === 'OVERDUE');
        if (overdueObligations.length > 0) {
            status = prisma_client_1.ComplianceStatus.VIOLATED;
            observation = `Found ${overdueObligations.length} overdue obligations.`;
        }
        else if (requirement.obligations.some((o) => o.status === 'PENDING')) {
            status = prisma_client_1.ComplianceStatus.AT_RISK;
            observation = "Some obligations are pending.";
        }
        const signal = {
            requirementId,
            status,
            observation,
            confidenceLevel: 1.0,
            checkedAt: new Date()
        };
        await this.prisma.complianceCheck.create({
            data: {
                requirementId: signal.requirementId,
                status: signal.status,
                observation: signal.observation,
                confidenceLevel: signal.confidenceLevel,
                companyId: requirement.companyId
            }
        });
        await this.prisma.legalRequirement.update({
            where: { id: requirementId },
            data: { status }
        });
        return signal;
    }
    async checkAllForCompany(companyId) {
        const requirements = await this.prisma.legalRequirement.findMany({
            where: { companyId },
            select: { id: true }
        });
        const results = await Promise.all(requirements.map((req) => this.checkRequirement(req.id)));
        return results;
    }
}
exports.ComplianceEngine = ComplianceEngine;
//# sourceMappingURL=ComplianceEngine.js.map