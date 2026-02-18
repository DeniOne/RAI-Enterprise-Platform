import { Test, TestingModule } from '@nestjs/testing';
import { IntegrityGateGenerative } from './integrity-gate-generative';
import { StableHasher } from '../deterministic/stable-hasher';
import { CanonicalSorter } from '../deterministic/canonical-sorter';

describe('IntegrityGateGenerative', () => {
    let gate: IntegrityGateGenerative;
    let hasher: StableHasher;
    let sorter: CanonicalSorter;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IntegrityGateGenerative,
                {
                    provide: StableHasher,
                    useValue: {
                        hashGeneration: jest.fn().mockReturnValue('correct-hash'),
                        verifyGeneration: jest.fn().mockImplementation((p, v, s, h) => h === 'correct-hash')
                    },
                },
                {
                    provide: CanonicalSorter,
                    useValue: {
                        canonicalize: jest.fn().mockReturnValue('{"stable":true}'),
                        assertIdempotent: jest.fn()
                    },
                },
            ],
        }).compile();

        gate = module.get<IntegrityGateGenerative>(IntegrityGateGenerative);
        hasher = module.get<StableHasher>(StableHasher);
        sorter = module.get<CanonicalSorter>(CanonicalSorter);
    });

    describe('validateGeneratedDraft', () => {
        it('должен проходить, если хеш совпадает и каноникализация idempotent', () => {
            const draft: any = {
                status: 'GENERATED_DRAFT',
                stages: [{}],
                companyId: 'c1',
                generationMetadata: {
                    hash: 'correct-hash',
                    seed: '12345',
                    modelVersion: '1.0.0'
                }
            };
            const payload = '{"stable":true}';

            expect(() => gate.validateGeneratedDraft(draft, payload)).not.toThrow();
            expect(hasher.hashGeneration).toHaveBeenCalled();

        });

        it('должен кидать ошибку, если хеш НЕ совпадает', () => {
            const draft: any = {
                status: 'GENERATED_DRAFT',
                stages: [{}],
                companyId: 'c1',
                generationMetadata: {
                    hash: 'WRONG-HASH',
                    seed: '12345',
                    modelVersion: '1.0.0'
                }
            };
            const payload = '{"stable":true}';

            expect(() => gate.validateGeneratedDraft(draft, payload)).toThrow(/Hash mismatch/);
        });

        it('должен кидать ошибку, если каноникализация не idempotent', () => {
            const draft: any = {
                status: 'GENERATED_DRAFT',
                generationMetadata: { hash: 'h', seed: 's', modelId: 'm' },
                stages: [{}],
                companyId: 'c1'
            };
            const payload = '{"a":1}';

            // Simulating idempotency failure: canonical(payload) != payload
            (sorter.canonicalize as jest.Mock).mockReturnValue('{"a":2}');

            expect(() => gate.validateGeneratedDraft(draft, payload)).toThrow(/Canonicalization NOT idempotent/);
        });
    });

    describe('validateRecordIntegrity', () => {
        it('должен подтверждать целостность записи в БД', () => {
            const record: any = {
                canonicalizedPayload: 'payload',
                modelVersion: '1.0.0',
                seed: '12345',
                canonicalHash: 'correct-hash'
            };

            expect(() => gate.validateRecordIntegrity(record)).not.toThrow();
        });

        it('должен возвращать false при нарушении целостности записи', () => {
            const record: any = {
                canonicalizedPayload: 'payload',
                modelVersion: '1.0.0',
                seed: '12345',
                canonicalHash: 'TAMPERED-HASH'
            };

            expect(gate.validateRecordIntegrity(record)).toBe(false);
        });
    });
});
