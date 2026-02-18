import { Test, TestingModule } from '@nestjs/testing';
import { DeterministicGenerator } from '../src/modules/generative-engine/deterministic/deterministic-generator';
import { SeedManager } from '../src/modules/generative-engine/deterministic/seed-manager';
import { EntropyController } from '../src/modules/generative-engine/domain/entropy-controller';
import { CanonicalSorter } from '../src/modules/generative-engine/deterministic/canonical-sorter';
import { StableHasher } from '../src/modules/generative-engine/deterministic/stable-hasher';
import * as fs from 'fs';
import * as path from 'path';

import { DraftFactory } from '../src/modules/generative-engine/domain/draft-factory';
import { MetadataBuilder } from '../src/modules/generative-engine/domain/metadata-builder';
import { ConstraintPropagator } from '../src/modules/generative-engine/domain/constraint-propagator';
import { IntegrityGateGenerative } from '../src/modules/generative-engine/validation/integrity-gate-generative';

describe('GenerativeEngine Determinism Proof (G-IMPL-2)', () => {
    let generator: DeterministicGenerator;
    const ARTIFACT_PATH = 'DETERMINISM_PROOF.json';

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

    it('должен сгенерировать детерминированный proof artifact', async () => {
        const results = [];
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

        // 10 Runs with different seeds/inputs
        for (let i = 0; i < 10; i++) {
            const params = {
                ...baseParams,
                explicitSeed: 1000 + i, // Fixed seeds for reproducibility
            };

            // Mock strategy retrieval
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

            const draft = await generator.generate(
                params,
                strategy.operations,
                strategy.constraints,
                1 // version
            );

            results.push({
                run: i + 1,
                input: params,
                output: {
                    seed: draft.generationMetadata.seed,
                    hash: draft.generationMetadata.hash
                }
            });
        }

        // Verify duplicates produce same hash
        const run1 = results[0];
        const draftReplay = await generator.generate(
            run1.input,
            [{ name: 'Op1', sequence: 1, stageName: 'Stage1', stageSequence: 1, resources: [] }], // operations
            [], // constraints
            1 // version
        );
        expect(draftReplay.generationMetadata.hash).toBe(run1.output.hash);

        // Save Artifact
        const proof = {
            generatedAt: new Date().toISOString(),
            proofType: 'DETERMINISTIC_REPLAY',
            engineVersion: '1.0.0',
            runs: results,
            validation: 'PASSED'
        };

        fs.writeFileSync(path.resolve(process.cwd(), ARTIFACT_PATH), JSON.stringify(proof, null, 2));
        console.log(`Proof saved to ${ARTIFACT_PATH}`);
    });
});
