---
id: DOC-MET-LC-001
type: Metrics Specification
layer: Metrics (Level C)
status: Draft
version: 1.2.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL C REGRET METRICS
## Метрики калибровки и реализованного сожаления (D5 Hardened)

---

## 0. Статус документа

**Уровень зрелости:** D5 (Mathematically Hardened)  
**Привязка:** [FSM_EXTENSION.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/FSM_EXTENSION.md) (v1.5.0)  
**Базис для аудита:** Ex-Ante (Predictive) vs Ex-Post (Realized) Analysis

---

## 1. Определение Regret

### 1.1. Формальное определение (Bounded Relative Regret)
Для обеспечения стат-устойчивости и устранения зависимости от масштаба, `Regret` определяется как безразмерная величина:

$$ \text{Regret}_i = \frac{\text{Profit}_{AI} - \text{Profit}_{Human}}{\max(|\text{Profit}_{AI}|, |\text{Profit}_{Human}|, 1.0)} $$

- **Диапазон:** $\text{Regret} \in [-2, 2]$
- **Знак:**
  - $> 0$: AI был эффективнее (Человек совершил ошибку).
  - $< 0$: Человек был эффективнее (AI совершил ошибку).

### 1.2. Типы Regret
1. **Economic (Profit-based):** Основная метрика в рублях.
2. **Yield (t/ha):** Натуральный эквивалент (Regret в биомассе).
3. **Utility (Risk-adjusted):** Regret с учетом хвостовых рисков.

---

## 2. Глобальные метрики (Ex-Post)

### M-REG-01: Average Realized Regret
$$ \text{AvgRegret}_{window} = \frac{1}{N} \sum_{i=1}^{N} \text{Regret}_i $$
- **Целевое значение:** $< 0.05$ (5%).
- **Window:** Сезон (по культуре/региону).
- **Minimum N:** 50 конфликтов.

### M-REG-02: Tail Regret (Winsorized P99)
Для защиты от агро-экстремумов (погода, климат) используется **Winsorization** на уровне 99-го перцентиля.
- **Целевое значение:** $P99 < 0.20$ (20%).
- **Interpretation:** Если P99 высок — система допускает катастрофические ошибки в прогнозах.

---

## 3. Метрики калибровки (Bridge to Level C)

### M-REG-03: Risk Calibration Score (RCS)
Критическая метрика, связывающая $\Delta Risk$ (прогноз) и $Regret$ (факт):
$$ RCS = P(\text{Regret} > 0 \mid \Delta Risk > 0.3) $$
- **Цель:** $> 0.70$ (70%).
- **Смысл:** Если мы прогнозируем высокий риск ($> 0.3$), то в 70% случаев реализованный профит агронома должен быть ниже профита ИИ.
- **Низкий RCS** $\implies$ $\Delta Risk$ не несет предсказательной ценности (модель Risk Engine не откалибрована).

### M-REG-04: False Alarm Rate
$$ P(\text{Regret} \leq 0 \mid \Delta Risk > 0.3) $$
- **Цель:** $< 0.15$.
- **Смысл:** Как часто мы пугаем агронома высоким риском там, где его решение на самом деле было лучше.

---

## 4. Invariants & Traceability

1. **I-REG-001 (Audit Trail):** Каждый расчет Regret обязан ссылаться на `simulationHash` из исходного `DivergenceRecord`.
2. **I-REG-002 (Consistency):** Изменение `simulationHash` делает сопоставление ex-ante и ex-post невалидным.

---

[Changelog]
- v1.0.0: Initial operational BI metrics.
- v1.2.0: D5 Hardening. Введено формальное определение Bounded Regret, добавлена метрика калибровки RCS, внедрена Winsorization и разделение Ex-Ante/Ex-Post.
