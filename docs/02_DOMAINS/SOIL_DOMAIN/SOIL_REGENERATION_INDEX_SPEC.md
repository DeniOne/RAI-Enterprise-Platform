---
id: DOC-DOM-SOIL-001
type: Specification
layer: Domain Logic
status: Approved
version: 1.4.0
owners: [@techlead, @agronomist]
calibration_dataset: "CAL-2025-Q4"
soil_profile_version: "2026-Q1"
formula_hash: "SHA256:..."
last_updated: 2026-02-19
---

# SOIL REGENERATION INDEX (SRI) SPECIFICATION

## 1. Введение
**SRI (Soil Regeneration Index)** — интегральный показатель здоровья почвы, нормализованный в диапазоне $[0, 1]$.
**Time Semantics**: SRI рассчитывается как **Annual Post-Harvest Average** (Среднегодовое значение после уборки урожая).

## 2. Формальные Инварианты (Architecture Guarantees)
Система гарантирует выполнение следующих математических свойств для любого набора входных данных:

1.  **Boundedness**: $\forall x, SRI(x) \in [0.0, 1.0]$.
2.  **Completeness**: $\sum w_i = 1.0$ (внутри каждого субиндекса).
3.  **Determinism**: $SRI(x, \text{Profile}_{ver}) = \text{const}$ (при фиксированной версии профиля).
4.  **Non-Compensatory Top**: $I_{sub} \approx 0 \implies SRI \approx 0$.

## 3. Структура Индекса
$$
SRI = \text{clamp}\left( \sqrt[3]{I_{STR} \cdot I_{CHEM} \cdot I_{BIO}}, 0.0, 1.0 \right)
$$

### 3.1. Субиндексы
1.  **$I_{STR}$ (Structural)**:
    $$
    I_{STR} = 0.6 \cdot N_{gauss}(\text{Density}) + 0.4 \cdot N_{linear}(\text{Aggregates})
    $$

2.  **$I_{CHEM}$ (Chemical)**:
    $$
    I_{CHEM} = 0.7 \cdot N_{linear}(\text{Humus}) + 0.3 \cdot N_{gauss}(\text{pH})
    $$

3.  **$I_{BIO}$ (Biological)**:
    $$
    I_{BIO} = 0.5 \cdot N_{linear}(\text{Worms}) + 0.5 \cdot N_{linear}(\text{Respiration})
    $$

## 4. Функции Нормализации

### 4.1. Gaussian Bell ($N_{gauss}$)
$$
N_{gauss}(x, x_{opt}, \sigma) = e^{ -\frac{(x - x_{opt})^2}{2\sigma^2} }
$$
*   **Density** (Chernozem): $x_{opt}=1.15, \sigma=0.15$.
*   **pH** (Neutral): $x_{opt}=6.8, \sigma=1.0$.

### 4.2. Saturating Linear ($N_{linear}$)
$$
N_{linear}(x, x_{min}, x_{sat}) = \text{clamp} \left( \frac{x - x_{min}}{x_{sat} - x_{min}}, 0, 1 \right)
$$

| Metric | $x_{min}$ | $x_{sat}$ | Context |
| :--- | :--- | :--- | :--- |
| **Humus** | 2.0 % | 6.0 % | Chernozem |
| **Aggregates** | 20 % | 80 % | Structural Stability |
| **Worms** | 0 /m² | 50 /m² | Bio-Activity |
| **Respiration** | 10 mg/kg | 40 mg/kg | C-Flux |

## 5. Экономическая Связь (Carbon Credits)

$$
\text{TotalCredit}_{CO2e} = \Delta SRI \cdot \text{Area}_{ha} \cdot K_{corr}
$$

*   **Units**: Tonnes $CO_2e$.
*   **$K_{corr}$**: 20.0.
    *   **Audit Note**: Значение является **Intentionally Conservative** ($\approx 15\%$ от теоретического максимума пересчета гумуса в $CO_2$). Это сделано для минимизации риска "Over-crediting" и учета неопределенности измерений.
*   **Linearity**: Valid for $\Delta SRI < 0.15$ / year.

## 6. Drift & Validation Controls
### 6.1. Adaptive Threshold
$$
\Delta_{critical} = \max(0.05, 0.08 \cdot (1 - SRI_{prev}))
$$
*   **Action**: Trigger Model Recalibration.

## 7. Региональная Адаптация
Параметры $x_{opt}, x_{min}, x_{sat}$ жестко привязаны к `soil_profile_version` в метаданных. Изменение профиля требует пересчета истории (через Ledger Migration) или создания новой версии SRI-записи.
