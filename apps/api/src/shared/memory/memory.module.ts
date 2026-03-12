import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContextService } from '../cache/context.service';
import { MemoryManager } from './memory-manager.service';
import { EpisodicRetrievalService } from './episodic-retrieval.service';
import { DefaultMemoryAdapter } from './default-memory-adapter.service';
import { ShadowAdvisoryService } from './shadow-advisory.service';
import { AuditService } from '../audit/audit.service';
import { AuditModule } from '../audit/audit.module';
import { ShadowAdvisoryMetricsService } from './shadow-advisory-metrics.service';
import { EngramService } from './engram.service';
import { WorkingMemoryService } from './working-memory.service';
import { ConsolidationWorker } from './consolidation.worker';
import { EngramFormationWorker } from './engram-formation.worker';
import { MemoryFacade } from './memory-facade.service';
import { MemoryController } from './memory.controller';
import { MemoryMaintenanceService } from './memory-maintenance.service';
import { AuthModule } from '../auth/auth.module';
import { TenantContextModule } from '../tenant-context/tenant-context.module';
import { MemoryLifecycleObservabilityService } from './memory-lifecycle-observability.service';
import { MemoryAutoRemediationService } from './memory-auto-remediation.service';

@Global()
@Module({
  imports: [ConfigModule, AuditModule, AuthModule, TenantContextModule],
  controllers: [MemoryController],
  providers: [
    // Базовая инфраструктура
    ContextService,
    MemoryManager,
    { provide: 'MEMORY_MANAGER', useExisting: MemoryManager },
    { provide: 'EPISODIC_RETRIEVAL', useExisting: EpisodicRetrievalService },
    { provide: 'MEMORY_ADAPTER', useClass: DefaultMemoryAdapter },
    { provide: 'AUDIT_SERVICE', useExisting: AuditService },
    EpisodicRetrievalService,
    DefaultMemoryAdapter,
    ShadowAdvisoryService,
    ShadowAdvisoryMetricsService,

    // Когнитивная память: L1 (Reactive) + L4 (Engrams)
    EngramService,
    WorkingMemoryService,

    // Background Workers: Consolidation + Engram Formation
    ConsolidationWorker,
    EngramFormationWorker,
    MemoryLifecycleObservabilityService,
    MemoryMaintenanceService,
    MemoryAutoRemediationService,

    // Единая точка входа (Facade)
    MemoryFacade,
  ],
  exports: [
    // Базовые
    ContextService,
    MemoryManager,
    'MEMORY_ADAPTER',
    EpisodicRetrievalService,
    ShadowAdvisoryService,
    ShadowAdvisoryMetricsService,

    // Когнитивные сервисы
    EngramService,
    WorkingMemoryService,
    ConsolidationWorker,
    EngramFormationWorker,
    MemoryLifecycleObservabilityService,
    MemoryMaintenanceService,
    MemoryAutoRemediationService,

    // Facade — ОСНОВНОЙ ЭКСПОРТ для агентов
    MemoryFacade,
  ],
})
export class MemoryModule { }
