---
id: DOC-ARH-CORE-LD-004
type: Architecture
layer: Core
status: Draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# DATASET SNAPSHOT ARCHITECTURE
## Архитектура иммутабельных снимков данных для обучения

---

## 0. Статус документа

**Уровень зрелости:** D4 (Deterministic & Atomic)  
**Binding:** HARD  
**Инварианты:** D1 (No Retroactive), D2 (Version Isolation), D4 (Deterministic Serialization)

---

## 1. Назначение

Dataset Snapshots — **иммутабельные срезы данных**, используемые для обучения и валидации моделей.

Обучение на live-данных **запрещено**. Только snapshot → training.

---

## 2. Ключевые принципы

| # | Принцип | Описание |
|---|---------|----------|
| 1 | **Immutability** | Snapshot неизменяем после создания |
| 2 | **Read-Only** | Данные доступны только для чтения |
| 3 | **Tenant Isolation** | Snapshot содержит данные только одного тенанта |
| 4 | **Hash Integrity** | SHA-256 хеш гарантирует целостность |
| 5 | **No Live Training** | Обучение на live-данных запрещено |

---

## 3. Сущность DatasetSnapshot

```typescript
interface DatasetSnapshot {
  id: string;                   // CUID
  tenantId: string;             // Изоляция по тенанту
  
  // Содержимое
  seasonIds: string[];          // Сезоны, включённые в snapshot
  recordCount: number;          // Количество записей
  featureColumns: string[];     // Список фич
  
  // Integrity
  contentHash: string;          // SHA-256 хеш данных
  schemaVersion: string;        // Версия схемы данных
  
  // Pipeline Lineage (D4)
  extractorVersion: string;     // Версия SQL-экстрактора
  featurePipelineVersion: string; // Версия трансформаций фич
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  purpose: SnapshotPurpose;
  description: string;
  
  // Lineage
  sourceQuery: string;          // SQL/Prisma query для воспроизведения
  filterCriteria: JsonValue;    // Критерии фильтрации
  
  // Status
  status: SnapshotStatus;
}

enum SnapshotPurpose {
  TRAINING = 'TRAINING',
  VALIDATION = 'VALIDATION',
  TESTING = 'TESTING',
  BENCHMARK = 'BENCHMARK',
}

enum SnapshotStatus {
  CREATING = 'CREATING',
  READY = 'READY',
  ARCHIVED = 'ARCHIVED',
  CORRUPTED = 'CORRUPTED',
}
```

---

## 4. Жизненный цикл

```
Запрос на создание
       ↓
  CREATING (сбор + хеширование)
       ↓
  Integrity check
       ↓
    READY (доступен для обучения)
       ↓
  После использования: остаётся READY
       ↓
  При устаревании: ARCHIVED (не удаляется)
       ↓
  При повреждении: CORRUPTED (блокировка)
```

### Правила перехода

| Из | В | Условие |
|----|---|---------|
| CREATING | READY | Hash computed, integrity verified |
| CREATING | CORRUPTED | Hash mismatch или ошибка сбора |
| READY | ARCHIVED | Ручная архивация (данные сохраняются) |
| READY | CORRUPTED | Integrity check failure при повторной верификации |
| ARCHIVED | — | Терминальный статус |
| CORRUPTED | — | Терминальный статус |

---

## 5. Процесс создания

```typescript
class DatasetSnapshotService {
  async createSnapshot(params: CreateSnapshotParams): Promise<DatasetSnapshot> {
    // 1. Создаём запись в статусе CREATING (Transaction A)
    const snapshot = await this.repo.create({ ...params, status: 'CREATING' });

    try {
      // 2. Сбор и обработка (Heavy Operation)
      const data = await this.collectData(params);
      this.assertTenantIsolation(data, params.tenantId);
      
      const serialized = this.serialize(data);
      const hash = this.computeHash(serialized);
      
      // 3. Storage Save (Idempotent)
      await this.storage.save(snapshot.id, serialized);
      
      // 4. Update Status (Transaction B)
      return this.repo.updateStatus(snapshot.id, 'READY', { contentHash: hash });
    } catch (error) {
      await this.repo.updateStatus(snapshot.id, 'CORRUPTED');
      throw error;
    }
  }

  // Atomicity Guarantee via Background Job
  async cleanupOrphanedSnapshots(): Promise<void> {
    // Находим SNAPSHOTS, застрявшие в CREATING > 1 часа
    const orphans = await this.repo.findStuckCreating(hours(1));
    
    for (const orphan of orphans) {
      // Проверяем S3
      if (await this.storage.exists(orphan.id)) {
        // Recovery: если файл есть, восстанавливаем статус
        await this.repo.updateStatus(orphan.id, 'READY');
      } else {
        // Cleanup: если файла нет, помечаем CORRUPTED
        await this.repo.updateStatus(orphan.id, 'CORRUPTED');
      }
    }
  }
}
```

---

## 6. Hash Integrity & Deterministic Serialization (D4)

### 6.1. Принцип
**Invariant:** `serialize(data)` обязан возвращать идентичный байтовый массив для идентичного набора записей, независимо от версии рантайма или порядка строк в БД.

### 6.2. Алгоритм сериализации
```typescript
private serialize(data: DataRecord[]): Buffer {
  // 1. Сортировка по Primary Key (Canonical Sort)
  const sorted = data.sort((a, b) => a.id.localeCompare(b.id));
  
  // 2. Stable JSON Stringify (RFC 8785)
  // Гарантирует фиксированный порядок ключей в JSON
  const canonicalJson = require('fast-json-stable-stringify')(sorted);
  
  return Buffer.from(canonicalJson, 'utf-8');
}
```

### 6.3. Вычисление хеша
```typescript
function computeSnapshotHash(data: Buffer): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}
```

### 6.2. Верификация перед обучением
```typescript
class TrainingGuard {
  async verifySnapshot(snapshotId: string): Promise<void> {
    const snapshot = await this.snapshotRepo.find(snapshotId);
    const storedData = await this.storage.load(snapshotId);
    const computedHash = computeSnapshotHash(storedData);

    if (computedHash !== snapshot.contentHash) {
      await this.snapshotRepo.updateStatus(snapshotId, 'CORRUPTED');
      throw new IntegrityError('Dataset snapshot hash mismatch — обучение заблокировано');
    }
  }
}
```

---

## 7. Запрет Live Training

### Правило
```
Training Pipeline ОБЯЗАН получать данные ТОЛЬКО через DatasetSnapshot.
Прямой доступ к live-таблицам (HarvestResult, Season, Field) для обучения ЗАПРЕЩЁН.
```

### Enforcement
```typescript
class FeedbackLoopEngine {
  async prepareLearningData(seasonIds: string[]): Promise<DatasetSnapshot> {
    // Создаём immutable snapshot — НИКОГДА не используем live query
    return this.snapshotService.createSnapshot({
      tenantId: this.tenantId,
      seasonIds,
      purpose: 'TRAINING',
    });
  }
}
```

### Почему?
1. **Детерминизм:** Live-данные могут измениться между запусками
2. **Воспроизводимость:** Snapshot привязан к model version (D2)
3. **Bias контроль:** Аудит данных невозможен без фиксации
4. **Изоляция:** Обучение не влияет на продуктовые запросы

---

## 8. Tenant Isolation & Storage Policy (D4)

### 8.1. Tenant Isolation
- Каждый snapshot содержит данные **строго одного** тенанта
- `tenantId` — обязательное поле при создании
- Cross-tenant snapshots **запрещены** (кроме global benchmark с approval)

### 8.2. Storage Policy Constraints
| Parameter | Value | Reason |
|-----------|-------|--------|
| **Retention** | 7 years | Compliance / Audit |
| **Max Size** | 50 GB | Performance guard |
| **Compression** | GZIP / ZSTD | Cost optimization |
| **Encryption** | SSE-KMS | Security at rest |
| **Immutability** | Object Lock | D1 enforcement |
| **Deduplication**| `UNIQUE(tenantId, contentHash)` | Storage opt & Idempotency |

### 8.3. Schema Freeze (D4-Industrial)
- `schemaVersion` ссылается на иммутабельную схему в Registry.
- Изменение схемы (новые фичи, типы данных) **ОБЯЗАНО** инкрементировать версию.
- Snapshot со старой схемой **НЕ МОЖЕТ** быть использован для обучения модели, ожидающей новую схему.

---

## 9. Traceability & Concurrency Guards

**Invariant:** `Snapshot ↔ Model` relation must be explicit.

### 9.1. Training Concurrency Guard
При длительном обучении Snapshot может быть архивирован.
**Rule:** Training Job обязан удерживать `SharedLock` на Snapshot или проверять статус дважды:
1. Перед стартом (`assert status == 'READY'`).
2. Перед публикацией модели (`assert status == 'READY'`).

1. **Forward:** `ModelVersion` ссылается на `datasetSnapshotId`.
2. **Reverse:** `DatasetSnapshot` не хранит ссылок на модели (One-to-Many), но `ModelRegistry` обязан гарантировать целостность ссылок.

### Запрет Orphaned Training
Обучение модели невозможно, если `datasetSnapshot` не находится в статусе `READY`.

---

## 10. Запрещённые операции

| Операция | Причина |
|----------|---------|
| `UPDATE dataset_snapshots SET contentHash = ...` | Immutability |
| `DELETE FROM dataset_snapshots` | Append-only lineage |
| `INSERT ... SELECT FROM harvest_results` (live) | No live training |
| Cross-tenant snapshot creation | Tenant isolation |
| Training без `snapshotId` | Traceability |

---

## 10. Связанные документы

- [LEVEL_D_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/LEVEL_D_INVARIANTS.md)
- [MODEL_VERSIONING_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/MODEL_VERSIONING_ARCHITECTURE.md)
- [MODEL_REGISTRY_SCHEMA.md](file:///f:/RAI_EP/docs/04_ENGINEERING/MODEL_REGISTRY_SCHEMA.md)
