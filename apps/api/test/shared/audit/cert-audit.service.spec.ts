import { Test, TestingModule } from '@nestjs/testing';
import { CertAuditService } from '../../../src/shared/audit/cert-audit/cert-audit.service';
import { PrismaService } from '../../../src/shared/prisma/prisma.service';
import { CertAuditStatus } from '@rai/prisma-client';

describe('CertAuditService', () => {
    let service: CertAuditService;
    let prismaService: jest.Mocked<PrismaService>;

    beforeEach(async () => {
        const prismaMock = {
            levelFCertAudit: {
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CertAuditService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        service = module.get<CertAuditService>(CertAuditService);
        prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should log signature intent correctly', async () => {
        const params = {
            companyId: 'company_id',
            initiatorProcess: 'test_process',
            snapshotHash: 'hash',
            kidUsed: 'key_id',
        };

        (prismaService.levelFCertAudit.create as jest.Mock).mockResolvedValue({ id: '1', ...params, status: CertAuditStatus.SIGNATURE_INTENT });

        const result = await service.logSignatureIntent(params);
        expect(prismaService.levelFCertAudit.create).toHaveBeenCalledWith({
            data: {
                companyId: params.companyId,
                initiatorProcess: params.initiatorProcess,
                snapshotHash: params.snapshotHash,
                kidUsed: params.kidUsed,
                quorumReceipt: undefined,
                status: CertAuditStatus.SIGNATURE_INTENT,
            }
        });
        expect(result.status).toEqual(CertAuditStatus.SIGNATURE_INTENT);
    });

    it('should log signature completed correctly', async () => {
        const params = {
            companyId: 'company_id',
            initiatorProcess: 'test_process',
            snapshotHash: 'hash',
            kidUsed: 'key_id',
        };

        (prismaService.levelFCertAudit.create as jest.Mock).mockResolvedValue({ id: '2', ...params, status: CertAuditStatus.SIGNATURE_COMPLETED });

        const result = await service.logSignatureCompleted(params);
        expect(prismaService.levelFCertAudit.create).toHaveBeenCalledWith({
            data: {
                companyId: params.companyId,
                initiatorProcess: params.initiatorProcess,
                snapshotHash: params.snapshotHash,
                kidUsed: params.kidUsed,
                status: CertAuditStatus.SIGNATURE_COMPLETED,
            }
        });
        expect(result.status).toEqual(CertAuditStatus.SIGNATURE_COMPLETED);
    });
});
