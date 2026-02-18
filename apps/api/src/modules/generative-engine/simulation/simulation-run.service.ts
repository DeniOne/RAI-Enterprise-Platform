import { Injectable, Logger } from '@nestjs/common';
import { ScenarioExecutor } from './scenario-executor';
import { IsolationGuard } from './isolation-guard';
import { YieldForecastService } from '../yield/yield-forecast.service';
import type { GeneratedDraft } from '../domain/draft-factory';

@Injectable()
export class SimulationRunService {
    private readonly logger = new Logger(SimulationRunService.name);

    constructor(
        private readonly scenarioExecutor: ScenarioExecutor,
        private readonly isolationGuard: IsolationGuard,
        private readonly yieldService: YieldForecastService,
    ) { }

    /**
     * Запускает симуляцию "Что-если".
     * @param baseDraft - базовый черновик
     * @param scenarios - список сценариев
     */
    async runSimulation(baseDraft: GeneratedDraft, scenarios: any[]) {
        this.isolationGuard.assertIsolation('SIMULATION');

        const results = [];

        for (const scenario of scenarios) {
            // 1. Применяем изменения (in-memory, isolated)
            const simulatedDraft = this.scenarioExecutor.applyScenario(baseDraft, scenario.modifications);

            // 2. Рассчитываем прогноз (Pure function)
            const forecast = await this.yieldService.predict(simulatedDraft);

            results.push({
                scenarioId: scenario.id,
                forecast,
                diff: {
                    yield: forecast.target, // Сравнение с базовым можно добавить
                }
            });
        }

        return {
            baseDraftHash: baseDraft.generationMetadata.hash,
            scenariosRun: results.length,
            results,
        };
    }
}
