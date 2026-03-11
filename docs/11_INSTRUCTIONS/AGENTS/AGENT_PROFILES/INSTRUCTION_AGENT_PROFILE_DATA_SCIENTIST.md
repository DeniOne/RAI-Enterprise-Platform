---
id: DOC-INS-AGT-PROFILE-016
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-10
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА DATA_SCIENTIST (АНАЛИТИК-ПРОГНОЗИСТ)

## 1. Назначение

Документ описывает роль `data_scientist` — Цифровой Аналитик-Прогнозист, специализированный агент для глубокого анализа данных, построения прогнозов и извлечения скрытых закономерностей из всех слоёв когнитивной памяти RAI и операционных данных (СЕ — сельскохозяйственное предприятие).

Это **не** ChatGPT-обёртка с промптом «проанализируй данные». Это **полноценный аналитический движок**, интегрированный в когнитивную инфраструктуру RAI, способный:
- работать с временными рядами урожайности, погоды, рынков;
- строить прогнозные модели на основе исторических энграмм;
- находить скрытые корреляции между агрономическими решениями и результатами;
- генерировать actionable инсайты для `chief_agronomist`, `economist`, `strategist`.

## 2. Когда применять

Использовать документ при:

- проектировании аналитических пайплайнов и прогнозных сервисов;
- определении границ между `data_scientist` и другими агентами (`economist`, `monitoring`);
- проектировании интеграции с когнитивной памятью (L2-L6);
- определении триггеров и потребителей аналитических инсайтов;
- проектировании сезонных отчётов и cross-partner benchmarking.

## 3. Статус агента

| Параметр | Значение |
|---|---|
| **Роль** | `data_scientist` |
| **Класс** | Expert-Tier (аналогично `chief_agronomist`) |
| **Позиция в иерархии** | Параллельный эксперт при `chief_agronomist`, ниже `supervisor` |
| **Прямой заказчик** | `supervisor`, `chief_agronomist`, `strategist`, `economist` |
| **Потребитель результатов** | Все агенты + человеческий менеджмент |
| **Статус реализации** | ❌ Не реализован (проектирование) |

## 4. Архитектурная позиция

```text
                    ┌──────────────────────┐
                    │     supervisor       │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌───────▼──────┐    ┌────────▼───────┐
   │ chief_      │    │ data_        │    │ strategist     │
   │ agronomist  │◄──►│ scientist    │◄──►│                │
   │ (Эксперт)   │    │ (Аналитик)   │    │ (Стратегия)    │
   └──────┬──────┘    └───────┬──────┘    └────────┬───────┘
          │                   │                    │
   ┌──────▼──────┐    ┌───────▼──────┐    ┌────────▼───────┐
   │ agronomist  │    │ monitoring   │    │ economist      │
   │ (Операции)  │    │ (Сигналы)    │    │ (Финансы)      │
   └─────────────┘    └──────────────┘    └────────────────┘
```

### Ключевая разница с другими агентами

| Агент | Фокус | Горизонт | Данные |
|---|---|---|---|
| `monitoring` | Алерты, отклонения | Реальное время | Сигналы, пороги |
| `economist` | План-факт, ROI | Текущий сезон | Финансовые данные |
| `chief_agronomist` | Экспертиза, рекомендации | Текущая ситуация | Энграммы + знания |
| **`data_scientist`** | **Прогнозы, тренды, корреляции** | **1-5 сезонов** | **ВСЕ данные** |
| `strategist` | Стратегические решения | 1-3 года | Бизнес + рынок |

## 5. Двойной режим работы

### 5.1 Lightweight Mode — Background Analytics

| Параметр | Значение |
|---|---|
| **Триггер** | Cron (ежедневно / еженедельно / end-of-season) |
| **Модель** | Стандартная (дешёвая) |
| **Задачи** | Кластеризация энграмм, тренд-анализ, аномалии, корреляции |
| **Выход** | Готовые инсайты → L5 Institutional Memory |
| **Стоимость** | Низкая, фоновая |

**Типовые задачи Lightweight:**

| Задача | Частота | Вход | Выход |
|---|---|---|---|
| Кластеризация энграмм | Еженедельно | L4 Engrams | Кластеры паттернов |
| Тренд-анализ урожайности | End-of-season | HarvestResult × N сезонов | Тренды по полям/культурам |
| Корреляционный анализ | Еженедельно | Погода × Операции × Результат | Скрытые зависимости |
| Аномалии в данных | Ежедневно | Все потоки данных | Алерты для `monitoring` |
| Benchmark по сети | Ежемесячно | L6 Network Memory | Позиция клиента vs сеть |
| Риск-прогноз | Еженедельно | Погода + История + Фаза | Вероятности болезней/вредителей |

### 5.2 Full PRO Mode — Deep Analysis

| Параметр | Значение |
|---|---|
| **Триггер** | Запрос от `supervisor`, `chief_agronomist` или менеджера |
| **Модель** | PRO/Heavy (GPT-4o, Gemini 1.5 Pro) |
| **Задачи** | Кастомные исследования, «что если», сценарное моделирование |
| **Выход** | Структурированные аналитические отчёты |
| **Стоимость** | Высокая, on-demand |

**Типовые задачи Full PRO:**

| Задача | Пример запроса |
|---|---|
| Сценарное моделирование | «Что, если мы сменим гибрид рапса на поле Южное?» |
| ROI-оптимизация | «Где мы теряем больше всего на СЗР, и как это исправить?» |
| Cross-season pattern mining | «Какие паттерны посева работали лучше всего за 3 сезона?» |
| Weather impact prediction | «Как засуха в мае повлияет на урожайность озимого рапса?» |
| Yield prediction | «Прогноз урожайности по каждому полю на текущий сезон» |
| Network benchmarking | «Как урожайность клиента X соотносится со средней по ЦФО?» |

## 6. Интеграция с когнитивной памятью

`data_scientist` — **главный потребитель и генератор** данных в когнитивной памяти RAI.

### 6.1 Потребляет (READ)

| Слой | Что читает | Зачем |
|---|---|---|
| L1 Reactive | Hot Engrams, Active Alerts | Контекст текущей ситуации |
| L2 Episodic | Все эпизоды клиента | Исторический анализ |
| L3 Semantic | Knowledge Graph | Факты для grounding |
| L4 Procedural | ВСЕ энграммы (не только top-N) | Паттерн-майнинг, кластеризация |
| L5 Institutional | Принципы, best practices | Валидация гипотез |
| L6 Network | Анонимизированные данные сети | Cross-partner benchmarking |

### 6.2 Производит (WRITE)

| Слой | Что пишет | Как |
|---|---|---|
| L3 Semantic | Новые семантические факты | Из обнаруженных корреляций |
| L4 Procedural | Синтетические энграммы (meta-engrams) | Из кластеров паттернов |
| L5 Institutional | Аналитические принципы | Из кросс-сезонных трендов |
| L6 Network | Benchmark-метрики | Из агрегатов по сети |

### 6.3 Уникальные capabilities

```text
data_scientist:
  - FULL_ENGRAM_SCAN    (не top-N, а ВСЕ энграммы для анализа)
  - TIME_SERIES_QUERY   (запросы по временным рядам: урожайность, погода)
  - CORRELATION_ENGINE   (поиск скрытых связей: действие ↔ результат)
  - CLUSTER_ANALYSIS     (группировка паттернов без supervision)
  - PREDICTION_MODEL     (прогнозные модели: yield, risk, cost)
  - WHAT_IF_SIMULATOR    (сценарный анализ: «что если X?»)
  - BENCHMARK_API        (Network Memory L6 aggregation)
```

## 7. Потоки данных

### 7.1 Входящие данные

```text
                    ┌───────────────────────────────┐
                    │        DATA_SCIENTIST         │
                    │                               │
 HarvestResults ───►│  ┌────────────────────────┐   │
 TechMaps ─────────►│  │ Analytical Pipeline     │   │
 Observations ─────►│  │                        │   │
 Weather API ──────►│  │ 1. Ingestion           │   │
 Soil Analysis ────►│  │ 2. Transformation      │   │
 Market Prices ────►│  │ 3. Feature Extraction  │   │
 Engrams (L4) ─────►│  │ 4. Model/Analysis      │   │
 Episodes (L2) ────►│  │ 5. Insight Generation  │   │
 Semantic (L3) ────►│  │ 6. Distribution        │   │
 Network (L6) ─────►│  └────────────────────────┘   │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼─────────────────────────┐
        ▼                           ▼                         ▼
 chief_agronomist              strategist               economist
 (рекомендации)               (стратегия)              (бюджет)
```

### 7.2 Исходящие инсайты

| Тип инсайта | Потребитель | Формат |
|---|---|---|
| Прогноз урожайности по полю | `agronomist`, `economist` | `{fieldId, predictedYield, confidence, factors[]}` |
| Риск-прогноз (болезни) | `monitoring`, `chief_agronomist` | `{threat, probability, bbchWindow, recommendedAction}` |
| Тренд стоимости операций | `economist` | `{operationType, costTrend, anomalies[], optimization}` |
| Паттерн успешных техкарт | `agronomist` | `{pattern, successRate, applicableConditions}` |
| Benchmark vs сеть | `strategist`, менеджмент | `{metric, clientValue, networkAvg, percentile}` |
| Аномалия в данных | `monitoring` | `{anomalyType, severity, dataPoint, expectedRange}` |

## 8. Аналитические модели

### 8.1 Yield Prediction (прогноз урожайности)

```text
Входы:
  - Исторические HarvestResults (3+ сезонов)
  - Текущие погодные данные (температура, осадки, GDD)
  - Soil analysis (NPK, pH, гумус)
  - Текущая фаза развития (BBCH)
  - Применённые операции

Алгоритм:
  - Градиентный бустинг (XGBoost/LightGBM) на табличных данных
  - Фича-инжиниринг: GDD cumulative, осадки rolling 7/14/30, soil quality index
  - Откалиброванные confidence intervals

Выход:
  - Predicted yield (ц/га) + CI 90%
  - Top-3 contributing factors
  - Comparison with historical trend
```

### 8.2 Disease Risk Prediction (прогноз болезней)

```text
Входы:
  - Погода (температура, влажность, росяная точка)
  - История болезней на поле (из энграмм)
  - Текущая фаза BBCH
  - Предшественник в севообороте

Алгоритм:
  - Эпидемиологические модели для ключевых патогенов:
    - Склеротиниоз: T°>15, влажность>75%, BBCH 30-32
    - Фомоз: осенняя инфекция, T°>10
    - Альтернариоз: влажность>80%, BBCH 60+
  - Усиление/ослабление на основе энграмм (L4)

Выход:
  - Risk score по каждому патогену (0-1)
  - Рекомендуемое окно для обработки (дата ± допуск)
  - Confidence на основе количества энграмм
```

### 8.3 Cost Optimization (оптимизация затрат)

```text
Входы:
  - BudgetPlan × Actual expenses
  - Операции × Дозировки × Результат
  - Цены на средства защиты × Объёмы

Алгоритм:
  - Sensitivity analysis: «какая операция вносит наибольший вклад в маржу?»
  - Парето-анализ: 20% операций → 80% затрат
  - Оптимизация Фронта Парето: yield vs cost

Выход:
  - TOP-3 операции с наибольшим потенциалом экономии
  - «Что если убрать/заменить X?» сценарии
  - ROI каждой операции (₽/га прибыли на ₽/га затрат)
```

### 8.4 Cross-Season Pattern Mining (кросс-сезонный майнинг)

```text
Входы:
  - ВСЕ энграммы L4 (активные + неактивные)
  - TechMaps + HarvestResults за N сезонов
  - Погодные данные за N сезонов

Алгоритм:
  - Кластеризация (K-Means / DBSCAN) энграмм по similarity
  - Извлечение общих паттернов из кластеров
  - Association rule mining (Apriori): «если X, то Y с вероятностью Z»
  - Temporal pattern detection: «каждый 3-й сезон → снижение на Z%»

Выход:
  - Обнаруженные паттерны → Meta-Engrams (L4, cognitiveLevel=5)
  - Правила → SemanticFacts (L3)
  - Принципы → Institutional Knowledge (L5)
```

## 9. Взаимодействие с агентами

### 9.1 `chief_agronomist` ↔ `data_scientist`

| Направление | Типовой сценарий |
|---|---|
| `chief_agronomist` → `data_scientist` | «Проанализируй эффективность фолиарной подкормки бором на рапсе за 3 сезона» |
| `data_scientist` → `chief_agronomist` | Инсайт: «Фолиарная подкормка бором на BBCH-60 увеличивает масличность на 2.3% (p<0.05, n=47)» |

### 9.2 `monitoring` ↔ `data_scientist`

| Направление | Типовой сценарий |
|---|---|
| `monitoring` → `data_scientist` | «Аномальное снижение NDVI на поле X» |
| `data_scientist` → `monitoring` | «Вероятна склеротиниоз (risk=0.87). Рекомендуется проверка скаутом на BBCH-31» |

### 9.3 `economist` ↔ `data_scientist`

| Направление | Типовой сценарий |
|---|---|
| `economist` → `data_scientist` | «Рассчитай ROI по каждому полю за текущий сезон» |
| `data_scientist` → `economist` | Таблица ROI + прогноз итогового сезонного P&L |

### 9.4 `strategist` ↔ `data_scientist`

| Направление | Типовой сценарий |
|---|---|
| `strategist` → `data_scientist` | «Какие культуры/регионы показывают рост маржинальности?» |
| `data_scientist` → `strategist` | «Озимый рапс в ЦФО: +12% маржи за 3 года. Южный ФО: стагнация. Рекомендация: наращивать дисплей в ЦФО» |

## 10. Этические и технические ограничения

### 10.1 Data Governance

- **Tenant isolation**: `data_scientist` оперирует ТОЛЬКО данными конкретного `companyId`.
- **Исключение**: L6 Network Memory — анонимизированные агрегаты доступны для benchmark.
- **Запрет**: прямой доступ к данным другого тенанта ЗАПРЕЩЁН абсолютно.
- **Audit trail**: каждый аналитический запрос логируется с `traceId`.

### 10.2 Прогнозные ограничения

- Каждый прогноз ОБЯЗАН иметь `confidence` score (0-1).
- Прогнозы с `confidence < 0.5` помечаются как «низкая уверенность» и не могут использоваться для автоматических действий.
- Невозможность генерирования прогноза (недостаточно данных) — **валидный результат**, а не ошибка.
- «Недостаточно данных для прогноза» → запрос дополнительных наблюдений через `monitoring`.

### 10.3 Лимиты ресурсов

- Background (Lightweight): максимум 30 мин CPU / 2 GB RAM на один batch.
- On-demand (Full PRO): максимум 5 мин wallclock на один запрос.
- Количество concurrent аналитических задач: ≤ 3 на тенанта.

## 11. Сезонная аналитика

### 11.1 End-of-Season Report

По завершении сезона `data_scientist` автоматически генерирует:

1. **Сезонный P&L** по каждому полю (ROI, маржа, точка безубыточности).
2. **Yield Analysis**: факт vs план, факторы влияния.
3. **Engram Summary**: сколько энграмм сформировано, усилено, ослаблено.
4. **Top Learnings**: ТОП-5 инсайтов сезона.
5. **Recommendations**: что изменить на следующий сезон.
6. **Network Position**: позиция клиента vs средняя по сети RAI.

### 11.2 Pre-Season Forecast

Перед началом сезона:

1. **Yield Forecast**: прогноз по каждому полю на основе исторических трендов + климат.
2. **Risk Map**: карта рисков (болезни, вредители, засуха) по полям.
3. **Budget Recommendation**: оптимальный бюджет на основе ROI-анализа прошлых сезонов.
4. **TechMap Optimization**: рекомендации по корректировке техкарт на основе паттернов.

## 12. Техническая реализация (roadmap)

### Phase 1: Core Analytics Service

- [ ] `DataScientistService`: базовый сервис с access к MemoryFacade + PrismaService.
- [ ] `AnalyticalPipelineRunner`: cron-based batch для Lightweight задач.
- [ ] Интеграция с `EngramService.recallEngrams()` — full scan mode.
- [ ] Yield Prediction (rule-based baseline, без ML).

### Phase 2: Prediction Engine

- [ ] Disease Risk Model (rule-based + engram-backed).
- [ ] Cost Optimization (Pareto analysis).
- [ ] Seasonal Report Generator.

### Phase 3: Advanced Analytics

- [ ] Cross-Season Pattern Mining (кластеризация энграмм).
- [ ] Network Benchmarking (L6 aggregation).
- [ ] What-If Simulator integration.

### Phase 4: ML Pipeline (опционально)

- [ ] Feature store (из HarvestResults, Weather API, Soil Data).
- [ ] Model training pipeline (LightGBM/XGBoost).
- [ ] Model registry + versioning.
- [ ] A/B testing framework для моделей.

## 13. Примеры использования

### Пример 1: Прогноз урожайности

```text
USER (через supervisor): "Какой прогноз урожайности рапса на поле Южное?"

supervisor → data_scientist (Full PRO mode):
  {
    task: "yield_prediction",
    params: {
      fieldId: "field_south",
      crop: "озимый рапс",
      season: "2026"
    }
  }

data_scientist → supervisor:
  {
    predictedYield: 38.5,
    unit: "ц/га",
    confidence: 0.78,
    confidenceInterval: [34.2, 42.8],
    contributingFactors: [
      { factor: "Предшественник (пшеница)", impact: "+3.2 ц/га" },
      { factor: "Почвенная засуха в марте", impact: "-2.1 ц/га" },
      { factor: "Своевременная подкормка N", impact: "+1.8 ц/га" }
    ],
    basedOn: {
      historicalSeasons: 3,
      relevantEngrams: 23,
      weatherDataDays: 180
    }
  }
```

### Пример 2: Обнаружение паттерна

```text
data_scientist (Lightweight, background):
  
  Обнаружен паттерн: "В 87% случаев, когда фунгицидная обработка
  озимого рапса против склеротиниоза проводилась на BBCH 30-31
  (а не 32-33), урожайность была на 4.7% выше.
  
  Основание: 47 энграмм за 3 сезона, 12 полей, 4 партнёра (L6).
  Confidence: 0.89.
  
  Рекомендация: скорректировать рекомендуемое окно в техкартах
  с BBCH 30-33 на BBCH 30-31."
  
  → Записано в L5 Institutional Memory
  → Отправлено chief_agronomist для валидации
```

## 14. Связь с MEMORY_ARCHITECTURE_v2

| Архитектурный компонент | Роль `data_scientist` |
|---|---|
| L1 Reactive | Читает hot engrams и alerts для контекста |
| L2 Episodic | Полный scan для исторического анализа |
| L3 Semantic | Читает + пишет новые факты из корреляций |
| L4 Procedural | **Главный потребитель**: full scan + кластеризация + формирование meta-engrams |
| L5 Institutional | Пишет аналитические принципы и тренды |
| L6 Network | Читает для benchmark + пишет агрегаты |
| ConsolidationWorker | Независим, но генерирует данные для `data_scientist` |
| EngramFormationWorker | Формирует энграммы, которые `data_scientist` анализирует |
| MemoryFacade | Основная точка входа для аналитических запросов |

## 15. Метрики качества `data_scientist`

| Метрика | Описание | Target |
|---|---|---|
| `ds.prediction.accuracy` | Точность прогноза урожайности (RAE) | < 15% |
| `ds.risk.calibration` | Калибровка risk-прогнозов | Brier < 0.15 |
| `ds.insight.acceptance_rate` | % инсайтов, принятых chief_agronomist | > 70% |
| `ds.pattern.novelty_rate` | % действительно новых паттернов | > 30% |
| `ds.lightweight.latency` | Время batch-обработки | < 30 мин |
| `ds.pro.latency` | Время on-demand анализа | < 60 сек |
| `ds.engram.coverage` | % энграмм, проанализированных за сезон | 100% |
