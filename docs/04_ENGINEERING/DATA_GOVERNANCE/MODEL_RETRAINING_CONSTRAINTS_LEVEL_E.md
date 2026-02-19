---
id: DOC-ENG-GOV-004
type: Standard
layer: Data Governance
status: Approved
version: 1.3.0
owners: [@techlead, @ml_ops]
enforcement_mode: strict
related_documents:
  - I38_DATA_PROVENANCE_STANDARD
  - MODEL_REGISTRY_POLICY
  - LEVEL_E_ARCHITECTURE
last_updated: 2026-02-19
---

# MODEL RETRAINING CONSTRAINTS: LEVEL E (REGENERATIVE)

## 1. Введение
Данный стандарт определяет жесткие ограничения (Constraints) для процессов дообучения (Retraining) моделей Level E.
**Цель**: Предотвратить "Catastrophic Forgetting" экологических паттернов и защитить модели от смещения в сторону чистой урожайности (Yield Bias).

## 2. Dataset Constraints (Pre-Training)

### 2.1. Bias Guard (Monoculture Filter)
Запрет на обучение моделей преимущественно на "индустриальных" данных.

*   **Logic**: `Monoculture` = < 2 видов культур за 3 года.
*   **Metric Calculation**:
    $$
    Ratio = \frac{\text{Count}(\text{MonocultureIDs})}{\text{TotalUniqueFieldIDs}}
    $$
    *   *Precision*: 4 decimal places.
*   **Constraint**: Если $Ratio > 0.6000$ $\to$ **BLOCK TRAINING**.

### 2.2. Provenance Policy (I38 Enforcement)
*   **Standard Policy**: Max `Self-Reported` Ratio = 0.3.
*   **Regional Override**:
    *   *Condition*: Регионы с низким покрытием спутников (Low Coverage Zone).
    *   *Limit*: Max Ratio = 0.5.
    *   *Justification*: Требуется явная пометка `REGIONAL_DATA_SCARCITY` в метаданных датасета.
*   **Weighting**: Unverified data always has `SampleWeight = 0.1`.

## 3. Training Constraints (In-Process)

### 3.1. Adaptive Loss Function
$$
L_{total} = MSE_{yield} + \lambda_{dyn} \cdot MSE_{soil\_state}
$$

*   **Tuning Constraint**:
    *   $\lambda$ выбирается так, чтобы максимизировать $R^2_{soil}$.
    *   **Safety Condition**: $R^2_{yield}(\text{ValidationSet}) > 0.8$.
    *   *Note*: Метрика считается строго на отложенной валидационной выборке, а не на train set.

## 4. Deployment Constraints (Post-Training)

### 4.1. Drift Guard (Golden Set Policy)
*   **Golden Set Definition**:
    *   **Versioned**: `GoldenSet_v2026.1`.
    *   **Update**: Ежегодно, владельцем `ML_OPS`.
    *   **Content**: Этлонные исторические данные с подтвержденными фактами деградации и восстановления.
*   **Constraint**: Mean Absolute Difference (MAD) vs Baseline > 0.05 $\to$ **BLOCK DEPLOY**.

## 5. Operational Enforcement Pipeline

```mermaid
graph TD
    A[Dataset Ingestion] --> B{DatasetValidator}
    B -- Bias > 60% --> C[BLOCK: BiasGuard]
    B -- OK --> D[Training Loop]
    D --> E{EarlyStopping}
    E -- R2_yield(Val) < 0.8 --> F[ABORT: OptimizationFailure]
    E -- Convergence --> G[Model Candidate]
    G --> H{DriftGuard (GoldenSet)}
    H -- MAD > 0.05 --> I[BLOCK: SafetyLock]
    H -- OK --> J[Model Registry]
```

### 5.1. Audit & Retention
*   **Log Schema**: `TrainingID`, `DatasetHash`, `BiasRatio`, `LambdaValue`, `ValidationDrift`.
*   **Retention**: 5 лет (Immutable Log Store). Юридическое требование для доказательства устойчивости.

### 5.2. Emergency Rollback
Автоматическая защита Runtime.
*   **Trigger**:
    $$
    \text{MAE}(\text{Fact}, \text{Pred})_{30d} > 0.10
    $$
    *   *Scope*: Field-Level Average.
    *   *Window*: Скользящее окно 30 дней.
*   **Action**: Мгновенный откат (Instant Revert) на `Previous Stable Version`.

## 6. Резюме
Протокол является **Operational Governance Layer**:
*   **Deterministic**: Формулы расчетов фиксированы.
*   **Region-Aware**: Учтены зоны с плохим покрытием.
*   **Versioned**: Golden Set и Baseline версионируются.
*   **Auditable**: Логи хранятся 5 лет в неизменяемом виде.
