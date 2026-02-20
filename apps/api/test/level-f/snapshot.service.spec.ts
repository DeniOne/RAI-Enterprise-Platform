import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotService } from '../../src/level-f/snapshot/snapshot.service';
import { PrismaService } from '../../src/shared/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { CanonicalJsonBuilder } from '../../src/shared/crypto/canonical-json.builder';

describe('SnapshotService', () => {
    let service: SnapshotService;
    let prismaService: jest.Mocked<PrismaService>;

    beforeEach(async () => {
        const prismaMock = {
            company: {
                findUnique: jest.fn().mockResolvedValue({ id: 'comp_id_1', name: 'Test' }),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SnapshotService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        service = module.get<SnapshotService>(SnapshotService);
        prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('[S2] creates a valid DAG node and updates head', async () => {
        const startHead = service.getHeadHash();
        const node = await service.createSnapshot({
            companyId: 'comp_id_1',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        });

        expect(node.payload.previousHash).toEqual(startHead);
        expect(node.hash).toBeDefined();
        expect(service.getHeadHash()).toEqual(node.hash);

        // Verify hash
        const hash = CanonicalJsonBuilder.hash(CanonicalJsonBuilder.stringify(node.payload));
        expect(node.hash).toEqual(hash);
    });

    it('[S3] Temporal consistency: validates valid skew', async () => {
        const node = await service.createSnapshot({
            companyId: 'comp_id_1',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        });

        const trustedTimeMs = node.payload.nonce + 1000; // 1s drift
        (service as any).dagHeadHash = node.payload.previousHash; // Simulate receiving external snapshot
        expect(service.validateIncomingSnapshot(node, trustedTimeMs, 300000)).toBe(true);
    });

    it('[S3] Temporal consistency: rejects too large skew', async () => {
        const node = await service.createSnapshot({
            companyId: 'comp_id_1',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        });

        const trustedTimeMs = node.payload.nonce + 400000; // 400s drift > max 300s
        (service as any).dagHeadHash = node.payload.previousHash; // Simulate receiving external snapshot
        expect(service.validateIncomingSnapshot(node, trustedTimeMs, 300000)).toBe(false);
    });

    it('[S2] DAG Continuity: rejects invalid previous hash', async () => {
        const node = await service.createSnapshot({
            companyId: 'comp_id_1',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-01-31'),
        });

        const manipulatedNode = { ...node, payload: { ...node.payload, previousHash: 'invalid' } };
        const validHashForManipulated = CanonicalJsonBuilder.hash(CanonicalJsonBuilder.stringify(manipulatedNode.payload));
        manipulatedNode.hash = validHashForManipulated;

        // reset head so it expects `node.hash` but we give `invalid`
        const trustedTimeMs = node.payload.nonce + 1000;

        expect(() => service.validateIncomingSnapshot(manipulatedNode, trustedTimeMs)).toThrow(ConflictException);
    });
});
