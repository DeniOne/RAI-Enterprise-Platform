import { RiskSignal } from '@rai/prisma-client';

export interface RiskSignalCollector {
    collect(companyId: string): Promise<RiskSignal[]>;
}
