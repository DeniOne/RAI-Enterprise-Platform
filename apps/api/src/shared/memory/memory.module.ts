import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContextService } from "../cache/context.service";
import { MemoryManager } from "./memory-manager.service";
import { EpisodicRetrievalService } from "./episodic-retrieval.service";
import { DefaultMemoryAdapter } from "./default-memory-adapter.service";
import { ShadowAdvisoryService } from "./shadow-advisory.service";
import { AuditService } from "../audit/audit.service";
import { AuditModule } from "../audit/audit.module";
import { ShadowAdvisoryMetricsService } from "./shadow-advisory-metrics.service";

@Global()
@Module({
  imports: [ConfigModule, AuditModule],
  providers: [
    ContextService,
    MemoryManager,
    { provide: "MEMORY_MANAGER", useExisting: MemoryManager },
    { provide: "EPISODIC_RETRIEVAL", useExisting: EpisodicRetrievalService },
    { provide: "MEMORY_ADAPTER", useClass: DefaultMemoryAdapter },
    { provide: "AUDIT_SERVICE", useExisting: AuditService },
    EpisodicRetrievalService,
    DefaultMemoryAdapter,
    ShadowAdvisoryService,
    ShadowAdvisoryMetricsService,
  ],
  exports: [
    ContextService,
    MemoryManager,
    "MEMORY_ADAPTER",
    EpisodicRetrievalService,
    ShadowAdvisoryService,
    ShadowAdvisoryMetricsService,
  ],
})
export class MemoryModule { }
