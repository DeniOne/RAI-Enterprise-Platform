import { Module, Global } from '@nestjs/common';
import { ExpertInvocationEngine } from './expert-invocation.engine';
import { ChiefAgronomistService } from './chief-agronomist.service';
import { SeasonalLoopService } from './seasonal-loop.service';
import { DataScientistService } from './data-scientist.service';
import { FeatureStoreService } from './feature-store.service';
import { ModelRegistryService } from './model-registry.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EngramService } from '../../../shared/memory/engram.service';
import { WorkingMemoryService } from '../../../shared/memory/working-memory.service';

/**
 * ExpertModule — NestJS module для expert-tier агентов.
 *
 * Содержит:
 *   Phase 3: Chief Agronomist (ExpertInvocationEngine, ChiefAgronomistService)
 *   Phase 4: Seasonal Loop (SeasonalLoopService)
 *   Phase 5: Data Scientist (DataScientistService, FeatureStoreService, ModelRegistryService)
 *
 * Все сервисы зарегистрированы как глобальные для доступа из любого модуля.
 */
@Global()
@Module({
    providers: [
        // Phase 3: Expert Invocation Engine
        ExpertInvocationEngine,

        // Phase 3: Chief Agronomist
        ChiefAgronomistService,

        // Phase 4: Seasonal Loop
        SeasonalLoopService,

        // Phase 5.1-5.3: Data Scientist
        DataScientistService,

        // Phase 5.4: ML Pipeline
        FeatureStoreService,
        ModelRegistryService,
    ],
    exports: [
        ExpertInvocationEngine,
        ChiefAgronomistService,
        SeasonalLoopService,
        DataScientistService,
        FeatureStoreService,
        ModelRegistryService,
    ],
})
export class ExpertModule { }
