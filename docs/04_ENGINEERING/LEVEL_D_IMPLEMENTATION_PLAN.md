---
id: DOC-ENG-LD-001
type: Engineering
layer: Engineering
status: Accepted
version: 2.1.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL D — IMPLEMENTATION PLAN (D6+ Industrial)
## План реализации: Controlled Evolution System

---

## 1. Предпосылки (Prerequisites)

- **Level C:** Полностью завершён и верифицирован (Data Ingestion, Override System).
- **Core:** `ActiveTenantContext` и `EventBus` функционируют.
- **Resources:**
    - 3 Backend Engineers (Go/Python)
    - 1 DevOps / SRE (Infrastructure & DR)
    - 1 Data Scientist (StatSig Verification)

---

## 2. Фазы Реализации (Detailed Roadmap)

### Phase 1: Infrastructure & Foundation (3 недели)
*Цель: Подготовить почву для хранения артефактов и исполнения ML-задач.*

| Компонент | Задача | Технология / Детали |
|-----------|--------|---------------------|
| **Storage** | S3-compatible Artifact Store | MinIO / AWS S3. Bucket Isolation per Tenant. |
| **Compute** | K8s Job Orchestrator | Шаблоны для запуска ML-контейнеров (Resources, Timeouts). |
| **Queue** | Async Task Queue | BullMQ / Kafka. Настройка DLQ (Dead Letter Queue). |
| **DB** | Schema Migration | Таблицы: `model_versions`, `dataset_snapshots`, `drift_reports`. Indexing. |
| **Crypto** | Signature Service | Key Management Service (KMS) для подписи артефактов. |

**Критерий:** инфраструктура готова к нагрузке и изолирована.

---

### Phase 2: Domain Layer & State Machine (2 недели)
*Цель: Реализовать бизнес-логику и строгий жизненный цикл.*

| Компонент | Задача | Детали |
|-----------|--------|--------|
| **Registry** | `ModelRegistryService` | FSM Implementation (см. ниже). |
| **Events** | `LearningEvent` Ingestion | Idempotency Keys, Signature Verification. |
| **Snapshots** | `DatasetSnapshotService` | Immutability Triggers, Merkle Tree hashing. |
| **Locking** | Concurrency Guards | `Optimistic Locking` для FSM переходов. |

**Comprehensive FSM:**
`DRAFT` → `TRAINING` → `VALIDATED` → `SHADOW` → `CANARY` → `CHAMPION` → `DEPRECATED`
*Fail states:* `FAILED`, `QUARANTINED` (Manual Review).

**Критерий:** Unit-тесты покрывают все переходы FSM и запрещают нелегальные (например, `FAILED` -> `CHAMPION`).

---

### Phase 3: Observability & SLA (2 недели)
*Цель: Сделать систему прозрачной и контролируемой.*

| Компонент | Задача | Детали |
|-----------|--------|--------|
| **Metrics** | Model Metrics Exporter | Prometheus: `training_duration_seconds`, `model_accuracy`. |
| **Tracing** | Pipeline Tracing | OpenTelemetry spans (Training -> Validation -> Serving). |
| **SLA/SLO** | Monitoring | Dashboard "SLA Breach Risk" (см. раздел 6). |
| **Logs** | Centralized Logging | JSON-логи c `tenantId`, `traceId`, `modelHash`. |

**Критерий:** Grafana показывает latency дрифта и статус обучения в реальном времени.

---

### Phase 4: Drift Detection Engine (3 недели)
*Цель: Запуск регулярных проверок здоровья.*

| Компонент | Задача | Детали |
|-----------|--------|--------|
| **Worker** | `DriftMonitorWorker` | Расчет PSI, KL, MAE. Сравнение с Baseline. |
| **Reporting** | `DriftReportService` | Генерация JSON-отчетов, подпись, сохранение. |
| **Snapshot** | Window Management | Управление скользящими окнами (Non-overlapping). |
| **Alerting** | Escalation Policy | Интеграция с Notification Service (Email/Push). |

**Критерий:** Дрейф детектируется автоматически, отчеты иммутабельны.

---

### Phase 5: Retraining & Canary (4 недели)
*Цель: Безопасное обновление моделей.*

| Компонент | Задача | Детали |
|-----------|--------|--------|
| **Orchestrator** | `RetrainingOrchestrator` | Координация всего цикла (Detect -> Train -> Deploy). |
| **Training** | `ShadowTrainer` | Обучение на DatasetSnapshot с фиксированным Seed. |
| **Canary** | `CanaryGuard` | **StatSig Test:** p-value < 0.05, Min Sample Size > 1000. |
| **Rollback** | Auto-Rollback | Моментальный откат при деградации метрик в Canary. |
| **Cost** | `QuotaManager` | Проверка лимитов на GPU-часы перед запуском. |

**Критерий:** Модель не попадет в `CHAMPION`, если Canary не подтвердит улучшение статистически значимо.

---

### Phase 6: OFS Integration (2 недели)
*Цель: UI для управления.*

| Компонент | Задача | Детали |
|-----------|--------|--------|
| **Executive** | Business Dashboard | ROI, Capitalization Index. |
| **Control** | Governance UI | Кнопки Approve / Reject, History Log. |
| **XAI** | Explainability Panels | Визуализация SHAP и Drift. |

**Критерий:** Полная прозрачность процесса для пользователя.

---

## 3. Failure Handling & Disaster Recovery

### Disaster Recovery Strategy
| Scenario | Impact | RPO / RTO | Protocol |
|----------|--------|-----------|----------|
| **MinIO Loss** | Потеря артефактов | 15m / 1h | Restore from Geo-Replicated Cold Storage |
| **DB Corruption** | Потеря Registry | 5m / 30m | Point-in-Time Recovery (PITR) |
| **KMS Loss** | Невозможность подписи | 0m / 2h | HSM Backup Restoration |

### Resilience Patterns
1.  **Distributed Mutex:** Redis Lock `lock:tenant:{id}:retrain` (TTL 24h).
2.  **Idempotency:** `request_id` на всех пишущих методах.
3.  **Circuit Breaker:** Отключение Retraining при 3 ошибках подряд.

---

## 4. Cost Governance & Quotas

1.  **Compute Quota:**
    - Per-Tenant Limit: 100 GPU-hours / month.
    - Action: `BLOCK_RETRAINING` if exceeded.
2.  **Storage Quota:**
    - Model Retention Policy: Keep last 5 versions + Champions.
    - Garbage Collection: Auto-delete `DRAFT` / `FAILED` artifacts after 7 days.
3.  **Budget Cap:**
    - Hard limit $500 / month per Tenant for ML Ops.

---

## 5. Security Layer

1.  **Role-Based Access Control (RBAC):**
    - `ROLE_AGRONOMIST`: View Forecasts.
    - `ROLE_MANAGER`: Governance Approval.
    - `ROLE_ADMIN`: Force Rollback, Baseline Reset.
2.  **Audit Trail:**
    - Все переходы FSM пишутся в `audit_log` (Immutable).
3.  **Network Policies:**
    - Deny All Ingress to Training Nodes (кроме S3/DB).

---

## 6. Service Level Objectives (SLO)

| Metric | Threshold | Consequence |
|--------|-----------|-------------|
| **Drift Detection Latency** | < 4 hours | Alert Warning |
| **Retraining Duration** | < 24 hours | Job Cancellation + Alert |
| **Rollout Window** | < 1 hour | Auto-Rollback |
| **Inference Availability** | 99.9% | P1 Incident |

---

## 7. Timeline Estimation

```
Week 1-3:   Infrastructure (Storage, Compute, DR setup)
Week 4-5:   Domain Layer (FSM, Events, Locks)
Week 6-7:   Observability (Metrics, SLA Dashboards)
Week 8-10:  Drift Detection (Worker, Reports)
Week 11-14: Retraining & Canary (StatSig, Cost Guards)
Week 15-16: OFS Integration (UI/UX)
```

**Total:** 4 Months.
**Staffing:** 5 FTE (3 Dev, 1 Ops, 1 DS).
