---
id: DOC-ARH-GOV-002
type: Specification
layer: Governance
status: Approved
version: 1.3.0
owners: [@techlead]
last_updated: 2026-02-19
---

# LEVEL E: GOVERNANCE FSM EXTENSION

## 1. Введение

Строгие условия переходов состояний (State Transitions) для обеспечения безопасности и предсказуемости поведения системы.

## 2. LOCKDOWN Exits (Recovery Verification)

Выход из режима аварийной защиты **не может** быть ручным решением. Это процедура, верифицируемая алгоритмически.

### 2.1. Transition: LOCKDOWN $\to$ NORMAL
Система разблокирует экономическую оптимизацию ($f_2$) **ТОЛЬКО** при выполнении совокупности условий:

1.  **Duration Condition**: $SHI$ находится в безопасной зоне минимум **2 сезона подряд**.
2.  **Threshold Condition**: $\forall t \in [Current-1, Current]: SHI(t) > 0.5$.
3.  **Trend Condition**: Тренд изменения $SHI$ положительный: $\Delta SHI / \Delta t > 0$.
4.  **Statistical Significance**: Проверка гипотезы о восстановлении:
    *   $H_0$: Почва всё ещё деградирована.
    *   $H_1$: Почва восстановилась.
    *   Требуется $p\text{-value} < 0.05$ (подтверждение сенсорами и агрохимией).

## 3. SAFE MODE Exits (Data Maturity Restoration)

Выход из режима ограниченной функциональности требует полного восстановления доверия к данным и моделям.

### 3.1. Transition: SAFE_MODE $\to$ NORMAL
Условия автоматического возврата к горизонту 5-10 лет:

1.  **Data Maturity**: Все критические слои данных (Soil, Weather, Operations) имеют статус **L5 (Verified)**. Отсутствуют "пропуски" (Stale Data) старше 12 месяцев.
2.  **Model Confidence**:
    *   Глобальная уверенность модели: $Confidence_{global} > 0.8$.
    *   Variance прогнозов: $\sigma^2_{model} < 2.0 \times \sigma^2_{baseline}$ (Модель "не штормит").
3.  **Backtest Validation**: Успешное прохождение ретроспективного теста на последних 3-х сезонах (Error < 15%).

## 4. Диаграмма Состояний (Transitions Logic)

```mermaid
stateDiagram-v2
    [*] --> NORMAL
    
    state "Validation Logic" {
        NORMAL --> REGENERATIVE_BLOCKED: Prediction(SHI) < SHI_t
        NORMAL --> LOCKDOWN: Current(SHI) < 0.4
        NORMAL --> SAFE_MODE: Confidence < 0.8 || DataAge > 12m
    }

    REGENERATIVE_BLOCKED --> NORMAL: Strategy Amended
    
    LOCKDOWN --> NORMAL: (SHI > 0.5 for 2 seasons) AND (p < 0.05)
    
    SAFE_MODE --> NORMAL: (Data Maturity L5) AND (Model Sigma < 2.0)
```

## 5. Audit Logic
Любой переход состояния (особенно выход из защитных режимов) фиксируется в Immutable Ledger с привязкой к конкретным метрикам, разрешившим переход.
*   `TransitionID`
*   `EvidenceSnapshot` (JSON с метриками SHI/Confidence)
*   `ValidatorSignature` (Системная подпись)
