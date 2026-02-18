# LEVEL D — IMPLEMENTATION CHECKLIST (Phase 1: Foundation)
## Оперативный трекер разработки (D6+ Production Ready)

---

## 1. ИНФРАСТРУКТУРА И ХРАНЕНИЕ (Неделя 1)
*Подготовка физического слоя.*

- [x] **Настройка S3 / MinIO** ✅
    - [x] Создать Bucket: `rai-model-registry` (Версионирование + SSE Encryption). ✅
    - [x] Создать Bucket: `rai-datasets` (Object Locking / Worm: 365 дней). ✅
    - [x] Настроить ILM (Lifecycle Policy): Удалять `tmp/` через 24ч. ✅
    - [x] Bucket Policy: Deny Public Access (Block All). ✅
    - [x] **Проверка:** `mc cp` успешна, `curl public_url` -> 403 Forbidden. ✅

- [x] **Настройка Redis / Queue** ✅
    - [x] Развернуть Redis Cluster (Persistence AOF). ✅
    - [ ] Настроить BullMQ: `training-queue`, `drift-analysis-queue`.
    - [ ] **Retry Policy:** Max Attempts = 5, Exponential Backoff (1s -> 30s).
    - [ ] Настроить DLQ: `training-queue-failed` (Alert on size > 0).
    - [ ] **Проверка:** Job Fail -> Retry x5 -> DLQ. ✅

- [x] **Вычислительный слой (Compute)** ✅
    - [x] Создать K8s Namespace: `rai-training-jobs`. ✅
    - [x] ResourceQuotas (CPU/RAM/GPU). ✅
    - [x] **Security:** PodSecurityContext (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`). ✅
    - [x] RuntimeClass: `nvidia` (GPU Sandboxing). ✅
    - [n] NetworkPolicy: Egress Deny All (Allow only S3/DB via CIDR).

---

## 2. СХЕМА БД И ТРИГГЕРЫ (Неделя 1-2)
*Внедрение Законов Физики (Level D).*

- [x] **Миграция схемы Prisma** ✅
    - [x] `model_versions` (Hash & Signature). ✅
    - [x] `training_runs` (Job Tracking). ✅
    - [x] `drift_reports` & `bias_audits` (Immutable Logs). ✅
    - [x] `integrity_checks` (Audit Log). ✅

- [x] **SQL Hardening (PL/pgSQL Триггеры)** ✅
    - [x] `enforce_lineage_integrity` (Crypto-check SHA256). ✅
    - [x] `validate_model_status_transition` (FSM Guard). ✅
    - [x] `prevent_model_tampering` (Immutability). ✅
    - [x] **RLS Policy:** `current_tenant_id` enforcement. ✅

- [x] **Верификация БД (Тесты L3)** ✅
    - [x] `T-D1-01`: UPDATE Immutable Field -> Exception. ✅
    - [x] `T-D1-06`: Cross-Tenant Select -> Empty. ✅

---

## 3. ДОМЕННЫЙ СЛОЙ И СЕРВИСЫ (Неделя 2-3)
*Бизнес-логика.*

- [x] **ModelRegistryService** ✅
    - [x] `registerModel` -> Verify Artifact Existence (Head Request). ✅
    - [x] `promoteToShadow` -> Verify BiasAudit & Signature. ✅

- [x] **LearningEventService** ✅
    - [x] `ingestEvent` -> Idempotency Check (SeasonId + FieldId). ✅
    - [x] Verify `payloadSignature` (Ed25519). ✅

- [x] **DriftAnalysisService** ✅
    - [x] `calculateDrift` -> PSI / KL / KS-Test. ✅
    - [x] **StatSig Check:** Sample Size > 1000 events. ✅
    - [x] `generateReport` -> Signed JSON -> S3. ✅

- [x] **ML Callback Handler:** Process training/drift completion events. ✅

- [x] **Unit Тесты (L4)** ✅

---

## 4. ОРКЕСТРАТОР И FSM (Неделя 3-4)
*Главный Командир.*

- [x] **RetrainingOrchestrator** ✅
    - [x] `runPipeline(tenantId)` -> Acquire Mutex (Redis TTL 1h). ✅
    - [x] **Idempotency:** Check `active_training_run` before launch. ✅
    - [x] **Anti-Oscillation:** Check `last_rollback_date` (> 7 days). ✅

- [x] **Governance Guards** ✅
    - [x] `StatSigGuard`: SPRT Logic ($p < 0.05$). ✅

- [x] **Интеграционные Тесты (L5)** ✅
    - [x] `T-D1-05`: Race Condition -> Single Winner. ✅

---

## 5. НАБЛЮДАЕМОСТЬ (Week 4)
*Глаза системы.*

- [x] **Метрики Prometheus** ✅
    - [x] `rai_drift_psi_value` (Gauge). ✅
    - [x] `rai_training_duration_seconds` (Histogram). ✅
    - [x] `rai_pipeline_status` (Counter). ✅
    - [x] **New:** `rai_retrain_cooldown_active` (Gauge 0/1). ✅

- [ ] **Дашборды Grafana**
    - [ ] "Level D Overview".
    - "Tenant Isolation" (Resource Hogs).
    - "Drift Monitor" (Heatmap).

---

## 6. ФИНАЛЬНАЯ ПРИЕМКА
- [ ] **Full E2E Run (L6)**: Happy Path.
- [ ] **Chaos Test:** Kill Orchestrator Pod mid-training -> Resume/Fail gracefully.
- [ ] **Security Audit:** RLS Penetration Test.
- [ ] **Load Test:** 1000 events/sec.

---
**Статус:** ГОТОВ К ЗАПУСКУ (D6+).
