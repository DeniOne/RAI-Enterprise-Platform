---
id: DOC-ARC-ADR-LD-003
layer: Architecture
type: ADR
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# ADR-LD-003: No Retroactive Mutation (Запрет ретроактивных изменений)

## Контекст

Когда модель обучается на результатах прошлых сезонов, возникает соблазн «переоценить» прошлые решения в свете новых знаний. Это создаёт риск исторической ревизии, разрушения аудита и bias injection.

## Решение

Зафиксировать: **Learning-процесс НИКОГДА не мутирует прошлые данные.**

Защищённые сущности:
| Сущность | Тип защиты |
|---|---|
| `HarvestResult` | Immutable после CLOSED |
| `Decision` / `DecisionLog` | Append-only |
| `DivergenceRecord` | Append-only (Level C) |
| `LearningEvent` | Immutable после записи |
| `ModelVersion` (прошлые) | Read-only |
| `DriftReport` | Immutable |

---

### 1. Correction Strategy (Стратегия исправлений)

Ошибки в данных (опечатки, сбои датчиков) требуют исправления. Поскольку `UPDATE` запрещен, используется стратегия **Append-Only Correction**.

**Corrections MUST:**
*   Never modify the original record (Physical Immutability).
*   Create a new `CorrectionRecord`.
*   Reference `original_id`.
*   Store `correction_reason` (e.g., "SENSOR_CALIBRATION_ERROR").
*   Store `actor` (Who corrected).
*   Preserve the timestamp of the original (Effective Date vs. System Date).

```typescript
interface CorrectionRecord {
  id: string;
  originalRecordId: string;
  correctedFields: Json; // { actualYield: 5.5 }
  reason: string;
  actor: Actor;
  createdAt: Date; // Now
  effectiveAt: Date; // Original Timestamp
}
```

### 2. Tenant Boundary & Isolation

Мутация запрещена **ВНУТРИ** тенанта.
*   **Isolation:** Модель Тенанта А обучается только на иммутабельных снепшотах Тенанта А.
*   **No Cross-Talk:** Drift Learning у Тенанта Б не может инициировать изменение исторических записей Тенанта А.
*   **Scope:** Invariant `NO_MUTATION` действует строго в рамках `TenantID`.

### 3. Event Sourcing & Snapshot Strategy

Система реализует **Partial Event Sourcing**:
*   **Source of Truth:** Лог событий (`LearningEvent`, `DecisionLog`).
*   **Optimization:** Для обучения используются **Immutable Snapshots** (`DatasetSnapshot`), которые являются материализованными представлениями лога на момент времени $T$.
*   **Rebuild Policy:** Snapshot никогда не перестраивается (rebuild prohibited). Если лог "исправлен" (через Correction), создается *новый* Snapshot.

### 4. Formal Invariant Definition

Математическое определение инварианта для автоматической верификации.

$$
\forall r \in \text{ProtectedEntities}, \forall t > t_{finalization}: \\
UPDATE(r, t) \to \text{Error(INVARIANT_VIOLATION)} \\
DELETE(r, t) \to \text{Error(INVARIANT_VIOLATION)}
$$

Где $t_{finalization}$ — момент закрытия сезона или подписания отчета.

---

## Обоснование

1.  **Воспроизводимость:** Любой аудитор может восстановить состояние системы на любую дату.
2.  **Детерминизм:** Один и тот же запрос возвращает одни и те же данные.
3.  **Регуляторика:** Финансовые и агрономические отчёты не подлежат ретроактивной модификации.
4.  **Correction Trace:** Мы видим не только "правильное" значение, но и факт ошибки и исправления.

## Последствия

**Плюсы:**
*   Абсолютная целостность исторических данных.
*   Полная аудируемость исправлений.
*   Совместимость с финансовыми стандартами аудита.

**Минусы:**
*   Логика чтения (Read Path) должна учитывать `CorrectionRecords` (merge on read).
*   Рост объема данных (несущественно для текстовых/числовых данных).
