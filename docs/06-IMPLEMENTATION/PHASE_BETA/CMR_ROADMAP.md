# CMR Implementation Roadmap (Phase Beta)

> **Статус:** ТЕХНИЧЕСКИЙ ПЛАН REFINED  
> **Цель:** Поэтапное внедрение Consulting Control Plane без нарушения текущих процессов.

---

## Этап 1: Доменная трансформация (Schema & Logic)
- **Prisma Schema Update**:
  - Добавление полей в `Client` (ИНН, тип, риск-статус).
  - Создание модели `CmrDecision` (вместо общей CMR).
  - Создание модели `CmrRisk`.
- **Logic Level**:
  - Трансформация `Seasons` в источник событий для `CmrDecision`.
  - Реализация первой итерации `Inference Engine` (простые правила для алертов).
  - Реализация первой итерации `Inference Engine` (простые правила для алертов).
- **Deviation Review & Liability Flow**: Механизм трипартитной синхронизации (Менеджер-Агроном-Клиент).
- **Strategy Core**: Внедрение `Confidence Score` и `Client Maturity` моделей.

## Этап 2: Detailed Tech Map Module (Builder)

## Этап 2: Detailed Tech Map Module (Builder)
- **ATK Generator**: Система создания почасовых техкарт на основе анализа почвы и истории.
- **Rule Engine Expansion**: Поддержка условной логики ("Если... То...").
- **Integration**: Связка АТК с контрактом в CMR.

## Этап 3: CMR UI Infrastructure
- **Web App**:
  - Создание `layout` для CMR в `apps/web`.
  - Реализация `Dashboard (Overview)` по новому канону.
  - Реализация `Decision Timeline` (лента решений).

## Этап 3: ИИ-Оркестрация (Brain Integration)
- **NestJS CmrModule**:
  - Подключение `AgroOrchestrator` к `CmrDecisionService`.
  - Автоматическая фиксация "Этапа 0" (Анализ предшественника) на основе исторических данных.

## Этап 4: Коммуникационный мост
- **Bot Sync**:
  - Передача ИИ-рекомендаций из CMR в Telegram.
  - Обратная связь: фиксация ответа пользователя в ленте решений CMR.

## Этап 5: Strategic Layers (Post-Beta)
- **Knowledge Engine**: Агрегация кейсов из Decision Log.
- **Counterfactual Analyzer**: Анализ "что было бы, если".
- **Legal Export**: Генерация юридических отчетов по истории решений.

---

## Архитектурные Отражения (Brain/IO Axes)

| Модуль | Brain (Logic) | IO (Interface) |
|--------|---------------|----------------|
| **Season** | FSM (14 этапов) | API / Field Input |
| **CMR** | Inference / Risk Calc | Control Plane UI |
| **Bot** | Proxy / Dialog State | Telegram TGs |

---

## Приоритет следующего шага:
1. Согласование моделей `CmrDecision` и `CmrRisk`.
2. Проектирование UI-контроллера для Dashboard.
