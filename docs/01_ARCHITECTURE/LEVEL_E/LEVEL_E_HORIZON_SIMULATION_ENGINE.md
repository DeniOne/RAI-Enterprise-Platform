---
id: DOC-ARH-SIM-001
type: Specification
layer: Core Engine
status: Approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-02-19
---

# LEVEL E: HORIZON SIMULATION ENGINE

## 1. Введение

**Horizon Simulation Engine (HSE)** — стохастическое ядро прогнозирования.
Версия 1.1.0 вводит мандатный детерминизм и строгое двойное дисконтирование.

## 2. Deterministic Monte Carlo (I15 Enforcement)

Для обеспечения инварианта воспроизводимости (Context Hash), генерация сценариев должна быть строго детерминирована.

### 2.1. Weather Seed & Scenarios
Генератор сценариев инициализируется производным сидом:
$$
Seed_{MC} = \text{Hash}(ContextHash \oplus "WEATHER_MC")
$$

Генерируется фиксированный набор из $N=1000$ сценариев по алгоритму **Latin Hypercube Sampling** (для лучшего покрытия пространства вероятностей при фиксированном N).

### 2.2. Scenario Traceability
Каждый набор сценариев хэшируется:
$$
ScenarioHash = \text{SHA-256}\left( \sum_{i=1}^{1000} \text{Hash}(W_{scenario_i}) \right)
$$
Этот хэш сохраняется в Ledger вместе с результатами оптимизации. Это доказывает, что оптимизация проводилась именно на этом наборе погодных условий.

## 3. Objective Vector Construction (Dual Discounting)

MOS не просто "учитывает" дисконтирование, он оптимизирует вектор, где каждая компонента уже дисконтирована по своей ставке.

### 3.1. Aggregation Formulas

**1. Economic Profit ($f_1$):**
$$
f_1(S) = \sum_{t=0}^{T} \frac{\mathbb{E}[Profit(t)]}{(1 + r_{econ})^t}, \quad r_{econ} = 0.15
$$
*Деньги обесцениваются быстро.*

**2. Soil Capital ($f_2$):**
$$
f_2(S) = \sum_{t=0}^{T} \frac{\mathbb{E}[SHI(t)]}{(1 + r_{soil})^t}, \quad r_{soil} = 0.00
$$
*Почва не обесценивается. $SHI$ через 10 лет имеет вес $1.0$.*

**3. Biodiversity Score ($f_3$):**
$$
f_3(S) = \min_{t \in [0..T]} (\mathbb{E}[Biodiversity(t)])
$$
*Биоразнообразие оценивается по "узкому месту" (худшему году).*

**4. Carbon Balance ($f_4$):**
$$
f_4(S) = \sum_{t=0}^{T} \mathbb{E}[NetEmissions(t)]
$$
*Кумулятивный нетто-углерод (без дисконтирования, физическая масса).*

## 4. State Propagation Integrity

Модель распространения состояния ($\text{State}(t) \to \text{State}(t+1)$) обязана возвращать не только матожидание, но и дисперсию ($\sigma^2$).
Если на шаге $t$ дисперсия прогноза $SHI$ превышает порог (`ConfidenceThreshold`), HSE сигнализирует Governance модулю о необходимости перехода в **SAFE_MODE**.
