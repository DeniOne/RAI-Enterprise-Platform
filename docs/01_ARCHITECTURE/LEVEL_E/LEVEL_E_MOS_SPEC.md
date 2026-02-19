---
id: DOC-ARH-MOS-001
type: Specification
layer: Core Engine
status: Approved
version: 1.2.0
owners: [@techlead]
last_updated: 2026-02-19
---

# LEVEL E: MULTI-OBJECTIVE SOLVER (MOS) SPECIFICATION

## 1. Введение

**Multi-Objective Solver (MOS)** — детерминированное ядро оптимизации Level E.
Версия 1.2.0 вводит строгий контракт на детерминизм через **Context Hashing**.

## 2. Конфигурация Солвера (Solver Contract)

```yaml
solver:
  type: NSGA-II
  seed_strategy: "Hash(ContextObject)"
  generations: 500
  population_size: 100
  frontier_hash_algo: SHA-256
```

### 2.1. Строгий Context Hash (I15 Enforcement)

Seed для PRNG формируется не из случайного энтропийного пула, а из **Context Object**.
Это гарантирует, что любое изменение входных данных или версии модели приведет к новому Seed, но на фиксированных данных результат **воспроизводим вечно**.

$$
Seed = \text{SHA-256-INT}( \text{Concat}(\dots) )
$$

**Компоненты Контекста (Обязательные):**
1.  **SoilState Snapshot**: Хэш состояния почвы на $t=0$ (SOM, NPK, Moisture).
2.  **WeatherSeed**: Seed стохастического генератора погоды.
3.  **EconomicParams**: Цены, затраты ($Hash(PriceVector)$).
4.  **CarbonPolicy**: Текущие лимиты и цены CO2.
5.  **ModelVersions**: Вектор версий всех AI-моделей (YieldModel_vX, SoilModel_vY).
6.  **UserWeights**: Предпочтения оператора (если заданы априори).

**Правило:** Если версия модели обновляется (напр., `v1.1` -> `v1.2`), Seed меняется. Воспроизводимость старых прогонов возможна только на старых бинарниках моделей (Model Versioning Registry).

## 3. Целевой Вектор (Objectives)

MOS оптимизирует вектор $\vec{F}(x)$:
*   $f_1$: Yield (Max)
*   $f_2$: Profit (Max)
*   $f_3$: Soil Health Index (Max)
*   $f_4$: Biodiversity Score (Max)
*   $f_5$: Carbon Balance (Min)

## 4. Frontier Integrity (FrontierHash)

Для аудита сохраняется не только JSON результатов, но и криптографический отпечаток Фронта Парето.

### 4.1. Алгоритм Хэширования
Хэшируется **Sorted Final Population** (только Rank 0).

$$
FrontierHash = \text{SHA-256}\left( \text{Sort}_{ID} \left( \sum_{s \in Frontier} \text{Hash}(s.Objectives || s.Genotype) \right) \right)
$$

*   **Objectives**: Значения целевых функций (с точностью до 6 знаков).
*   **Genotype**: Вектор принятых решений (даты, дозы, операции).
*   **Sort**: Сортировка по ID стратегии для детерминизма порядка.

## 5. Алгоритм Оптимизации (NSGA-II)
Стандартный NSGA-II с Constrained Dominance.

## 6. Хранение
Ledger хранит:
1.  `ContextHash` (Input)
2.  `FrontierHash` (Output Integrity)
3.  `SelectedStrategyID` (User Decision)

Это обеспечивает математическое доказательство того, что выбранная стратегия действительно принадлежала Фронту, сгенерированному именно из этих входных данных.
