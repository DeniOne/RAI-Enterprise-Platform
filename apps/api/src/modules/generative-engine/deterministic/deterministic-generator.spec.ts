import { Test, TestingModule } from '@nestjs/testing';
import { DeterministicGenerator } from './deterministic-generator';
import { EntropyController } from '../domain/entropy-controller';
import { DraftFactory } from '../domain/draft-factory';
import { MetadataBuilder } from '../domain/metadata-builder';
import { ConstraintPropagator } from '../domain/constraint-propagator';
import { SeedManager } from './seed-manager';
import { CanonicalSorter } from './canonical-sorter';
import { IntegrityGateGenerative } from '../validation/integrity-gate-generative';

describe('DeterministicGenerator', () => {
    let generator: DeterministicGenerator;
    let entropyController: EntropyController;
    let seedManager: SeedManager;
    let canonicalSorter: CanonicalSorter;
    let metadataBuilder: MetadataBuilder;
    let draftFactory: DraftFactory;
    let constraintPropagator: ConstraintPropagator;
    let integrityGate: IntegrityGateGenerative;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeterministicGenerator,
                {
                    provide: EntropyController,
                    useValue: {
                        computeFixedTimestamp: jest.fn().mockReturnValue('2026-01-01T00:00:00Z'),
                        wrapDeterministicContext: jest.fn().mockImplementation((fn) => fn()),
                    },
                },
                {
                    provide: DraftFactory,
                    useValue: { createDraft: jest.fn() },
                },
                {
                    provide: MetadataBuilder,
                    useValue: { buildMetadata: jest.fn() },
                },
                {
                    provide: ConstraintPropagator,
                    useValue: { propagate: jest.fn() },
                },
                {
                    provide: SeedManager,
                    useValue: { resolveSeed: jest.fn().mockReturnValue('12345') },
                },
                {
                    provide: CanonicalSorter,
                    useValue: {
                        canonicalize: jest.fn().mockReturnValue('{"canonical":true}'),
                        assertIdempotent: jest.fn()
                    },
                },
                {
                    provide: IntegrityGateGenerative,
                    useValue: { validateGeneratedDraft: jest.fn() },
                },
            ],
        }).compile();

        generator = module.get<DeterministicGenerator>(DeterministicGenerator);
        entropyController = module.get<EntropyController>(EntropyController);
        seedManager = module.get<SeedManager>(SeedManager);
        canonicalSorter = module.get<CanonicalSorter>(CanonicalSorter);
        metadataBuilder = module.get<MetadataBuilder>(MetadataBuilder);
        draftFactory = module.get<DraftFactory>(DraftFactory);
        constraintPropagator = module.get<ConstraintPropagator>(ConstraintPropagator);
        integrityGate = module.get<IntegrityGateGenerative>(IntegrityGateGenerative);
    });

    it('должен оркестровать детерминированный пайплайн корректно', async () => {
        const params: any = { strategyId: 's1', companyId: 'c1', explicitSeed: 999 };
        const templates: any[] = [];
        const constraints: any[] = [];
        const version = 1;

        const mockDraft: any = { status: 'GENERATED_DRAFT', generationMetadata: { hash: 'abc' } };
        (draftFactory.createDraft as jest.Mock).mockReturnValue(mockDraft);
        (constraintPropagator.propagate as jest.Mock).mockReturnValue(mockDraft);

        const result = await generator.generate(params, templates, constraints, version);

        // 1. Каноникализация
        expect(canonicalSorter.canonicalize).toHaveBeenCalled();
        expect(canonicalSorter.assertIdempotent).toHaveBeenCalled();

        // 2. Resolve seed
        expect(seedManager.resolveSeed).toHaveBeenCalledWith(expect.any(String), 999);

        // 3. Timestamp
        expect(entropyController.computeFixedTimestamp).toHaveBeenCalledWith('12345');

        // 4. Context wrap
        expect(entropyController.wrapDeterministicContext).toHaveBeenCalled();

        // 5. Metadata
        expect(metadataBuilder.buildMetadata).toHaveBeenCalledWith(
            expect.any(String),
            '12345',
            '2026-01-01T00:00:00Z'
        );

        // 6. Post-validation
        expect(integrityGate.validateGeneratedDraft).toHaveBeenCalledWith(mockDraft, expect.any(String));

        expect(result).toBe(mockDraft);
    });
});
