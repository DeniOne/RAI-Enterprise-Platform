import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContextService } from "../cache/context.service.js";
import { MemoryManager } from "./memory-manager.service.js";
import { EpisodicRetrievalService } from "./episodic-retrieval.service";
import { DefaultMemoryAdapter } from "./default-memory-adapter.service";
import { ShadowAdvisoryService } from "./shadow-advisory.service";
import { AuditService } from "../audit/audit.service";
import { ShadowAdvisoryMetricsService } from "./shadow-advisory-metrics.service";

@Global()
@Module({
  imports: [ConfigModule],
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
