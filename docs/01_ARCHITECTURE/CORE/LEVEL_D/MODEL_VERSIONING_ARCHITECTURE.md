---
id: DOC-ARH-CORE-LD-003
type: Architecture
layer: Core
status: Draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# MODEL VERSIONING ARCHITECTURE
## Архитектура версионирования и линейности моделей

---

## 0. Статус документа

**Уровень зрелости:** D4.5 (Cryptographically Enforced Lineage Integrity)  
**Binding:** HARD  
**Инварианты:** D1 (No Retroactive), D2 (Version Isolation + Deep Hash), D5 (Explainable Evolution)

---

## 1. Назначение

Model Lineage Registry — **иммутабельный реестр** всех версий ML-моделей системы. Каждая версия хранит полный набор метаданных, необходимый для:
- Воспроизведения любого прогноза
- Аудита эволюции модели
- Детерминированного rollback

---

## 2. Ключевые принципы

1. **Strict Monotonicity:** Версии имеют глобально уникальный sequence `(tenantId, version)` с защитой от race conditions.
2. **Deep Hash Validation:** Хешируется не только артефакт, но и конфигурация, датасет и фреймворк.
3. **Linear Lineage:** Строгая цепочка версий. Branching допускается только для экспериментов, merge запрещён без полной перевалидации.
4. **DB-Level Immutability:** `UPDATE` запрещён на уровне триггеров БД.
5. **Signed Lineage:** Каждая версия подписывается хешем родителя для защиты от подмены истории.

---

## 3. Сущность ModelVersion

```typescript
interface ModelVersion {
  id: string;                    // CUID
  version: number;               // Monotonic (1, 2, 3...)
  tenantId: string | null;       // null = global model

  // Deep Hash Integrity (D2/D4/D4.5)
  configurationHash: string;     // SHA-256(artifact + dataset + params + framework + runtime + image)
  artifactHash: string;          // SHA-256 binary artifact
  artifactUri: string;           // Immutable S3 URI (WORM policy)
  
  // Lineage Protection & Branching (D4.5)
  branchType: 'MAIN' | 'EXPERIMENT'; // Linear chain vs Sandbox
  parentVersionId: string | null;
  lineageSignature: string;      // SHA-256(parent.lineageSignature + this.configurationHash)
  
  // Reproducibility Context
  frameworkVersion: string;
  inferenceRuntimeVersion: string; // e.g. "onnxruntime:1.14.0"
  containerImageHash: string;    // SHA-256 docker image
  
  // Training metadata
  datasetSnapshotId: string;     
  hyperparameters: JsonValue;    
  trainingDurationMs: number;    
  
  // Performance
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    r2: number;
  };
  
  // Governance
  creationReason: ModelCreationReason;
  evolutionReportId: string | null; // Required for VALIDATED->CANARY
  biasAuditId: string | null;       // Required for CANDIDATE->SHADOW (Critical)
  
  status: ModelStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  
  // Audit
  createdAt: Date;
  createdBy: string;
}

enum ModelStatus {
  CANDIDATE = 'CANDIDATE',
  SHADOW = 'SHADOW',
  VALIDATED = 'VALIDATED',
  CANARY = 'CANARY',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ROLLED_BACK = 'ROLLED_BACK',
}

enum ModelCreationReason {
  INITIAL = 'INITIAL',
  RETRAIN = 'RETRAIN',
  ROLLBACK = 'ROLLBACK',
  HOTFIX = 'HOTFIX',
  EXPERIMENT = 'EXPERIMENT',
}
```

---

## 4. Правила версионирования

### 4.1. Создание версии

| Событие | Результат |
|---------|-----------|
| Первая модель | v1, `parentVersionId = null`, `reason = INITIAL` |
| Retraining | v(n+1), `parentVersionId = v(n)`, `reason = RETRAIN` |
| Rollback | v(n+1), `parentVersionId = v(n)`, `reason = ROLLBACK`, конфигурация от v(n-k) |
| Hotfix | v(n+1), `parentVersionId = v(n)`, `reason = HOTFIX` |

### 4.2. Rollback ≠ Перезапись

```
v1 [ACTIVE] → v2 [ACTIVE] → v3 [ACTIVE] → BIAS DETECTED
                                  ↓
                              v4 [ACTIVE]  (rollback to v2 config)
                              parentId = v3
                              reason = ROLLBACK
                              config = v2.config  (копия, не ссылка)
```

**Rollback создаёт новую версию с конфигурацией от любой предыдущей версии.**
Это сохраняет полный аудит trail и не нарушает D1 (no retroactive mutation).

### 4.3. Deprecation

При появлении новой ACTIVE-версии предыдущая переходит в `DEPRECATED`.
DEPRECATED-версия не удаляется и остаётся доступной для:
- Воспроизведения исторических прогнозов
- Аудита lineage
- Сравнительного анализа

---

## 5. Hash Validation Pipeline

### 5.1. При создании
```
Model Artifact → SHA-256 → artifactHash
                         → Сохранение в model_versions
```

### 5.2. При загрузке для прогноза
```
Load Artifact → SHA-256 → Compare with stored artifactHash
                        → MATCH: proceed
                        → MISMATCH: CRITICAL ERROR → halt
```

### 5.3. Воспроизводимость хеша
```typescript
function computeModelHash(artifact: Buffer): string {
  return crypto
    .createHash('sha256')
    .update(artifact)
    .digest('hex');
}
```

---

## 6. Version Isolation Protocol

### 6.1. При генерации прогноза
```typescript
class PredictionService {
  async predict(fieldId: string, seasonId: string): Promise<Prediction> {
    const activeModel = await this.registry.getActive(tenantId);
    
    const prediction = await activeModel.predict(input);
    
    return {
      ...prediction,
      // D2/D4.5: Полная фиксация контекста
      modelVersionId: activeModel.id, 
      modelConfigHash: activeModel.configurationHash, // <--- CHANGED from artifactHash
      modelLineageSignature: activeModel.lineageSignature // <--- Added for Chain Verification
    };
  }
}
```

### 6.2. При просмотре исторического прогноза
```typescript
class PredictionHistoryService {
  async reproduce(predictionId: string): Promise<ReproducedPrediction> {
    const prediction = await this.predictionRepo.find(predictionId);
    
    // D2: Используем ТУ ЖЕ версию
    const originalModel = await this.registry.getByVersion(
      prediction.modelVersionId
    );
    
    // D4.5: Верификация Deep Hash (Runtime + Container + Artifact + Data)
    if (originalModel.configurationHash !== prediction.modelConfigHash) {
      throw new IntegrityError('D4.5: Model configuration mismatch (Runtime/Data/Params changed)');
    }
    
    return originalModel.predict(prediction.input);
  }
}
```

---

## 7. Tenant Model Strategy

| Стратегия | Описание |
|-----------|----------|
| **Global** | Одна модель на все тенанты. Обучение на агрегированных данных. |
| **Tenant-Specific** | Модель обучена на данных конкретного тенанта. |
| **Transfer Learning** | Global base + tenant fine-tuning. |

Выбор стратегии определяется `GovernanceConfig.modelStrategy` per tenant.

---

## 8. Artifact Immutability Contract (WORM)

Артефакты моделей (`.onnx`, `.pt`, `.json`) хранятся в S3-совместимом хранилище с политикой **Write-Once-Read-Many**:

1. **Bucket Policy:** `s3:PutObject` разрешен только с `x-amz-object-lock-mode: COMPLIANCE`.
2. **Retention:** Минимальный срок хранения — 7 лет (Audit requirement).
3. **Versioning:** S3 Versioning включен (защита от случайного удаления).
4. **Access:** Сервисы имеют только `s3:GetObject`. `PutObject` только у Training Worker.

---

## 9. Запрещённые операции

| Операция | Причина запрета |
|----------|----------------|
| `UPDATE model_versions SET ...` | D1: Immutable lineage |
| `DELETE FROM model_versions` | D1: Append-only |
| Прогноз без `modelVersionId` | D2: Version isolation |
| Promotion без `biasAuditId` | D4: Bias guard |
| Promotion без `evolutionReportId` | D5: Explainable evolution |

---

## 10. Formal DB Enforcement (D4.5)

### 10.1. Strict Monotonicity (Allocator)
**Problem:** Race conditions при `SELECT MAX(version)+1`.
**Solution:** `model_version_counters` table with Row-Level Locking (`FOR UPDATE`).

```sql
-- See MODEL_REGISTRY_SCHEMA.md for implementation of:
-- allocate_next_model_version(tid)
```

### 10.2. Strict Linearity & Branching Semantics
**Principle:** Основная история (`MAIN`) линейна. Ветвление (`EXPERIMENT`) изолировано.

| Branch Type | Parent Constraint | Fork Allowed? | Merge Policy |
|-------------|-------------------|---------------|--------------|
| **MAIN** | `UNIQUE(parentVersionId)` | ❌ NO | N/A (Linear) |
| **EXPERIMENT** | None | ✅ YES | Forbidden (Must Retrain/Promote) |

**Enforcement:**
```sql
-- 1. Main Branch Linearity (No Forking)
CREATE UNIQUE INDEX idx_model_main_linearity
ON model_versions(parent_version_id)
WHERE branch_type = 'MAIN';
```

### 10.3. Immutable Triggers
**Problem:** `UPDATE` или `DELETE` нарушают D1.
**Solution:** Block modifications via `prevent_model_mutation` functionality in Schema.

---

## 11. Global Integrity Verification (Verification Procedure)

`verifyTenantLineage(tenantId)` — процедура полной проверки целостности.

1. **Check Monotonicity:**
   - Сортировка по `version`.
   - Проверка `v[i].version == v[i-1].version + 1`.

2. **Check Deep Artifact Integrity:**
   - `blob = S3.getObject(artifactUri)`
   - `computedArtifactHash = SHA256(blob)`
   - `assert(computedArtifactHash == storedArtifactHash)`

3. **Check Hash Integrity (DB Re-compute):**
   - Re-compute `configurationHash` using `computedArtifactHash` + DB params.
   - Re-compute `lineageSignature` from Genesis to Tip.
   - `assert(computedSignature == storedSignature)`.

Если любая проверка проваливается → **System Halt / Security Alert**.

---

## 12. Связанные документы

- [LEVEL_D_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/LEVEL_D_INVARIANTS.md)
- [DATASET_SNAPSHOT_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/DATASET_SNAPSHOT_ARCHITECTURE.md)
- [MODEL_UPDATE_STATE_MACHINE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/HLD/MODEL_UPDATE_STATE_MACHINE.md)
- [MODEL_REGISTRY_SCHEMA.md](file:///f:/RAI_EP/docs/04_ENGINEERING/MODEL_REGISTRY_SCHEMA.md)
