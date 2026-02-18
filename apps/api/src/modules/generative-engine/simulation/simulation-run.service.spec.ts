import { Test, TestingModule } from '@nestjs/testing';
import { SimulationRunService } from './simulation-run.service';
import { ScenarioExecutor } from './scenario-executor';
import { IsolationGuard } from './isolation-guard';
import { YieldForecastService } from '../yield/yield-forecast.service';

describe('SimulationRunService', () => {
    let service: SimulationRunService;
    let yieldService: YieldForecastService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SimulationRunService,
                {
                    provide: ScenarioExecutor,
                    useValue: { applyScenario: jest.fn().mockImplementation(d => d) },
                },
                {
                    provide: IsolationGuard,
                    useValue: { assertIsolation: jest.fn() },
                },
                {
                    provide: YieldForecastService,
                    useValue: { predict: jest.fn().mockReturnValue({ target: 5.0 }) },
                },
            ],
        }).compile();

        service = module.get<SimulationRunService>(SimulationRunService);
        yieldService = module.get<YieldForecastService>(YieldForecastService);
    });

    it('должен запускать симуляцию для списка сценариев', async () => {
        const draft: any = { generationMetadata: { hash: 'h1' } };
        const scenarios = [{ id: 's1', modifications: [] }];

        const result = await service.runSimulation(draft, scenarios);

        expect(result.scenariosRun).toBe(1);
        expect(yieldService.predict).toHaveBeenCalled();
        expect(result.results[0].forecast.target).toBe(5.0);
    });
});
