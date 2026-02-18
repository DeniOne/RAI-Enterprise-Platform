import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioExecutor } from './scenario-executor';

describe('ScenarioExecutor', () => {
    let executor: ScenarioExecutor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ScenarioExecutor],
        }).compile();

        executor = module.get<ScenarioExecutor>(ScenarioExecutor);
    });

    it('должен применять изменения к черновику (in-memory)', () => {
        const draft: any = { moisture: 50 };
        const modifications = [{ op: 'replace', path: 'moisture', value: 60 }];

        const result = executor.applyScenario(draft, modifications);

        expect(result.moisture).toBe(60);
        expect(draft.moisture).toBe(50); // Original intact
    });

    it('должен возвращать копию черновика даже без изменений', () => {
        const draft: any = { moisture: 50 };
        const result = executor.applyScenario(draft, []);

        expect(result).not.toBe(draft);
        expect(result.moisture).toBe(50);
    });
});
