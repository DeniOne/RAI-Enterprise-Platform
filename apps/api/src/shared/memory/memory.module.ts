import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContextService } from "../cache/context.service.js";
import { MemoryManager } from "./memory-manager.service.js";
import { EpisodicRetrievalService } from "./episodic-retrieval.service";
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
    { provide: "AUDIT_SERVICE", useExisting: AuditService },
    EpisodicRetrievalService,
    ShadowAdvisoryService,
    ShadowAdvisoryMetricsService,
  ],
  exports: [
    ContextService,
    MemoryManager,
    EpisodicRetrievalService,
    ShadowAdvisoryService,
    ShadowAdvisoryMetricsService,
  ],
})
export class MemoryModule {}
