---
id: DOC-DOM-LD-002
type: Domain
layer: Domain
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# RAI DOMAIN — LEARNING EVENT (D6 Hardened)
## Доменная модель события обучения

---

## 1. Сущность

**LearningEvent** — криптографически защищенная, иммутабельная запись факта "Предсказание vs Реальность".
Является фундаментальной единицей (atom) для расчета метрик качества и обнаружения Drift.

---

## 2. Атрибуты (D6 Schema)

| Поле | Тип | Constraint | Описание |
|------|-----|------------|----------|
| `id` | CUID | Primary Key | Уникальный идентификатор события |
| `tenantId` | UUID | Index | Тенант-владелец (Isolation) |
| `seasonId` | UUID | FK | Сезон (Closed Period) |
| `fieldId` | UUID | FK | Поле |
| `modelVersionId` | UUID | FK | Версия модели, давшая прогноз |
| `predictionId` | UUID | FK | Ссылка на оригинальный прогноз (Traceability) |
| `predictedYield` | Float | Not Null | Прогноз ($y_{pred}$) |
| `actualYield` | Float | Not Null | Факт ($y_{true}$) |
| `absoluteError` | Float | $\ge 0$ | $|y_{true} - y_{pred}|$ (для MAE) |
| `squaredError` | Float | $\ge 0$ | $(y_{true} - y_{pred})^2$ (для RMSE) |
| `mape` | Float | $\ge 0$ | Относительная ошибка |
| `errorVector` | JSON | Schema | Декомпозиция ошибки по факторам |
| `overrideTraceId` | UUID? | FK | Ссылка на `DivergenceRecord` (если был override) |
| `driftFlags` | Enum[] | - | `DATA_DRIFT` \| `CONCEPT_DRIFT` \| `BIAS_DETECTED` |
| `payloadHash` | SHA-256 | Unique | Хэш значимых полей (Integrity) |
| `payloadSignature` | Hex | Security | Подпись (FeedbackLoopEngine Key) |
| `signatureAlgorithm` | Enum | - | `ED25519` |
| `createdAt` | DateTime | Index | Дата регистрации события |

---

## 3. Инварианты (D6)

1.  **Integrity:** `payloadHash` = `SHA256(tenantId + seasonId + fieldId + predicted + actual)`.
2.  **Signature:** Событие обязано быть подписано приватным ключом `FeedbackLoopEngine`.
3.  **Isolation:** `modelVersion.tenantId == LearningEvent.tenantId`. (Cross-tenant leakage prevention).
4.  **Immutability:** `UPDATE` и `DELETE` запрещены на уровне БД.
5.  **Uniqueness:** `UNIQUE(seasonId, fieldId, modelVersionId)` — дублирование событий обучения запрещено.

---

## 4. Использование

- **DriftMonitor:** Агрегирует `squaredError` и `absoluteError` за окно $W$ для расчета метрик.
- **Retraining:** События с `driftFlags != EMPTY` имеют повышенный вес при выборке.
- **Audit:** `payloadSignature` гарантирует, что данные для переобучения не были подделаны злоумышленником.

---

## 5. Связанные сущности
- `Prediction` — Исходный контекст.
- `ModelVersion` — Тестируемая гипотеза.
- `DivergenceRecord` — След вмешательства человека (Level C).
