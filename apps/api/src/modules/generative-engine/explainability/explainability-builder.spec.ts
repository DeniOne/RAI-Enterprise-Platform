import { Test, TestingModule } from '@nestjs/testing';
import { ExplainabilityBuilder } from './explainability-builder';
import { FactorExtractor } from './factor-extractor';
import { RationaleGenerator } from './rationale-generator';

describe('ExplainabilityBuilder', () => {
    let builder: ExplainabilityBuilder;
    let factorExtractor: FactorExtractor;
    let rationaleGenerator: RationaleGenerator;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExplainabilityBuilder,
                {
                    provide: FactorExtractor,
                    useValue: { extractFactors: jest.fn().mockReturnValue([]) },
                },
                {
                    provide: RationaleGenerator,
                    useValue: { generateRationale: jest.fn().mockReturnValue('Rationale') },
                },
            ],
        }).compile();

        builder = module.get<ExplainabilityBuilder>(ExplainabilityBuilder);
        factorExtractor = module.get<FactorExtractor>(FactorExtractor);
        rationaleGenerator = module.get<RationaleGenerator>(RationaleGenerator);
    });

    it('должен строить отчет используя зависимости', () => {
        const draft: any = {
            crop: 'Wheat',
            stages: [],
            propagatedConstraints: [],
        };
        const factors = [{ type: 'F1', description: 'Desc', impact: 'HIGH' }];
        (factorExtractor.extractFactors as jest.Mock).mockReturnValue(factors);

        const report = builder.buildReport(draft, 'Strategy 1');

        expect(factorExtractor.extractFactors).toHaveBeenCalledWith(draft);
        expect(rationaleGenerator.generateRationale).toHaveBeenCalledWith(factors);
        expect(report.factors[0].name).toBe('F1');
        expect(report.strategyRationale).toBe('Rationale');
    });
});
