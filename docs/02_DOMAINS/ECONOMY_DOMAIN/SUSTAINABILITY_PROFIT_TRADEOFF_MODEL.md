# LEVEL E: Модель Компромисса Прибыли и Устойчивости

## 1. Введение
Математический аппарат для поиска баланса между краткосрочным `CashFlow` и долгосрочным `SoilHealth`.
**Status**: Canonical (Linked to SCE).

## 2. The Tradeoff Space (Pareto Frontier)

### 2.1. Объект Оптимизации
Система не ищет "одно лучшее решение". Она строит **Парето-Фронт** в пространстве $(Yield, SRI)$.
*   **Ось X**: Чистая Прибыль ($NPV_{5yr}$).
*   **Ось Y**: Индекс Восстановления Почвы ($\Delta SRI_{5yr}$).

### 2.2. Frontier Definition
Решение $S^*$ принадлежит фронту, если не существует решения $S'$, такого что:
$$
NPV(S') \ge NPV(S^*) \land SRI(S') \ge SRI(S^*) \land (Strict >)
$$
Все стратегии на фронте считаются "оптимальными". Выбор конкретной зависит от риск-аппетита пользователя.

## 3. Real Profit Calculation

### 3.1. Economic Value Added (EVA)
Мы вводим понятие "Настоящей Прибыли", учитывающей скрытые издержки:
$$
\text{RealProfit}(t) = \text{CashFlow}(t) - \text{SoilDepreciation}(t) - \text{LiquidityGapCost}(t)
$$

### 3.2. Liquidity Gap Cost (из SCE)
Стоимость кассового разрыва для фермера.
Если $CashFlow(t) < 0$, фермер берет кредит под $r_{debt}$.
$$
\text{LiquidityGapCost} = \sum_{t \text{ where } CF<0} |CF_t| \cdot r_{debt}
$$
Это штрафует стратегии, которые "слишком регенеративны" и банкротят фермера в первый год.

## 4. Utility Function (Выбор Пользователя)

### 4.1. Scalarization
Для автоматического ранжирования стратегий используется функция полезности Кобба-Дугласа:
$$
U(S) = (NPV_{norm})^\alpha \cdot (SRI_{norm})^{(1-\alpha)}
$$
*   $\alpha$: Параметр "Жадности" (Greed Factor).
*   По умолчанию $\alpha = 0.6$ (Баланс).
*   Level D (AI) может рекомендовать $\alpha$ на основе истории пользователя.

## 5. Visual Representation
На графике `TradeoffChart`:
*   **Green Zone**: Strategies where $\Delta SRI > 0$.
*   **Red Zone**: Strategies where $\Delta SRI < 0$ (Requires `Override`).
*   **Optimal Point**: Maximize distance from origin (Ideal Point Method).
