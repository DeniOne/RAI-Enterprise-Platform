---
id: DOC-DOM-LD-001
type: Domain
layer: Domain
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# RAI DOMAIN — MODEL VERSION (D6 Hardened)
## Доменная модель версии ML-модели

---

## 1. Сущность

**ModelVersion** — иммутабельная, криптографически подписанная запись о конкретной версии ML-модели.
Каждая версия принадлежит конкретному Тенанту (или Global Foundation).

---

## 2. Атрибуты (D6 Schema)

| Поле | Тип | Constraint | Описание |
|------|-----|------------|----------|
| `id` | CUID | Primary Key | Уникальный идентификатор версии |
| `version` | Int | **Unique(Tenant)** | Монотонно возрастающий номер (1, 2, 3...) |
| `tenantId` | UUID | Index | Владелец модели (Partition Key) |
| `parentVersionId` | UUID? | FK | Ссылка на предыдущую версию (DAG Lineage) |
| `datasetSnapshotId` | UUID | FK | Данные, на которых обучена модель (Data Provenance) |
| `artifactHash` | SHA-256 | Unique | Хэш бинарного файла модели |
| `artifactUri` | URI | ReadOnly | Путь в S3 (Immutable CAS) |
| `artifactSignature` | HexString | Security | Цифровая подпись артефакта |
| `signatureAlgorithm` | Enum | - | `ED25519` / `RSA-4096` |
| `hyperparameters` | JSON | Frozen | Конфигурация обучения |
| `metrics` | JSON | Schema Validated | Результаты валидации (Contract) |
| `status` | Enum | State Machine | Текущее состояние жизненного цикла |
| `evolutionReportId` | UUID | FK (D5) | Ссылка на отчет об эволюции |
| `approvalDecisionId` | UUID? | FK | Ссылка на решение Governance (Audit) |
| `createdAt` | DateTime | Immutable | Время регистрации |

---

## 3. Metrics Contract (Strongly Typed)

Поле `metrics` обязано соответствовать схеме:

```typescript
interface ModelMetrics {
  schemaVersion: "1.0";
  performance: {
    MAE: number;
    RMSE: number;
    MAPE: number;
    R2: number;
  };
  bias: {
    demographicParity: number;
    equalOpportunity: number;
    maxGroupDivergence: number;
  };
  canary?: {
    trafficWeight: number;    // % трафика
    conversionRate: number;
    latencyP99: number;
  };
}
```

---

## 4. Жизненный Цикл и Статусы (Unified Enum)

**Enum:** `CANDIDATE` | `SHADOW` | `CANARY` | `ACTIVE` | `STABLE` | `BLACKLISTED` | `REJECTED` | `DEPRECATED`

### State Machine Transitions (Strict FSM)

| From | To | Actor | Condition |
|------|----|-------|-----------|
| `NULL` | `CANDIDATE` | **System** | Training Completed & Snapshot Verified |
| `CANDIDATE` | `SHADOW` | **System** | Validation Passed |
| `CANDIDATE` | `REJECTED` | **System** | Validation Failed OR Bias Audit Failed |
| `SHADOW` | `CANARY` | **Orchestrator** | Shadow Metrics > Baseline |
| `CANARY` | `ACTIVE` | **Orchestrator** | Canary Metrics > Threshold & Drift OK |
| `CANARY` | `REJECTED` | **Orchestrator** | Canary failed (Metrics/Error Rate) |
| `ACTIVE` | `STABLE` | **Orchestrator** | Survival Period > 1 Season (Safety Rule) |
| `ACTIVE` | `BLACKLISTED` | **System/Admin** | Critical Drift / Bias Detected (Emergency) |
| `ACTIVE` | `DEPRECATED` | **System** | New ACTIVE promoted |
| `STABLE` | `DEPRECATED` | **System** | New STABLE promoted |
| `*` | `BLACKLISTED` | **Security** | Forensic Lock |

---

## 5. Инварианты (D6)

1.  **Uniqueness:** `(tenantId, version)` must be unique. Попытка вставки дубликата вызывает `IntegrityError`.
2.  **Lineage:** `parentVersionId` не может указывать на `BLACKLISTED` или `REJECTED` версию.
3.  **Auditability:** Переход в `ACTIVE` невозможен без `approvalDecisionId` (автоматического или ручного).
4.  **Integrity:** `artifactHash` должен совпадать с вычисленным хэшем файла в S3.

---

## 6. Связанные сущности
- `DatasetSnapshot` — Данные (Source of Truth).
- `GovernanceDecision` — Запись об утверждении (Audit).
- `EvolutionReport` — Объяснение изменений.
