import { Test, TestingModule } from '@nestjs/testing';
import { DeterministicGenerator } from '../src/modules/generative-engine/deterministic/deterministic-generator';
import { SeedManager } from '../src/modules/generative-engine/deterministic/seed-manager';
import { EntropyController } from '../src/modules/generative-engine/domain/entropy-controller';
import { CanonicalSorter } from '../src/modules/generative-engine/deterministic/canonical-sorter';
import { StableHasher } from '../src/modules/generative-engine/deterministic/stable-hasher';
import { DraftFactory } from '../src/modules/generative-engine/domain/draft-factory';
import { MetadataBuilder } from '../src/modules/generative-engine/domain/metadata-builder';
import { ConstraintPropagator } from '../src/modules/generative-engine/domain/constraint-propagator';
import { IntegrityGateGenerative } from '../src/modules/generative-engine/validation/integrity-gate-generative';

describe('GenerativeEngine PBT (G-IMPL-2)', () => {
    let generator: DeterministicGenerator;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeterministicGenerator,
                SeedManager,
                EntropyController,
                CanonicalSorter,
                StableHasher,
                DraftFactory,
                MetadataBuilder,
                ConstraintPropagator,
                IntegrityGateGenerative,
            ],
        }).compile();

        generator = module.get<DeterministicGenerator>(DeterministicGenerator);
    });

    it('PBT-I19-01: Deterministic Replay (10,000 runs)', async () => {
        const ITERATIONS = 10000;
        const baseParams = {
            strategyId: 's1',
            strategyVersion: 1,
            cropId: 'c1',
            seasonId: 'season_2025',
            fieldId: 'f1',
            companyId: 'company_A',
            soilType: 'Chernozem',
            harvestPlanId: 'hp1',
        };

        const strategy: any = {
            id: 's1',
            operations: [{
                name: 'Op1',
                sequence: 1,
                stageName: 'Stage1',
                stageSequence: 1,
                resources: []
            }],
            constraints: []
        };

        console.log(`Starting PBT with ${ITERATIONS} iterations...`);
        const start = Date.now();

        for (let i = 0; i < ITERATIONS; i++) {
            // Generate random seed for this iteration
            // We use a pseudo-random input but verify deterministic output for THAT input
            const explicitSeed = (i * 1234567) % 10000000; // Simple deterministic PRNG for test inputs

            const params = { ...baseParams, explicitSeed };

            // Run 1
            const draft1 = await generator.generate(params, strategy.operations, strategy.constraints, 1);

            // Run 2 (Replay)
            const draft2 = await generator.generate(params, strategy.operations, strategy.constraints, 1);

            // Assert exact match
            if (draft1.generationMetadata.hash !== draft2.generationMetadata.hash) {
                throw new Error(`Determinism violation at iteration ${i}! seed=${explicitSeed}`);
            }

            // Periodically log progress
            if (i % 1000 === 0) {
                process.stdout.write('.');
            }
        }

        console.log(`\nCompleted ${ITERATIONS} iterations in ${(Date.now() - start) / 1000}s. All deterministic.`);
    }, 300000); // 5 min timeout
});
