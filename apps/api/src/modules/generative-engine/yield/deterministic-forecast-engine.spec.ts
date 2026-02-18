import { Test, TestingModule } from '@nestjs/testing';
import { DeterministicForecastEngine } from './deterministic-forecast-engine';
import { InputDataSnapshot } from './input-data-snapshot';

describe('DeterministicForecastEngine', () => {
    let engine: DeterministicForecastEngine;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DeterministicForecastEngine],
        }).compile();

        engine = module.get<DeterministicForecastEngine>(DeterministicForecastEngine);
    });

    it('должен рассчитывать прогноз детерминированно', () => {
        const draft: any = {
            crop: 'Wheat',
            stages: [
                { operations: [{ name: 'Op1' }] }, // +1%
                { operations: [{ name: 'Op2' }] }  // +1%
            ]
        };
        const snapshot: InputDataSnapshot = {
            soilType: 'Chernozem',
            moisture: 50,
            nutrients: { n: 100, p: 50, k: 30 },
            historicalYield: 5.0,
            weatherForecast: [{ avgTemp: 20, precipitation: 100 }], // rainfall=100 < 300 -> factor 0.9
        };

        const result = engine.calculateYield(draft, snapshot);

        // Calculation:
        // Base = 5.0
        // Ops = 1.0 + 0.01 + 0.01 = 1.02
        // Rain = 0.9 (since 100 < 300)
        // Target = 5.0 * 1.02 * 0.9 = 4.59

        expect(result.target).toBeCloseTo(4.59, 2);
        expect(result.unit).toBe('t/ha');
        expect(result.factors.base).toBe(5.0);
    });

    it('должен учитывать высокий уровень осадков', () => {
        const draft: any = { stages: [] };
        const snapshot: any = {
            historicalYield: 5.0,
            weatherForecast: [{ precipitation: 400 }] // rainfall=400 > 300 -> factor 1.1
        };

        const result = engine.calculateYield(draft, snapshot);

        // Target = 5.0 * 1.0 * 1.1 = 5.5
        expect(result.target).toBeCloseTo(5.5, 2);
    });
});
