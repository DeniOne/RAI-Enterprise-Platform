import { Test, TestingModule } from '@nestjs/testing';
import { MetadataBuilder } from './metadata-builder';
import { StableHasher } from '../deterministic/stable-hasher';

describe('MetadataBuilder', () => {
    let builder: MetadataBuilder;
    let hasher: StableHasher;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetadataBuilder,
                {
                    provide: StableHasher,
                    useValue: { hashGeneration: jest.fn().mockReturnValue('mock-hash') },
                },
            ],
        }).compile();

        builder = module.get<MetadataBuilder>(MetadataBuilder);
        hasher = module.get<StableHasher>(StableHasher);
    });

    it('должен строить метаданные корректно', () => {
        const payload = 'canonical-payload';
        const seed = '12345';
        const timestamp = '2026-01-01T00:00:00Z';

        const metadata = builder.buildMetadata(payload, seed, timestamp);

        expect(metadata.seed).toBe(seed);
        expect(metadata.generatedAt).toBe(timestamp);
        expect(metadata.hash).toBe('mock-hash');
        expect(hasher.hashGeneration).toHaveBeenCalledWith(payload, expect.any(String), seed);
    });
});
