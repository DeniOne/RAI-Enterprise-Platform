import { Test, TestingModule } from '@nestjs/testing';
import { YieldForecastService } from './yield-forecast.service';
import { DeterministicForecastEngine } from './deterministic-forecast-engine';

describe('YieldForecastService', () => {
    let service: YieldForecastService;
    let engine: DeterministicForecastEngine;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                YieldForecastService,
                {
                    provide: DeterministicForecastEngine,
                    useValue: { calculateYield: jest.fn().mockReturnValue({ target: 5.0 }) },
                },
            ],
        }).compile();

        service = module.get<YieldForecastService>(YieldForecastService);
        engine = module.get<DeterministicForecastEngine>(DeterministicForecastEngine);
    });

    it('должен вызывать engine с собранным snapshot', async () => {
        const draft: any = {
            crop: 'Wheat',
            generationMetadata: { hash: 'h1' },
            soilType: 'Clay',
        };

        const result = await service.predict(draft);

        expect(engine.calculateYield).toHaveBeenCalledWith(
            draft,
            expect.objectContaining({ soilType: 'Clay', historicalYield: 4.5 })
        );
        expect(result.target).toBe(5.0);
        expect(result.generatedAt).toBeDefined();
    });
});
