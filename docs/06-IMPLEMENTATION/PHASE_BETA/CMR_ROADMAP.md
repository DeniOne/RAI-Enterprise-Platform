---
id: component-implementation-cmr-roadmap
type: component
status: review
owners: [techleads, consultants]
aligned_with: [principle-vision]
---

# CMR Implementation Roadmap (Phase Beta)

> **Статус:** **COMPLETED** | **Завершен:** 08.02.2026
> **Цель:** Поэтапное внедрение Consulting Control Plane. Все контуры (B1-B6) физически замкнуты.

---

## Этап 1: Доменная трансформация (Schema & Logic)
- [x] **Prisma Schema Update**:
  - [x] Добавление полей в `Client` (ИНН, тип, риск-статус).
  - [x] Создание модели `CmrDecision` (вместо общей CMR).
  - [x] Создание модели `CmrRisk`.
- [x] **Logic Level**:
  - [x] Трансформация `Seasons` в источник событий для `CmrDecision`.
  - [x] Реализация первой итерации `Inference Engine` (простые правила для алертов).
- [x] **Deviation Review & Liability Flow**: Механизм трипартитной синхронизации (Менеджер-Агроном-Клиент).
- [x] **Strategy Core**: Внедрение `Confidence Score` и `Client Maturity` моделей.

## Этап 2: Detailed Tech Map Module (Builder)
- [x] **ATK Generator**: Система создания почасовых техкарт на основе анализа почвы и истории.
- [x] **Rule Engine Expansion**: Поддержка условной логики ("Если... То...").
- [x] **Integration**: Связка АТК с контрактом в CMR.

## Этап 3: CMR UI Infrastructure ✅
- [x] **Web App**:
  - [x] Создание `layout` для CMR в `apps/web` (Strategic Layout).
  - [x] Реализация `Dashboard (Overview)` по новому канону (GSV-01).
  - [x] Реализация `Decision Timeline` (лента решений через Strategic Analytics).

## Этап 3.1: ИИ-Оркестрация (Brain Integration) ✅
- [x] **NestJS CmrModule**:
  - [x] Подключение `AgroOrchestrator` к `CmrDecisionService`.
  - [x] Автоматическая фиксация "Этапа 0" (Анализ предшественника) на основе исторических данных.

## Этап 4: Коммуникационный мост ✅
- [x] **Bot Sync**:
  - [x] Передача ИИ-рекомендаций из CMR в Telegram (`Internal API`).
  - [x] Обратная связь: фиксация ответа пользователя (Confirmation Logic) в Integrity Gate.

## Этап 5: Strategic Layers (Post-Beta)
- [ ] **Knowledge Engine**: Агрегация кейсов из Decision Log.
- [ ] **Counterfactual Analyzer**: Анализ "что было бы, если".
- [ ] **Legal Export**: Генерация юридических отчетов по истории решений.

---

## Архитектурные Отражения (Brain/IO Axes)

| Модуль | Brain (Logic) | IO (Interface) |
|--------|---------------|----------------|
| **Season** | FSM (14 этапов) | API / Field Input |
| **CMR** | Inference / Risk Calc | Control Plane UI |
| **Bot** | Proxy / Dialog State | Telegram TGs |

---

## Приоритет следующего шага:
1. Реализация CMR UI (Dashboard & Risk Registry).
2. Интеграция Telegram Bot для подтверждения Deviations.
