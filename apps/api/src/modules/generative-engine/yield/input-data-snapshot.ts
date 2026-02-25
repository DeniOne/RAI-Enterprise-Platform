/**
 * InputDataSnapshot — Снимок входных данных для прогноза урожайности (I20).
 *
 * Гарантирует детерминизм forecasting'а:
 * Прогноз строится ТОЛЬКО на основе этого снимка.
 * Любые внешние данные (погода, цены) должны быть захвачены сюда.
 */
export interface InputDataSnapshot {
  soilType: string;
  moisture: number; // Начальная влажность
  nutrients: {
    n: number;
    p: number;
    k: number;
  };
  historicalYield: number; // Средняя урожайность по полю
  weatherForecast: {
    avgTemp: number;
    precipitation: number;
  }[]; // Упрощенный прогноз на сезон
  marketPrices?: {
    cropPrice: number;
    fertilizerPrice: number;
  };
}
