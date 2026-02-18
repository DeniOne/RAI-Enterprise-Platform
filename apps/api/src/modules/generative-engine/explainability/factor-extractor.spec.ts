import { Test, TestingModule } from '@nestjs/testing';
import { FactorExtractor } from './factor-extractor';

describe('FactorExtractor', () => {
    let extractor: FactorExtractor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FactorExtractor],
        }).compile();

        extractor = module.get<FactorExtractor>(FactorExtractor);
    });

    it('должен извлекать факторы из ограничений', () => {
        const draft: any = {
            propagatedConstraints: [
                { type: 'TIMING', field: 'date', operator: 'GT', value: 'now', message: 'Too late' }
            ]
        };

        const factors = extractor.extractFactors(draft);

        expect(factors).toHaveLength(1);
        expect(factors[0].type).toBe('CONSTRAINT');
        expect(factors[0].impact).toBe('HIGH');
        expect(factors[0].description).toContain('TIMING');
    });

    it('должен извлекать фактор модели', () => {
        const draft: any = {
            generationMetadata: { modelId: 'm1', modelVersion: '1.0' }
        };

        const factors = extractor.extractFactors(draft);

        expect(factors).toHaveLength(1);
        expect(factors[0].type).toBe('MODEL_SELECTION');
        expect(factors[0].description).toContain('m1');
    });
});
