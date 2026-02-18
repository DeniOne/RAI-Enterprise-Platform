---
id: DOC-ARH-TPL-LD-001
type: Topology
layer: Architecture
status: Accepted
version: 2.1.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL D — SERVICE TOPOLOGY (D6+ Hardened)
## Топология сервисов и связей

---

## 1. Топология Графа (D6+)

Включает полный цикл (Closed Loop) обучения, DLQ и явные потоки событий.

```mermaid
graph TB
    subgraph "Level D Services (Evolution)"
        FLE[FeedbackLoopEngine]
        DMW[DriftMonitorWorker]
        MUC[ModelUpdateController]
        TP[TrainingPipeline]
        MRS[ModelRegistryService]
        DSS[DatasetSnapshotService]
        BAM[BiasAuditModule]
        ERB[EvolutionReportBuilder]
        CDS[CanaryDeploymentService]
        GC[GovernanceConfig]
    end

    subgraph "Level C Services (Safety)"
        CE[ContradictionEngine]
    end

    subgraph "Level B Services (Core AI)"
        GE[GenerativeEngine]
        PS[PredictionService]
    end

    subgraph "Level A Services (Foundation)"
        LK[LedgerKernel]
        FRS[FinancialReadService]
        SS[SeasonService]
        CS[CompanyService]
    end

    subgraph "Async Messaging"
        EB[EventBus / Kafka]
        DLQ[(Dead Letter Queue)]
    end

    subgraph "Storage"
        DB[(PostgreSQL)]
        S3[(Artifact Store)]
    end

    %% --- Async Event Flows (Producers) ---
    FLE -- "Publish: LearningEvent" --> EB
    DMW -- "Publish: DriftReport" --> EB
    MUC -- "Publish: RetrainingDecision" --> EB
    MRS -- "Publish: ModelVersionCreated" --> EB
    
    %% --- Async Event Flows (Consumers) ---
    EB -- "Consume: LearningEvent" --> DMW
    EB -- "Consume: DriftReport" --> MUC
    EB -- "Consume: RetrainingDecision" --> TP
    EB -- "Consume: ModelVersionCreated" --> ERB

    %% --- Training Pipeline Flow ---
    TP --> DSS
    TP --> MRS
    TP --> BAM
    
    %% --- Sync Dependencies ---
    FLE --> PS
    FLE --> SS
    FLE --> FRS
    
    DMW --> MRS
    DMW --> DSS
    
    MUC --> GC
    MUC --> BAM
    MUC --> CDS
    
    DSS --> SS
    DSS --> CS
    
    CDS --> MRS
    CDS --> PS
    
    MRS --> DB
    MRS --> S3
    
    %% --- Data Access ---
    BAM --> DB
    ERB --> DB
    FRS --> LK
```

---

## 2. Зависимости и Контракты

| Сервис | Зависит от (Sync/Async) | Предоставляет | Артефакт (Output) |
|--------|-------------------------|---------------|-------------------|
| **FeedbackLoopEngine** | PredictionService, FinancialRead, SeasonService | Learning Calculation | `LearningEvent` (Async) |
| **DriftMonitorWorker** | `LearningEvent` (Async), ModelRegistry | Statistics Check | `DriftReport` (Async) |
| **ModelUpdateController** | `DriftReport` (Async), GovernanceConfig | Orchestration | `RetrainingDecision` (Async) |
| **TrainingPipeline** | `RetrainingDecision` (Async), DatasetSnapshot | Training Execution | `ModelArtifact` (S3) |
| **ModelRegistryService** | PostgreSQL, S3 | Version Control | `ModelVersionCreated` (Async) |
| **DatasetSnapshotService** | SeasonService, CompanyService | Snapshotting | `DatasetSnapshot` |
| **EvolutionReportBuilder** | `ModelVersionCreated` (Async) | Explainability | `EvolutionReport` |

---

## 3. Межуровневые связи и Изоляция

### A. Level D ← Level A (Foundation)
1.  **Financial Decoupling:** `FeedbackLoopEngine` использует CQRS-pattern через `FinancialReadService`.
2.  **Tenant Isolation:** `DatasetSnapshotService` валидирует контекст через `CompanyService`.

### B. Async Resilience (D6+)
*   **DLQ Strategy:** Все консьюмеры (`DMW`, `MUC`, `TP`) настроены на сброс "ядовитых" сообщений в `Dead Letter Queue` после 3 retries.
*   **Event Integrity:** Все события подписаны (Signed Payloads).
*   **Idempotency:** `MessageID` используется как Idempotency Key во всех консьюмерах.

---

## 4. Схема Хранения

| Таблица | Владелец | Тип | Invariant Check |
|---------|----------|-----|-----------------|
| `model_versions` | ModelRegistry | Append-only | Hash Check |
| `dataset_snapshots` | DatasetSnapshotService | Immutable | Tenant & Season FK |
| `learning_events` | FeedbackLoopEngine | Immutable | Signed Payload |
| `drift_reports` | DriftMonitorWorker | Immutable | Link to ModelVersion |
| `retraining_decisions`| ModelUpdateController | Immutable | Governance Sig |

---

## 5. Связанные документы
- [LEVEL_D_ARCHITECTURE.md](file:///f:/RAI_EP/docs/LEVEL_D_ARCHITECTURE.md)
- [RETRAINING_PIPELINE_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/RETRAINING_PIPELINE_ARCHITECTURE.md)
