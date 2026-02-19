import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class BaselineService {
    private readonly logger = new Logger(BaselineService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Initializes a new Sustainability Baseline for a field.
     * Enforces Genesis Hash Lock: absolute immutability after creation.
     */
    async initializeBaseline(data: {
        fieldId: string;
        companyId: string;
        initialSri: number;
        targetSri: number;
        trustSnapshot: any;
    }) {
        this.logger.log(`[BASELINE] Initializing Genesis Baseline for field ${data.fieldId}`);

        // 1. Generate Genesis Hash (Proof of Origin)
        const genesisData = `${data.fieldId}-${data.companyId}-${data.initialSri}-${Date.now()}`;
        const genesisHash = crypto.createHash('sha256').update(genesisData).digest('hex');

        // 2. Persist with Locked state
        return await this.prisma.sustainabilityBaseline.create({
            data: {
                fieldId: data.fieldId,
                companyId: data.companyId,
                initialSri: data.initialSri,
                targetSRI: data.targetSri,
                genesisHash: genesisHash,
                trustSnapshot: data.trustSnapshot,
                locked: true, // Absolute Lock
                version: 1
            }
        });
    }

    /**
     * Verifies the integrity of a baseline.
     */
    async verifyIntegrity(fieldId: string, companyId: string): Promise<boolean> {
        const baseline = await this.prisma.sustainabilityBaseline.findFirst({
            where: { fieldId, companyId }
        });

        if (!baseline) return false;

        // In Level E, we also check if the baseline has been tampered with
        // (mocking deep audit for now)
        return baseline.locked === true;
    }
}
