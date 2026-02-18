---
id: DOC-ARH-CORE-LD-005
type: Architecture
layer: Core
status: Draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# DRIFT DETECTION ARCHITECTURE
## Архитектура обнаружения смещения данных и деградации моделей

---

## 0. Статус документа

**Уровень зрелости:** D5+ (Industrial & Academic Rigor)  
**Binding:** HARD  
**Инварианты:** D3 (Governance Threshold), D5 (Explainable Evolution)

---

## 1. Назначение

Модуль Drift Detection обеспечивает непрерывный мониторинг стабильности ML-решений, выявляя отклонения в данных (**Data Drift**), статистических свойствах целевой переменной (**Concept Drift**) и метриках качества (**Performance Drift**).

Система работает в режиме **Zero Trust**: любое существенное отклонение автоматически блокирует модель или инициирует переобучение.

---

## 2. Ключевые принципы (Level D)

| # | Принцип | Описание |
|---|---------|----------|
| 1 | **Baseline Binding** | Drift считается строго относительно Snapshot'а, на котором обучена модель |
| 2 | **Determenistic Windows** | Окна детекции фиксированы (Time/Count) и иммутабельны |
| 3 | **Normalized Scoring** | Единая метрика `AggregateDriftScore` $\in [0, 1]$ |
| 4 | **Hysteresis Guard** | Защита от "мигания" статуса (debounce/cooldown) |
| 5 | **State Machine Binding** | Drift Event напрямую влияет на статус модели (Active → Degraded) |

---

## 3. Сущности

### 3.1. Drift Report
```typescript
interface DriftReport {
  id: string;                   // CUID
  tenantId: string;
  modelVersionId: string;       // Models under monitoring
  
  // Baseline Binding (D4.1)
  baselineSnapshotId: string;   // Reference Dataset
  baselineWindow: TimeWindow;   // "Training data stats"
  
  // Detection Context (D4.4)
  detectionWindow: TimeWindow;  // "Last 24h", "Last 1000 predictions"
  dataHash: string;             // SHA-256 хеш данных окна (Leakage Guard)
  
  // Metrics
  metrics: {
    psi: number;                // Population Stability Index
    klDivergence: number;       // Kullback-Leibler
    wasserstein: number;        // Earth Mover's Distance
    accuracyDrop: number;       // Delta vs Baseline Accuracy
  };
  
  // Scoring & Status
  aggregateScore: number;
  verdict: DriftVerdict;        // OK | WARNING | CRITICAL
  status: ReportStatus;         // VALID | INVALID | INSUFFICIENT_DATA
  invalidReason?: string;       // Reason for INVALID status (e.g. "Schema Mismatch")
  
  // Meta
  algorithmId: string;          // Link to Immutable DriftAlgorithm Entity
  createdAt: Date;
}

enum ReportStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',            // Data Leakage or Schema Mismatch
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA' // Statistically insignificant
}

### 3.2. Drift Algorithm (Immutable Registry Entity)
**Invariant:** Алгоритм является сущностью первого класса в Registry.

```typescript
interface DriftAlgorithm {
  id: string;                   // CUID
  version: string;              // SemVer "1.2.0"
  
  // Configuration
  weights: {
    data: number;               // 0.3
    concept: number;            // 0.3
    performance: number;        // 0.4
  };
  thresholds: {
    psiCritical: number;        // 0.2
    accuracyDropCritical: number; // 0.05
  };
  normalizationRule: string;    // "LINEAR_CAP_1"
  
  // Statistical Guards
  minSamples: number;           // 100
  confidenceLevel: number;      // 0.95
  
  // Policies
  windowPolicy: 'FIXED_TIME' | 'FIXED_COUNT';
  
  createdAt: Date;
  isImmutable: boolean;         // Always true
}
```

### 3.3. Baseline Profile
Иммутабельный профиль, создаваемый при публикации модели.
```typescript
interface BaselineProfile {
  modelVersionId: string;
  datasetSnapshotId: string; // Связь с D2
  
  // Pre-computed stats for O(1) comparison
  featureDistributions: Map<string, Histogram>; 
  performanceMetrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
}
```

---

## 4. Математическая модель (D4.3)

### 4.1. Нормализация метрик
Все метрики приводятся к шкале $[0, 1]$, где $1$ — максимальное отклонение.

$$
f(x) = \min(1, \frac{x}{\theta_{critical}})
$$

Где $\theta_{critical}$ — порог критического отклонения для метрики.

### 4.2. Aggregate Score Formula
$$
\text{Score} = w_d \cdot f(\text{DataDrift}) + w_c \cdot f(\text{ConceptDrift}) + w_p \cdot f(\text{PerfDrift})
$$

**Standard Weights:**
- $w_d = 0.3$ (Data PSI)
- $w_c = 0.3$ (Target Shift)
- $w_p = 0.4$ (Accuracy Drop)

$$\sum w_i = 1$$

**Verdict Logic:**
- `OK`: Score < 0.3
- `WARNING`: 0.3 $\le$ Score < 0.7
- `CRITICAL`: Score $\ge$ 0.7

---

## 5. Statistical Significance & Robustness (D5.3)

### 5.1. Sample Size Guard
Если количество наблюдений в окне $N < N_{min}$ (из `DriftAlgorithm`):
- `status` → `INSUFFICIENT_DATA`.
- `verdict` → `OK` (Safe default) или `WARNING` (зависит от политики).
- Drift Score не рассчитывается (или помечается как unreliable).

### 5.2. Confidence Intervals
Для метрик accuracy используется доверительный интервал (Wilson Score Interval).
Drift считается detected, только если **нижняя граница** текущего интервала хуже baseline.

---

## 6. Explainable Evolution (D5.2)

### 6.1. Feature Level Attribution
Каждый `DriftReport` обязан содержать детализацию (`featureDriftDetails`).
Вклад фичи в общий скор:
$$
\text{Contribution}_i = \frac{\text{PSI}_i \cdot \text{ExampleImportance}_i}{\sum (\text{PSI}_k \cdot \text{Imp}_k)}
$$

### 6.2. Top-K Reporting
В UI/Alerts выводятся только Top-K фич (обычно 5), внесших наибольший вклад в деградацию.

---

## 7. Hysteresis & Stability (D4.6)

---

## 8. Binding to Model Registry (D4.7) & Multi-Model Policy (D5.4)

### 8.1. Model FSM Binding & Retraining Policy (Safety Guard)
Drift Detection — триггер для жизненного цикла, но с защитой от "Retrain Loop".

| Drift Verdict | Model State Transition | Action |
|---------------|------------------------|--------|
| **OK** | `ACTIVE` | No action |
| **WARNING** | `ACTIVE` (Logged) | Async Shadow Retrain (Low Priority). |
| **CRITICAL** | `DEGRADED` | **Block Inference**. Trigger Immediate Retrain (High Priority). |

**Retraining Rate Control:**
- **Max Retrains:** Не более 1 раза в сутки (конфигурируемо).
- **Backoff:** Exponential backoff при последовательных сбоях обучения.
- **Cool-down:** После successful retrain дрифт игнорируется X часов (warm-up period).

### 8.2. Temporal Consistency & Schema Guard (D5.5)
Drift Evaluation **ОБЯЗАН** проверять совместимость схем данных.

**Scenario:** Baseline создан 6 месяцев назад, схема данных изменилась (feature `X` deprecated).
**Check:** $Schema(Window) \subseteq Schema(Baseline)$.
Если в текущем окне отсутствуют обязательные фичи из Baseline:
- `status` → `INVALID`.
- `invalidReason` → `SCHEMA_MISMATCH: Missing feature X`.
- Drift не рассчитывается.

### 8.3. Multi-Model Scope
**Invariant:** Drift Report всегда привязан к конкретной паре `(ModelVersionId, BaselineProfileId)`.
- **Active Model:** Мониторится в реальном времени. Drift → Alert/Block.
- **Shadow Model:** Мониторится пассивно. Drift → Оценка готовности к релизу.
- **Fallback Model:** Мониторится (если используется).

Drift одной модели **не влияет** автоматически на статус другой (изоляция контекста).

---

## 9. Deterministic Windows & Leakage Guard (D4.4, D4.5)

### 9.1. Window Definition
Окна определяются строго по времени или количеству.
- **Time-Based:** `[T - 24h, T)` (полные сутки, ISO 8601).
- **Count-Based:** `Last N` (with explicit offsets).

Sliding windows реализованы как серия фиксированных перекрывающихся окон, каждое из которых имеет уникальный ID.

### 9.2. Data Leakage Guard
Для обеспечения воспроизводимости `DriftReport'а`:
1. Данные для окна "замораживаются" (Snapshot или Hash).
2. Report ссылается на `dataHash` окна.
3. Если данные в окне изменились (retroactive update) — Report помечается как `INVALID` (via `status` field).

---

## 10. Запрещённые операции

| Операция | Причина |
|----------|---------|
| Сравнение с "Live Baseline" | Baseline Binding Violation |
| Расчет дрифта по незафиксированному окну | Reproducibility Violation |
| Игнорирование Hysteresis (флаппинг) | Stability Guard |
| Ручное изменение `aggregateScore` | Governance Guard |
| Изменение `DriftAlgorithm` "на лету" | Algorithm Freeze Violation |

---

## 11. Связанные документы

- [DATASET_SNAPSHOT_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/DATASET_SNAPSHOT_ARCHITECTURE.md)
- [MODEL_VERSIONING_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/MODEL_VERSIONING_ARCHITECTURE.md)
- [LEVEL_D_METRICS.md](file:///f:/RAI_EP/docs/06_METRICS/LEVEL_D_METRICS.md)
