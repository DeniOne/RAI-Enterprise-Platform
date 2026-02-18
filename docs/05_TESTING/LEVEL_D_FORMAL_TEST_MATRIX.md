---
id: DOC-TST-LD-001
type: Testing
layer: Verification
status: Accepted
version: 2.1.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL D — FORMAL TEST MATRIX (D7 Final)
## Матрица формального тестирования Level D

---

## 1. Обзор тестирования

Тестирование Level D фокусируется на верификации инвариантов D1–D5, устойчивости к атакам (Adversarial) и математической корректности (StatSig).

---

## 2. Покрытие инвариантов

### D1: No Retroactive Mutation
| ID | Тест-кейс | Уровень | Метод |
|----|-----------|---------|-------|
| T-D1-01 | Попытка деления `UPDATE` на `learning_events` | L3 (DB) | SQL Exception check |
| T-D1-02 | Попытка `DELETE` из `learning_events` | L3 (DB) | SQL Exception check |
| T-D1-03 | Мутация прошлого `HarvestResult` через Learning Service | L4 (Unit) | Expect error |
| T-D1-04 | Изменение `LearningEvent` после финализации | L4 (Unit) | Object.isFrozen check |
| T-D1-05 | Concurrent Mutation Race (Транзакционная гонка) | L5 (Integr) | Parallel TX attempt check |
| T-D1-06 | Soft-Delete Bypass (Попытка чтения удаленного) | L3 (DB) | RLS Policy Check |

### D2: Version Isolation
| ID | Тест-кейс | Уровень | Метод |
|----|-----------|---------|-------|
| T-D2-01 | Прогноз без `modelVersionId` | L4 (Unit) | Validation error check |
| T-D2-02 | Воспроизведение прогноза при смене ACTIVE модели | L5 (Integr) | Prediction equality check |
| T-D2-03 | Корректность FK `modelVersionId` в базе | L3 (DB) | Schema constraint check |
| T-D2-04 | Replay Attack after Archival (Запрос к DEPRECATED) | L5 (Integr) | Prediction: Denied; Replay: Allowed |

### D3: Governance Threshold
| ID | Тест-кейс | Уровень | Метод |
|----|-----------|---------|-------|
| T-D3-01 | Retrain при $\Delta\text{Accuracy} < \theta_{gain}$ | L4 (Unit) | Decision REJECTED check |
| T-D3-02 | Retrain при $\text{DriftScore} < \theta_{drift}$ | L4 (Unit) | Decision REJECTED check |
| T-D3-03 | Попытка изменить пороги без роли ADMIN | L6 (E2E) | 403 Forbidden check |
| T-D3-04 | Retrain при Drift > θ_critical и Accuracy Gain < 0 | L4 (Unit) | APPROVED (Recovery path) |

### D4: Bias Amplification Guard
| ID | Тест-кейс | Уровень | Метод |
|----|-----------|---------|-------|
| T-D4-01 | Рост bias +0.05 (порог 0.01) | L4 (Unit) | MANDATORY_ROLLBACK check |
| T-D4-02 | Pipeline блокировка при Bias Failure | L5 (Integr) | Flow interruption check |
| T-D4-03 | Сохранение bias-отчёта в базе | L5 (Integr) | DB presence check |
| T-D4-04 | Смена validationSnapshotId при аудите | L4 (Unit) | INCONSISTENT_SNAPSHOT error |
| T-D4-05 | Cumulative Bias (>10 generations) | L5 (Integr) | Lineage Sum Check |
| T-D4-06 | Floating Point Drift (Числовая стабильность) | L4 (Unit) | Epsilon Precision check |
| **T-D4-07** | **Local Bias Step** (Скачок на одном шаге) | **L4 (Unit)** | **Delta Check <= epsilon_local** |

### D5: Explainable Evolution
| ID | Тест-кейс | Уровень | Метод |
|----|-----------|---------|-------|
| T-D5-01 | Promotion модели без Evolution Report | L4 (Unit) | Validation error check |
| T-D5-02 | Пустые поля в Evolution Report | L4 (Unit) | Schema validation check |
| T-D5-03 | Отображение эволюции в OFS UI | L6 (E2E) | Frontend rendering check |
| T-D5-04 | Evolution Report Immunability (Попытка правки) | L3 (DB) | Trigger Violation check |
| **T-D5-05** | **Orphan Report Integrity** (Удаление модели) | **L3 (DB)** | **Constraint Violation check** |

---

## 3. Матрица уровней (L3–L6)

| Уровень | Описание | Инструментарий |
|---------|----------|----------------|
| **L3: DB** | Триггеры, RLS, Constraints | PostgreSQL, Prisma |
| **L4: Unit** | Логика доменных сервисов | Vitest / Jest |
| **L5: Integration** | Взаимодействие сервисов, Race Conditions | NestJS TestingModule / K6 |
| **L6: E2E** | Полный сценарий (CLI/UI) | Playwright / Supertest |

---

## 4. Property-Based Testing (PBT) — D7 Polish

| Инвариант | Имущество (Property) |
|-----------|--------------------|
| **D1** | `∀ t1 < t2: Data(t1) is never changed by Process(t2)` |
| **D2** | `∀ Request r: (r.type=PREDICT ∧ m.status≠ACTIVE ⇒ Deny) ∧ (r.type=REPLAY ∧ m.exists ⇒ Allow)` |
| **D3** | `∀ Decision d: d.approved => ( (d.deltaAcc > θ_gain ∧ d.drift > θ_drift) ∨ (d.drift > θ_critical ∧ recovery_mode = true) )` |
| **D4** | `∀ Lineage L: (max_bias(L) <= root + ε) ∧ (∀ n: |bias(n) - bias(n-1)| <= ε_local)` |
| **D5** | `∀ ActiveModel m: ∃ EvolutionReport r (r.modelId = m.id ∧ r.isImmutable = true)` |

---

## 5. Adversarial Testing (Zero Trust)

1.  **Hash Tampering:** Ручное изменение артефакта модели в S3 → проверка обнаружения несоответствия хеша.
2.  **Threshold Bypassing:** Попытка вызвать `promoteToActive()` в обход контроллера.
3.  **Isolation Breach:** Попытка тенанта B прочитать DatasetSnapshot тенанта A (RLS Check).
4.  **Timestamp Forgery:** Подмена времени события обучения для обхода Drift-окна.
5.  **Cross-Tenant Injection:** Попытка вставить `modelVersionId` чужого тенанта в `LearningEvent`.
6.  **Direct DB Write:** Попытка записи в таблицу `model_versions` минуя Allocator (проверка Trigger).
7.  **Promotion Race:** Одновременная попытка промоушена двух разных кандидатов (Double Active Check).
8.  **Snapshot Rollback:** Попытка подсунуть старый снапшот данных как новый (Lineage/Hash check).

---

## 6. Связанные документы

- [LEVEL_D_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/LEVEL_D_INVARIANTS.md)
- [MODEL_REGISTRY_SCHEMA.md](file:///f:/RAI_EP/docs/04_ENGINEERING/MODEL_REGISTRY_SCHEMA.md)
