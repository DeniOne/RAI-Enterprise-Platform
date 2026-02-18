import { Module } from '@nestjs/common';
import { DeterministicForecastEngine } from './deterministic-forecast-engine';
import { YieldForecastService } from './yield-forecast.service';

@Module({
    providers: [
        DeterministicForecastEngine,
        YieldForecastService,
    ],
    exports: [
        YieldForecastService,
    ],
})
export class YieldModule { }
