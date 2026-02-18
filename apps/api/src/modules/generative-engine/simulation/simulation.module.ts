import { Module } from '@nestjs/common';
import { ScenarioExecutor } from './scenario-executor';
import { SimulationRunService } from './simulation-run.service';
import { IsolationGuard } from './isolation-guard';
import { YieldModule } from '../yield/yield.module';

@Module({
    imports: [YieldModule],
    providers: [
        ScenarioExecutor,
        SimulationRunService,
        IsolationGuard,
    ],
    exports: [
        SimulationRunService,
        IsolationGuard,
    ],
})
export class SimulationModule { }
