import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ComplianceEngine } from './ComplianceEngine';
import { PrismaClient, ComplianceStatus, LegalObligationStatus } from '@rai/prisma-client';

describe('ComplianceEngine', () => {
    let engine: ComplianceEngine;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            legalRequirement: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
            },
            complianceCheck: {
                create: jest.fn(),
            },
        };
        engine = new ComplianceEngine(mockPrisma as unknown as PrismaClient);
    });

    it('should throw if requirement not found', async () => {
        mockPrisma.legalRequirement.findUnique.mockResolvedValue(null);
        await expect(engine.checkRequirement('req-1')).rejects.toThrow('Requirement req-1 not found');
    });

    it('should return COMPLIANT if all obligations are met', async () => {
        mockPrisma.legalRequirement.findUnique.mockResolvedValue({
            id: 'req-1',
            companyId: 'comp-1',
            obligations: [
                { status: LegalObligationStatus.COMPLIANT }
            ]
        });

        const signal = await engine.checkRequirement('req-1');
        expect(signal.status).toBe(ComplianceStatus.COMPLIANT);
        expect(mockPrisma.complianceCheck.create).toHaveBeenCalled();
        expect(mockPrisma.legalRequirement.update).toHaveBeenCalledWith({
            where: { id: 'req-1' },
            data: { status: ComplianceStatus.COMPLIANT }
        });
    });

    it('should return VIOLATED if any obligation is overdue', async () => {
        mockPrisma.legalRequirement.findUnique.mockResolvedValue({
            id: 'req-2',
            companyId: 'comp-1',
            obligations: [
                { status: LegalObligationStatus.OVERDUE }
            ]
        });

        const signal = await engine.checkRequirement('req-2');
        expect(signal.status).toBe(ComplianceStatus.VIOLATED);
    });

    it('should return AT_RISK if some obligations are pending and none overdue', async () => {
        mockPrisma.legalRequirement.findUnique.mockResolvedValue({
            id: 'req-3',
            companyId: 'comp-1',
            obligations: [
                { status: LegalObligationStatus.PENDING },
                { status: LegalObligationStatus.COMPLIANT }
            ]
        });

        const signal = await engine.checkRequirement('req-3');
        expect(signal.status).toBe(ComplianceStatus.AT_RISK);
    });
});
