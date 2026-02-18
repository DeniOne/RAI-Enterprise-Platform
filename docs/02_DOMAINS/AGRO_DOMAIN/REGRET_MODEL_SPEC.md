---
id: DOC-DOM-AGRO-LC-002
type: Domain Specification
layer: Agro Domain
status: Draft
version: 1.2.0
owners: [@techlead]
last_updated: 2026-02-18
---

# REGRET MODEL — AGRO DOMAIN
## Модель сожаления для Level C (Математическая спецификация)

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Целевая функция:** Minimize Regret under Decision Conflict  
**Математический базис:** Bayesian Decision Theory, Risk Measures (CVaR)
**Синхронизация:** LEVEL_C_ARCHITECTURE v1.2.0

---

## 1. Назначение

**Regret Model** измеряет **сожаление** от выбора неоптимального действия в условиях неопределенности. В Level C сожаление измеряется как разность между **Risk-Adjusted Objectives** рекомендации ИИ и действия человека.

**Ключевой вопрос:**
> "Насколько агроном может пожалеть о своем решении, если AI был прав в оценке прибыли и рисков?"

---

## 2. Определение Regret

### 2.1. Risk-Adjusted Objective (Canon)

Level C оперирует не чистым урожаем, а **взвешенной целевой функцией прибыли**:

$$
\text{Objective}(A) = E[\text{Profit}(A)] - \lambda \cdot \text{CVaR}_{\alpha}(A)
$$

Где:
- $E[\text{Profit}(A)]$ — ожидаемая прибыль
- $\text{CVaR}_{\alpha}(A)$ — хвостовой риск прибыли (Conditional Value at Risk), $\alpha \in [0.9, 0.99]$ per-tenant
- $\lambda$ — коэффициент неприятия риска (Risk Aversion)

### 2.2. Canonical Agro Regret

**Regret** — это разница в ценности между рекомендацией ИИ ($A_{AI}$) и выбором человека ($A_{Human}$):

$$
\boxed{\text{Regret}(A') = \text{Objective}(A_{AI}) - \text{Objective}(A_{Human})}
$$

> [!IMPORTANT]
> Regret является **подписанной величиной (signed value)**. Отрицательный Regret означает, что выбор человека архитектурно оценивается как более эффективный, чем рекомендация ИИ. Абсолютное значение (|...|) запрещено для сохранения аналитической прозрачности.

### 2.3. Short vs Long Horizon

Согласно [LEVEL_C_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_ARCHITECTURE.md), модель обязана разделять горизонты:

$$
\text{Regret}_{short} = \text{Objective}(A_{AI})_0 - \text{Objective}(A_{Human})_0
$$

$$
\text{Regret}_{long} = \sum_{t=1}^{3} \frac{\text{Objective}(A_{AI})_t - \text{Objective}(A_{Human})_t}{(1 + r)^t}
$$

$$
\text{Regret}_{total} = \text{Regret}_{short} + \text{Regret}_{long}
$$

---

## 3. Компоненты модели (Декомпозиция)

Для целей UI и объяснимости Regret декомпозируется на составляющие:

### 3.1. Expected Profit Loss (ΔUtility)

$$
\Delta \text{ExpectedProfit} = E[\text{Profit}|A_{AI}] - E[\text{Profit}|A_{Human}]
$$

### 3.2. Risk Penalty (ΔRisk)

В Level C риск измеряется через хвостовую прибыль, а не волатильность урожая:

$$
\Delta \text{Risk} = \text{CVaR}_{\alpha}(A_{Human}) - \text{CVaR}_{\alpha}(A_{AI})
$$

**Примечание:** В Objective риск вычитается, поэтому в формуле Regret знак меняется для отражения штрафа.

### 3.3. Volatility Delta (ΔVolatility)

$$
\Delta \sigma = \sigma_{\text{Profit}}(A_{Human}) - \sigma_{\text{Profit}}(A_{AI})
$$

> [!NOTE]
> $\Delta \text{Volatility}$ **не участвует** в каноническом расчете Regret. Этот показатель используется исключительно в целях **Explainability** для демонстрации агроному изменения стабильности прибыли.

## 4. Сценарии

### Сценарий 1: Оптимистичный Human

**Ситуация:**
- AI: Консервативная стратегия (низкий риск)
- Human: Агрессивная стратегия (высокий потенциал, высокий хвостовой риск)

**Результаты:**
- $\Delta \text{ExpectedProfit} = -2,000$ руб/га (Human обещает больше прибыли)
- $\lambda \cdot \Delta \text{Risk} = +5,000$ руб/га (Human создает огромный риск провала)
- $\text{Regret} = (-2,000) + 5,000 = +3,000$ руб/га

**Интерпретация:** Несмотря на то, что человек может заработать больше, его "сожаление" положительно, так как риск-аппетиты системы (через $\lambda$) нарушены.

### Сценарий 2: Экспертный Human

**Результаты:**
- $\Delta \text{ExpectedProfit} = +5,000$ руб/га (AI ошибся в прогнозе)
- $\text{Regret} = -5,000$ руб/га

**Вывод:** Отрицательный Regret — сигнал для Level D о необходимости дообучения модели AI.

---

## 5. Минимизация Regret (Теоретическая справка)

В теории принятия решений часто используется критерий **minimax regret**:

$$
\min_{A \in \mathcal{A}} \max_{s \in S} \text{Regret}(A, s)
$$

> [!NOTE]
> Это теоретическая модель для робастной оптимизации. В операционной среде Level C мы используем **Risk-Adjusted Expected Objective** через Monte-Carlo симуляции, так как нас интересует распределение вероятностей, а не только худший случай.

---

## 6. Конфигурация (Risk Parameters)

Модель оперирует параметрами, настраиваемыми на уровне компании (Tenant):

```typescript
interface RiskParameters {
  lambda: number;       // Коэффициент неприятия риска (Risk Aversion), default = 0.5
  alpha: number;        // Доверительный уровень для CVaR, α ∈ [0.9, 0.99], default = 0.95
  discountRate: number; // Ставка дисконтирования для Regret_long, default = 0.1
}
```

---

## 7. Метрики (Синхронизировано с Architecture v1.2.0)

### M-REG-01: Signed Average Regret
Среднее значение Regret по всем конфликтам.

### M-REG-02: Tail Risk Delta Tracking
Отслеживание того, насколько часто Human Override увеличивает 
 хвостовой риск ($\Delta \text{CVaR} > 0$).

### M-REG-03: Horizon Disparity
Разница между $\text{Regret}_{short}$ и $\text{Regret}_{long}$.

---

## 8. Связанные документы

- [LEVEL_C_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_ARCHITECTURE.md)
- [COUNTERFACTUAL_ENGINE_SPEC.md](file:///f:/RAI_EP/docs/02_DOMAINS/AGRO_DOMAIN/COUNTERFACTUAL_ENGINE_SPEC.md)
- [DIVERGENCE_SCORE_SPEC.md](file:///f:/RAI_EP/docs/02_DOMAINS/AGRO_DOMAIN/DIVERGENCE_SCORE_SPEC.md)
- [LEVEL_C_REGRET_METRICS.md](file:///f:/RAI_EP/docs/06_METRICS/LEVEL_C_REGRET_METRICS.md)

---

[Changelog]
- v1.1.0: Полная синхронизация с канонической моделью Level C v1.2.0. Убраны абсолютные значения. Введен Objective-based Regret. Добавлены горизонты и CVaR.
- v1.2.0: Уточнена роль волатильности (только для объяснимости), зафиксирован диапазон α [0.9, 0.99], добавлен блок конфигурации RiskParameters.
