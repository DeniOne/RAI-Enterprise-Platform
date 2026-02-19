# LEVEL E: Оценка Давления на Биоразнообразие (BPS)

## 1. Введение
Формальная метрика экологического следа агротехнологий.
**Цель**: Обеспечить соблюдение инварианта **I36 (Biodiversity Guard)**.
**Range**: [0.0 - 1.0], где 1.0 = Экологическая катастрофа.

## 2. Компоненты Расчета (BPS Formula)

### 2.1. Core Equation
$$
BPS = w_{mono} \cdot P_{mono} + w_{chem} \cdot P_{chem} + w_{index} \cdot (1 - H_{norm})
$$
*   **Weights**: $w_{mono}=0.5, w_{chem}=0.3, w_{index}=0.2$.

### 2.2. Штраф за Монокультуру ($P_{mono}$)
$$
P_{mono} = \frac{1}{\text{Distinct Crops in 5yr Cycle}}
$$
*   5 культур $\to P=0.2$ (Отлично).
*   1 культура $\to P=1.0$ (Critical Violation I36).

### 2.3. Химическая Нагрузка ($P_{chem}$)
Основано на **EIQ (Environmental Impact Quotient)** active ingredients.
$$
P_{chem} = \min \left( 1.0, \frac{\sum_{i} EIQ_i \cdot Dose_i}{EIQ_{threshold}} \right)
$$
*   $EIQ_{threshold}$: Региональный лимит "безопасной" нагрузки (напр., 50 ед/га).

### 2.4. Индекс Шеннона ($H_{norm}$)
Метрика разнообразия внутри поля (сортовая смесь) и вокруг (буферные зоны).
$$
H = -\sum_{i=1}^{S} p_i \ln p_i
$$
*   $H_{norm}$: Нормализованный к макс. возможному ($H_{max} = \ln S$).
*   Если поле засеяно 1 гибридом без полос разнотравья $\to H=0 \to Penalty=Max$.

## 3. Governance: I36 Enforcement

### 3.1. The "Monoculture Wall"
Система жестко блокирует стратегии, где $BPS > 0.8$.
*   **Error Code**: `GOV_BLOCK_BIODIVERSITY_CRITICAL`.
*   **Override**: Возможен только через Risk Committee (Force Majeure).

## 4. Integration with Optimization
В целевой функции `ObjectiveFunction` (Level E MOS):
$$
\text{Maximize } F(x) = \dots - \lambda_{bio} \cdot \max(0, BPS - 0.5)^2
$$
Штраф квадратичный: малые нарушения допустимы, большие — запретительно дороги.
