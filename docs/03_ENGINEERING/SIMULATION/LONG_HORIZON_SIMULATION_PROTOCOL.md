---
id: DOC-ENG-SIMULATION-LONG-HORIZON-SIMULATION-PROTOCO-CUSK
layer: Engineering
type: Service Spec
status: draft
version: 0.1.0
---
# LEVEL E: Протокол Долгосрочной Симуляции

## 1. Введение
Стандарт стохастического прогнозирования на 10 лет.
**Цель**: Выявление скрытых рисков деградации ($D_t$) и кассовых разрывов ($LiquidityGap$) на длинном горизонте.
**Engine**: `SUSTAINABLE_COUNTERFACTUAL_ENGINE` (SCE).

## 2. Параметры Горизонта

### 2.1. The 10-Year Standard
*   **Operating Horizon**: 5 лет (Активное планирование).
*   **Strategic Horizon**: 10 лет (Оценка остаточной стоимости земли).
*   **Why 10 Years?**: Циклы восстановления гумуса занимают 3-7 лет. 5 лет недостаточно, чтобы увидеть полную окупаемость регенеративных практик.

## 3. Стохастический Протокол (Monte Carlo)

### 3.1. Iterations & Correlation
*   **Iterations**: $N=1000$ (Standard), $N=10,000$ (Deep Audit).
*   **Correlations**:
    *   $Price \leftrightarrow Climate$: $0.35$.
    *   $Yield \leftrightarrow SoilHealth$: $0.60$.
*   **Distributions**:
    *   Price: `StudentT(df=5)` (Fat Tails).
    *   Climate: `Gamma` (Skewed Risk).

### 3.2. Risk Bands (Categorization)
Результаты классифицируются по P90 (Worst-Case):
*   🟢 **Green (Resilient)**: $SRI_{10yr} > SRI_{start}$ в 95% сценариев. ROI > WACC.
*   🟡 **Yellow (Volatile)**: $SRI$ растет в среднем, но есть риск кассового разрыва ($LiquidityGap > 0$) в годы 1-2.
*   🔴 **Red (Degrading)**: $SRI$ падает в >50% сценариев ИЛИ риск банкротства > 5%.

## 4. Execution Tiers

### 4.1. Fast Simulation (Interactive)
*   **Trigger**: Пользователь меняет слайдер весов.
*   **Sim**: 5 лет, $N=100$.
*   **SLA**: < 500ms.

### 4.2. Deep Simulation (Governance)
*   **Trigger**: Попытка утвердить стратегию (`APPROVE`).
*   **Sim**: 10 лет, $N=1000$, Correlated.
*   **SLA**: < 3000ms.

### 4.3. Batch Audit (Nightly)
*   **Trigger**: Ежесуточная переоценка портфеля.
*   **Sim**: Full Portfolio, $N=10,000$.
*   **Output**: `PortfolioRiskHeatmap`.
