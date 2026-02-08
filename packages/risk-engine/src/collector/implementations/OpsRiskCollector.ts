import { RiskSignalCollector } from '../RiskSignalCollector';
import { RiskSignal, RiskSource, RiskSeverity, RiskReferenceType, PrismaClient } from '@rai/prisma-client';

export class OpsRiskCollector implements RiskSignalCollector {
    constructor(private prisma: PrismaClient) { }

    async collect(companyId: string): Promise<RiskSignal[]> {
        // Stub for B6 - implement real logic later
        // User Canon: "deviation from ATK"
        return [];
    }
}
