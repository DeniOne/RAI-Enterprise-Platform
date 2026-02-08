import { PrismaClient } from '@rai/prisma-client';
import { IComplianceSignal } from '../interfaces/index';
export declare class ComplianceEngine {
    private prisma;
    constructor(prisma: PrismaClient);
    checkRequirement(requirementId: string): Promise<IComplianceSignal>;
    checkAllForCompany(companyId: string): Promise<IComplianceSignal[]>;
}
