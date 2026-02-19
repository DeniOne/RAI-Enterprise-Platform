---
id: DOC-ENG-SIM-001
type: Engine Specification
layer: Level E (Simulation)
status: Approved
version: 1.4.0
owners: [@techlead, @economist]
dependencies: ["DOC-DOM-SOIL-003", "DOC-ARCH-GOV-002"]
last_updated: 2026-02-19
---

# SUSTAINABLE COUNTERFACTUAL ENGINE (SCE)

## 1. Введение
Сервис стохастического моделирования альтернативных сценариев развития.
**Standard**: Level E Gold (Risk-Adjusted & Convergent).

## 2. Математическая Модель и Риск

### 2.1. Core Equation
$$
\Pi(t) = P(t) \cdot Price(t) - Cost(t) - \text{RiskPenalty}(D_t, \sigma)
$$

### 2.2. Risk Definitions (Formalized)
*   **RiskPenalty**: $\text{MaxLoss} \cdot D_t^2 \cdot (1 + \text{ClimateVol})$.
*   **MaxLoss**: Определяется как **Worst 5% Liquidity Gap** за последние 10 лет по региону.
*   **SoilDegradationIndex ($D_t$)**: Нормализованный диапазон $[0, 1]$, обновляется согласно уравнению деградации из `DOC-DOM-SOIL-003`.

### 2.3. Advanced Stochastics (Fat Tails)
*   **Distributions**:
    *   $Price(t) \sim \text{StudentT}(df=5)$ (Fat-tail risks).
    *   $Climate(t) \sim \text{Gamma}(\alpha, \beta)$ (Skewed towards heat/drought).
*   **Autocorrelation**:
    *   $\text{Price}_{t} = \alpha \cdot \text{Price}_{t-1} + \epsilon_t$ (Memory effect, $\rho \approx 0.2$).
    *   Предотвращает нереалистичные скачки "год к году".

## 3. Financial Logic & Break-Even

### 3.1. Discounting
*   **Rate**: $r = 15\%$.
*   **Justification**: Отражает **WACC** для высокорискового земледелия в нестабильном климате + премия за инфляцию производственных ресурсов.

### 3.2. Break-Even Metrics
1.  **NPV Crossover**: Точка пересечения дисконтированных потоков.
2.  **Liquidity Gap Closure**: Год, когда $CashFlow_{regen} \ge 0$.

## 4. Execution Arch & Convergence

### 4.1. Simulation Constraints
*   **Mode**: Async Vectorized Job.
*   **SLA**: 3000ms.
*   **Optimization**: Precomputed Covariance Matrix + SIMD acceleration (if avail).

### 4.2. Convergence Check (Stability Guard)
Перед выдачей результата проверяем стабильность Monte Carlo:
$$
|\Delta P_{50}(N=800, N=1000)| < 1\%
$$
*   Если $> 1\%$: Увеличить $N$ до 1500 (при условии соблюдения SLA).
*   Если снова Fail: Вернуть ошибку `SimInstabilityError` и флагом `HighVariance`.

## 5. FSM Enforcement (Strict)
*   **Trigger**: `APPROVE_STRATEGY`.
*   **Requirement**: `Simulation.risk_acknowledged == TRUE`.
*   **Proof**: Пользователь подписывает `RationaleHash` (что он ознакомлен с P05-Bottom Scenario).

## 6. Self-Learning Loop
*   **Input**: Real Field Variance vs Predicted Variance.
*   **Action**: Если Реальность была волатильнее Прогноза ($Var_{real} > Var_{sim} + 5\%$) $\to$ Модель увеличивает $\sigma$ для будущих симуляций (Conservative Adjustment).
