import { Injectable, Logger } from '@nestjs/common';
import { DeterministicForecastEngine } from './deterministic-forecast-engine';
import type { GeneratedDraft } from '../domain/draft-factory';
import type { InputDataSnapshot } from './input-data-snapshot';

/**
 * YieldForecastService — Оркестратор прогнозирования.
 * 
 * 1. Собирает данные (snapshot).
 * 2. Вызывает DeterministicForecastEngine.
 * 3. Возвращает результат.
 */
@Injectable()
export class YieldForecastService {
    private readonly logger = new Logger(YieldForecastService.name);

    constructor(
        private readonly engine: DeterministicForecastEngine,
    ) { }

    /**
     * Генерирует прогноз для черновика.
     */
    async predict(draft: GeneratedDraft): Promise<any> {
        this.logger.log(`Starting yield prediction for draft ${draft.generationMetadata.hash.substring(0, 8)}`);

        // 1. Сбор данных (mock for now, integration later)
        const snapshot: InputDataSnapshot = await this.captureSnapshot(draft);

        // 2. Детерминированный расчет
        const forecast = this.engine.calculateYield(draft, snapshot);

        return {
            ...forecast,
            snapshotHash: 'TODO-HASH-SNAPSHOT', // To be implemented for I20
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Создает снимок данных.
     * В реальной системе — запросы к WeatherService, SoilService.
     */
    private async captureSnapshot(draft: GeneratedDraft): Promise<InputDataSnapshot> {
        return {
            soilType: draft.soilType || 'Chernozem',
            moisture: draft.moisture || 50,
            nutrients: { n: 100, p: 50, k: 30 },
            historicalYield: 4.5, // t/ha
            weatherForecast: [
                { avgTemp: 20, precipitation: 50 }, // Month 1
                { avgTemp: 22, precipitation: 40 }, // Month 2
                { avgTemp: 25, precipitation: 30 }, // Month 3
            ],
        };
    }
}
