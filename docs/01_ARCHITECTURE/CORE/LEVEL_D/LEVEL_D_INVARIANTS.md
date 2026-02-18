---
id: DOC-ARH-CORE-LD-002
type: Architecture
layer: Core
status: Draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL D — INVARIANTS SPECIFICATION
## Формальная спецификация инвариантов D1–D5

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Binding:** HARD (блокирующий на уровне Code Review)  
**Enforcement:** Code + Tests + Runtime Guards + DB Constraints  
**Расширяет:** Level C Invariants (I29–I33)

---

## 1. Назначение

Данный документ определяет **формальные инварианты Level D**, которые:
1. Расширяют Level C (I29–I33)
2. Не удаляют предыдущие инварианты (A, B, C)
3. Добавляют механизмы контролируемого самообучения

> **Ключевой принцип Level D:**  
> Система имеет право адаптироваться, но **НЕ имеет права** менять прошлое и governance.

---

## 2. Инварианты Level D

### D1: No Retroactive Mutation (Запрет ретроактивных изменений)

#### Формальное определение
$$
\forall d \in \text{Decision}(t < t_{now}): \text{Learning}(t_{now}) \cap \text{Mutation}(d) = \emptyset
$$

$$
\forall e \in \text{ImmutableEntities}: state(e, t_{current}) = state(e, t_{closed})
$$

#### ImmutableEntities
Список сущностей, состояние которых во времени не подлежит мутации:
- `HarvestResult(status = CLOSED)` — результат урожая.
- `DecisionLog` — журнал принятых решений.
- `DivergenceRecord` — записи расхождений (Level C).
- `LearningEvent` — события обучения Level D.
- `ModelVersion(v < active)` — исторические версии моделей.

#### Естественный язык
Процесс обучения **никогда** не изменяет прошлые решения, прогнозы, факты или аудит-записи. Learning-сигнал влияет **только** на будущие версии модели.

#### Защищённые сущности
| Сущность | Тип защиты |
|----------|------------|
| `HarvestResult` | Immutable после `CLOSED` |
| `Decision` / `DecisionLog` | Append-only |
| `DivergenceRecord` | Append-only (Level C I31) |
| `LearningEvent` | Immutable после записи |
| `ModelVersion` (предыдущие) | Append-only lineage |

#### Реализация
```typescript
// Guard на LearningPipeline
class FeedbackLoopEngine {
  async processSeasonResult(seasonId: string): Promise<LearningEvent> {
    const season = await this.seasonRepo.findClosed(seasonId);
    
    // D1: Только READ прошлых данных. WRITE запрещён.
    if (season.status !== 'CLOSED') {
      throw new InvariantViolationError(
        'D1: Обучение возможно только на закрытых сезонах'
      );
    }

    // Формируем learning signal — НЕ мутируем источник
    const learningEvent = this.buildLearningEvent(season);

    // Append-only: создаём новую запись
    return this.learningEventRepo.create(learningEvent);
  }
}
```

#### Enforcement
- **DB-level:** `BEFORE UPDATE` триггер на `learning_events` — блокировка любых изменений
- **DB-level:** `BEFORE DELETE` триггер — блокировка удаления
- **Runtime:** Guard в `FeedbackLoopEngine` проверяет статус сезона

#### Тестируемость
- **L3:** Триггер блокирует `UPDATE` на `learning_events`
- **L4:** Unit test: попытка мутации прошлого `HarvestResult` → ошибка
- **PBT:** `∀ learningEvent: learningEvent.createdAt > season.closedAt`
- **Adversarial:** Попытка `$executeRaw('UPDATE learning_events ...')` → блокировка

---

### D2: Version Isolation (Изоляция версий модели)

#### Формальное определение
$$
\forall f \in \text{Field}, t \in \text{TechMap}: \exists! v \in \text{ModelVersion}: \text{prediction}(f, t) = \text{model}(v).\text{predict}(f, t)
$$

$$
\text{prediction}_{reproducible} \iff (model_{hash}, preprocessing_{hash}, dataset_{snapshot\_id}, feature_{schema\_version}) \text{ fixed}
$$

#### Естественный язык
Каждое поле и техническая карта **привязаны к конкретной версии модели**. Прогноз воспроизводим только с той версией, которая его создала.

#### Правила изоляции
1. При генерации прогноза фиксируется `modelVersionId`
2. При просмотре исторического прогноза используется **та же версия** модели
3. Новая версия модели **не переписывает** старые прогнозы
4. Rollback модели создаёт **новую версию** (не откат к старой)

#### Реализация
```typescript
interface PredictionRecord {
  id: string;
  fieldId: string;
  techMapId: string;
  modelVersionId: string;    // D2: привязка к конкретной версии
  predictedYield: number;
  predictedAt: Date;
  // Snapshot метаданных модели на момент прогноза
  modelHash: string;
  modelConfig: JsonValue;
}
```

#### Enforcement
- **DB-level:** `model_version_id` NOT NULL, FK на `model_versions`
- **Runtime:** Генератор прогнозов обязан передать `activeModelVersionId`
- **Query Guard:** Исторические запросы используют `modelVersionId` прогноза, а не текущую активную версию

#### Тестируемость
- **L3:** FK constraint на `model_version_id`
- **L4:** Unit test: прогноз без `modelVersionId` → ошибка
- **L5:** Integration: два прогноза на разных версиях → разные `modelVersionId`
- **PBT:** `∀ prediction: prediction.modelVersionId ∈ ModelVersion.ids`

---

### D3: Governance Threshold (Управляемые пороги обучения)

#### Формальное определение
$$
\text{Retrain}(M) \iff (\Delta\text{Accuracy}(M_{new}) > \theta_{gain} \land \text{DriftScore}(M) > \theta_{drift}) \lor \text{DriftScore}(M) > \theta_{critical}
$$

Где:
- $\theta_{gain}$ = `governance_gain_threshold` (default: 0.02)
- $\theta_{drift}$ = `drift_trigger_threshold` (default: 0.05)
- $\theta_{critical}$ = `critical_drift_recovery_threshold` (default: 0.15) — **условие экстренного восстановления при деградации.**

#### Естественный язык
#### Естественный язык
Переобучение модели возможно при выполнении **одного из** условий:
1. **Плановая оптимизация:** Значимый прирост точности (> $\theta_{gain}$) **И** наличие дрейфа (> $\theta_{drift}$).
2. **Экстренное восстановление:** Критический дрейф (> $\theta_{critical}$), даже без прироста точности (цель — вернуть baseline).

#### Governance-конфигурация
```typescript
interface GovernanceThresholds {
  tenantId: string;
  gainThreshold: number;       // default: 0.02 (2%)
  driftThreshold: number;      // default: 0.05 (PSI > 0.05)
  criticalDriftThreshold: number; // default: 0.15 (Recovery trigger)
  minSeasonsForRetrain: number; // default: 3
  maxRetrainFrequency: string;  // default: '1/quarter'
  approvalRequired: boolean;    // default: true для global, false для tenant-specific
}
```

#### Реализация
```typescript
class ModelUpdateController {
  async evaluateRetrainingRequest(
    candidateModel: ModelCandidate,
    currentModel: ModelVersion,
    driftReport: DriftReport,
  ): Promise<RetrainingDecision> {
    const thresholds = await this.getThresholds(candidateModel.tenantId);
    
    const deltaAccuracy = candidateModel.accuracy - currentModel.accuracy;
    const driftScore = driftReport.aggregateScore;

    // D3: Recovery Logic
    if (driftScore > thresholds.criticalDriftThreshold) {
      return RetrainingDecision.APPROVED_RECOVERY({
        reason: 'CRITICAL_DRIFT_RECOVERY',
        driftScore,
        threshold: thresholds.criticalDriftThreshold
      });
    }

    // D3: Standard Optimization Logic
    if (deltaAccuracy <= thresholds.gainThreshold) {
      return RetrainingDecision.REJECTED('Недостаточный прирост точности');
    }
    
    if (driftScore <= thresholds.driftThreshold) {
      return RetrainingDecision.REJECTED('Drift ниже порога');
    }

    return RetrainingDecision.APPROVED({
      deltaAccuracy,
      driftScore,
      thresholds,
    });
  }
}
```

#### Enforcement
- **Runtime:** `ModelUpdateController` проверяет оба порога перед допуском к shadow-обучению
- **Config:** Пороги хранятся в `governance_configs` (per-tenant или global)
- **Audit:** Каждая проверка порогов логируется в `RetrainingDecisionLog`

#### Тестируемость
- **L4:** Unit: `ΔAccuracy = 0.01, DriftScore = 0.06` → REJECTED (прирост мал)
- **L4:** Unit: `ΔAccuracy = 0.03, DriftScore = 0.04` → REJECTED (drift мал)
- **L4:** Unit: `ΔAccuracy = 0.03, DriftScore = 0.06` → APPROVED
- **PBT:** `∀ (gain, drift): gain ≤ θ_gain ∨ drift ≤ θ_drift → REJECTED`
- **Adversarial:** Попытка изменить `governance_gain_threshold` без роли ADMIN → 403

---

### D4: Bias Amplification Guard (Защита от усиления предвзятости)

#### Формальное определение
$$
\forall M_{new}: \text{BiasMetric}(M_{new}) > \text{BiasMetric}(M_{current}) + \epsilon_{bias} \Rightarrow \text{Rollback}(M_{new})
$$

$$
\text{BiasComparison}_{valid} \iff validation\_snapshot\_id_{current} = validation\_snapshot\_id_{candidate}
$$

Где $\epsilon_{bias}$ = допустимое отклонение (`bias_tolerance`, по умолчанию 0.01)

#### Естественный язык
Если новая версия модели **усиливает системную ошибку** (bias) по сравнению с текущей — **откат обязателен**. Система не имеет права прогрессировать в bias.

#### Bias-метрики
| Метрика | Формула | Описание |
|---------|---------|----------|
| Regional Bias | `max(|err_region|) - mean(|err_region|)` | Неравномерность ошибки по регионам |
| Temporal Bias | `corr(error, season_idx)` | Систематическая ошибка по сезонам |
| Factor Bias | `max(|SHAP_i - SHAP_i_expected|)` | Переоценка одного фактора |
| Overfit Score | `accuracy_train - accuracy_test` | Разрыв между train и test |

#### Реализация
```typescript
class BiasAuditModule {
  async audit(
    candidate: ModelCandidate,
    current: ModelVersion,
    validationSet: DatasetSnapshot,
  ): Promise<BiasAuditResult> {
    const currentBias = await this.calculateBias(current, validationSet);
    const candidateBias = await this.calculateBias(candidate, validationSet);

    const biasAmplification = candidateBias.aggregate - currentBias.aggregate;

    if (biasAmplification > this.config.biasTolerance) {
      // D4: Обязательный rollback
      return BiasAuditResult.FAILED({
        reason: 'Усиление bias выше допустимого порога',
        current: currentBias,
        candidate: candidateBias,
        delta: biasAmplification,
        action: 'MANDATORY_ROLLBACK',
      });
    }

    return BiasAuditResult.PASSED({ delta: biasAmplification });
  }
}
```

#### Enforcement
- **Pipeline:** Bias audit — **обязательный этап** перед Canary deployment
- **Blocking:** При `FAILED` — автоматическая блокировка rollout
- **Audit:** Каждый bias-отчет сохраняется в `bias_audits` (immutable)

#### Тестируемость
- **L4:** Unit: модель с ростом bias +0.02 при tolerance 0.01 → MANDATORY_ROLLBACK
- **L5:** Integration: полный pipeline прерывается при bias failure
- **PBT:** `∀ M_new: biasAmplification > ε → result.action === 'MANDATORY_ROLLBACK'`

---

### D5: Explainable Evolution (Объяснимая эволюция)

#### Формальное определение
$$
\forall M_{v} \to M_{v+1}: \exists E = \{\Delta\text{Performance}, \Delta\text{FeatureImportance}, \text{DriftExplanation}\}: E \neq \emptyset
$$

#### Требования к содержанию (Hard Enforcement)
1. `DriftExplanation.rootCause.length >= 100` (запрет отписок).
2. `featureImportanceDelta.length >= 1` (запрет обновления без изменения весов).
3. $\sum |\Delta FeatureImportance| > 0$ (подтверждение физического изменения логики).

#### Естественный язык
Каждое обновление модели **обязано** сформировать отчет, содержащий:
1. **ΔPerformance** — изменение метрик точности
2. **ΔFeature Importance** — изменение весов входных факторов
3. **Drift Explanation** — объяснение причин drift

Обновление без объяснения — **запрещено**.

#### Структура Evolution Report
```typescript
interface EvolutionReport {
  modelVersionFrom: string;
  modelVersionTo: string;
  
  // Performance delta
  performanceDelta: {
    mae: { before: number; after: number; delta: number };
    rmse: { before: number; after: number; delta: number };
    mape: { before: number; after: number; delta: number };
  };
  
  // Feature importance shift
  featureImportanceDelta: Array<{
    featureName: string;
    importanceBefore: number;
    importanceAfter: number;
    delta: number;
    explanation: string;
  }>;
  
  // Drift context
  driftExplanation: {
    driftType: 'DATA' | 'CONCEPT' | 'PERFORMANCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    rootCause: string;           // Человеко-читаемое объяснение
    affectedFeatures: string[];
    timeWindow: { from: Date; to: Date };
  };
  
  // Governance
  approvedBy: string;
  approvedAt: Date;
  biasAuditId: string;
}
```

#### Enforcement
- **Pipeline:** `EvolutionReport` — обязательный артефакт стадии Validation
- **Runtime:** `ModelUpdateController` отклоняет promotion без отчета
- **DB-level:** `evolution_report_id` NOT NULL в `model_versions` (для v > 1)

#### Тестируемость
- **L4:** Unit: создание ModelVersion без EvolutionReport → ошибка
- **L4:** Unit: EvolutionReport с пустым `rootCause` → ошибка
- **PBT:** `∀ v > 1: modelVersion(v).evolutionReportId !== null`

---

## 3. Матрица инвариантов и компонентов

| Инвариант | Компонент | Enforcement Layer |
|-----------|-----------|-------------------|
| D1 | FeedbackLoopEngine | DB Trigger + Runtime Guard |
| D2 | PredictionService + ModelRegistry | FK + Query Guard |
| D3 | ModelUpdateController | Runtime + Config + Audit |
| D4 | BiasAuditModule | Pipeline Gate + DB |
| D5 | EvolutionReportBuilder | Pipeline Gate + FK |

---

## 4. Связь с предыдущими инвариантами

### Расширяемые
- **I30 (Reproducibility, Level C)** → расширяется до воспроизводимости обучения (D2)
- **I31 (Conflict Tracking, Level C)** → расширяется до tracking learning events (D1)

### Неизменные
- **I1–I33** → все предыдущие инварианты остаются в полной силе

---

## 5. Enforcement Strategy

### Compile-Time
- TypeScript interfaces требуют `modelVersionId` в prediction records
- `EvolutionReport` — обязательный аргумент `promoteToCAnary()`

### Runtime
- `FeedbackLoopEngine` проверяет D1 (no mutation) при каждом learning event
- `ModelUpdateController` проверяет D3 (thresholds) при каждом retrain request
- `BiasAuditModule` проверяет D4 перед каждым canary deployment

### Database-Level
- Триггеры блокируют UPDATE/DELETE на `learning_events` (D1)
- FK constraints на `model_version_id` (D2)
- NOT NULL на `evolution_report_id` для model versions v > 1 (D5)

### Pipeline-Level
- Bias audit gate (D4) — обязательный этап pipeline
- Evolution report generation (D5) — обязательный этап pipeline

---

## 6. Определение нарушения

### D1 нарушен, если:
- Learning process изменил прошлый `HarvestResult`, `Decision` или `DivergenceRecord`
- `LearningEvent` был модифицирован после создания

### D2 нарушен, если:
- Прогноз не привязан к `modelVersionId`
- Исторический прогноз использует текущую (не оригинальную) версию модели

### D3 нарушен, если:
- Retraining произошел без проверки governance-порогов
- Пороги были изменены без approval

### D4 нарушен, если:
- Новая версия модели усиливает bias, но rollback не был выполнен
- Bias audit отсутствует для нового model version

### D5 нарушен, если:
- Model version обновлен без `EvolutionReport`
- Отчет содержит пустые или null поля

---

## 7. Связанные документы

- [LEVEL_D_ARCHITECTURE.md](file:///f:/RAI_EP/docs/LEVEL_D_ARCHITECTURE.md)
- [MODEL_VERSIONING_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/MODEL_VERSIONING_ARCHITECTURE.md)
- [DRIFT_DETECTION_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/DRIFT_DETECTION_ARCHITECTURE.md)
- [RETRAINING_PIPELINE_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/RETRAINING_PIPELINE_ARCHITECTURE.md)
- [LEVEL_D_FORMAL_TEST_MATRIX.md](file:///f:/RAI_EP/docs/05_TESTING/LEVEL_D_FORMAL_TEST_MATRIX.md)
- [LEVEL_C_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_INVARIANTS.md)
