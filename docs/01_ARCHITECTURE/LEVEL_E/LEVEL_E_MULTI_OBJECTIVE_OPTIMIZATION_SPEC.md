---
id: DOC-ARH-OPT-001
type: Specification
layer: Core Engine
status: Approved
version: 1.3.0
owners: [@techlead]
last_updated: 2026-02-19
---

# LEVEL E: Спецификация Многоцелевой Оптимизации

## 1. Вектор Оптимизации (Five-Dimensional)

Движок оптимизирует вектор $\vec{V}$, переходя к ESG-совместимому поиску Парето.

$$
\vec{V} = [Yield, SRI, OMF, BPS, Risk]^T
$$

### Компоненты вектора:
1.  **Yield**: Экономический драйвер (т/га).
2.  **SRI**: Текущее состояние почвы (0-1).
3.  **OMF**: Прогноз гумуса (% через 5 лет).
4.  **BPS**: Биоразнообразие (1.0 = Nature Positive).
5.  **Risk (CVaR)**: Conditional Value at Risk (95%) потерь урожая на горизонте 5 лет.

## 2. Algorithmic Engine Configuration

*   **Algorithm**: NSGA-II (Elitist Non-Dominated Sorting).
*   **Constraint Handling**: $\epsilon$-Constraint Method (Hard Baseline).
*   **Pop Size**: $100$.
*   **Generations**: $500$ (Max).
*   **Stop Criteria**: $\Delta Hypervolume < 10^{-4}$ за 20 поколений.
*   **Crossover Probability**: $0.9$.
*   **Mutation Probability**: $1/L$ (где $L$ — длина генома).

### 2.1. Complexity & SLA
*   **Total Evaluations**: ~50,000 (Worst Case).
*   **SLA**: < 5 минут (при распараллеливании на 16 потоков).
*   If SLA violated $\to$ Surrogate Model Activation (Kriging).

## 3. Green Frontier Logic (Filtering)

### 3.1. Baseline Enforcement (Ratchet Effect)
Стратегия $s$ допустима только если:
$$
SRI_{proj}(T) \ge \max(SRI_{t-1 \dots t-3}) - \epsilon_{mes}
$$
*   **Immutability**: Baseline фиксируется перед сезоном.
*   **Enforcement**: Constraint Domination (Rank $\infty$ при нарушении).

## 4. Взвешивание и Оценка (Geometric Aggregation)

Используется **Non-Compensatory** агрегация. Провал одной метрики обнуляет общий скор.

$$
Score(s) = \prod_{i} \max(\epsilon_{floor}, N(M_i))^{w_i}
$$

**Компоненты произведения:**
1.  $N(Yield)^{w_y}$
2.  $N(SRI)^{w_s}$
3.  $N(OMF)^{w_r}$
4.  $N(BPS)^{w_b}$
5.  $(1 - N(Risk))^{w_{risk}}$

*   $\epsilon_{floor} = 0.01$: Защита от численного коллапса (Zero Trap).

## 5. Нормализация ($N$)

1.  **Yield**: $Yield / Y_{potential\_local}$ (Локальный агроклиматический потенциал).
2.  **Risk**: $CVaR_{95} / MaxLoss_{historic}$.
    *   $MaxLoss_{historic}$: Максимальная потеря за 30 лет истории региона.
3.  **SRI, OMF, BPS**: Нативно $[0, 1]$.

## 6. Адаптивность Весов (Feedback Loop)

Веса обновляются между сезонами (Offline Learning).

$$
\vec{w}_{t+1} = \text{Normalize}\left( \text{Clip}(\vec{w}_t + \alpha \cdot \nabla(Gap), \vec{C}_{min}) \right)
$$

1.  **Gradient**: $\nabla Gap = (Target - Actual)$. Если SRI просел, вес SRI растет.
2.  **Clip Constraints**:
    *   $w_{yield} \ge 0.1$
    *   $w_{sr} \ge 0.3$ (Invariant: Soil Priority)
    *   $w_{risk} \ge 0.1$
3.  **Normalize**: $\sum w_i = 1.0$.

## 7. Audit Trail (Immutable Log)

Каждый цикл оптимизации фиксирует в Ledger:
1.  **Pareto Snapshot**: JSON топ-100 стратегий.
2.  **Hypervolume**: Динамика сходимости (доказательство эффективности поиска).
3.  **Chosen Strategy**: ID + Hash выбранного решения.
4.  **Baseline Snapshot**: Значение Baseline, использованное для фильтрации.

Это обеспечивает **ESG-Auditability**: мы можем доказать, почему была выбрана именно эта стратегия.
