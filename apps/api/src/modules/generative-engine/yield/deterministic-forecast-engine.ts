import { Injectable, Logger } from '@nestjs/common';
import type { GeneratedDraft } from '../domain/draft-factory';
import type { InputDataSnapshot } from './input-data-snapshot';

/**
 * DeterministicForecastEngine — Чистая функция прогноза (B1).
 * 
 * Рассчитывает прогноз урожайности (Yield) на основе:
 * 1. Канонического черновика (draft)
 * 2. Снимка входных данных (snapshot)
 * 
 * НЕ делает внешних запросов.
 * Полностью детерминирован: f(draft, snapshot) -> yield.
 */
@Injectable()
export class DeterministicForecastEngine {
    private readonly logger = new Logger(DeterministicForecastEngine.name);

    /**
     * Рассчитывает прогноз.
     * @returns Объект с прогнозом (min, max, target, risk).
     */
    calculateYield(draft: GeneratedDraft, snapshot: InputDataSnapshot) {
        this.logger.debug(`Calculating yield for crop ${draft.crop}`);

        // 1. Базовая урожайность (из истории)
        let baseYield = snapshot.historicalYield;

        // 2. Влияние операций
        let operationFactor = 1.0;
        draft.stages.forEach(stage => {
            stage.operations.forEach(op => {
                // Упрощенная модель: каждая операция +1% к эффективности, если есть ресурсы
                operationFactor += 0.01;
            });
        });

        // 3. Влияние погоды (rainfall)
        const totalRain = snapshot.weatherForecast.reduce((sum, w) => sum + w.precipitation, 0);
        const rainFactor = totalRain > 300 ? 1.1 : 0.9; // Пример

        // 4. Итоговый расчет
        const targetYield = baseYield * operationFactor * rainFactor;

        // 5. Риск (дисперсия)
        const risk = 0.1; // 10%

        return {
            min: targetYield * (1 - risk),
            max: targetYield * (1 + risk),
            target: targetYield,
            unit: 't/ha',
            factors: {
                base: baseYield,
                ops: operationFactor,
                rain: rainFactor
            }
        };
    }
}
