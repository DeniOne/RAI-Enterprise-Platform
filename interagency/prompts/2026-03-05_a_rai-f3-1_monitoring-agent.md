# PROMPT — A_RAI Фаза 3.1: MonitoringAgent & AutonomousExecutionContext
Дата: 2026-03-05  
Статус: active  
Приоритет: P0 (старт ФАЗЫ 3 A_RAI)  
Decision-ID: AG-ARAI-F3-001  
Зависит от: AG-ARAI-F2-003

---

## Цель

Реализовать базовую инфраструктуру для автономного мониторинга (event-driven). В центре внимания — техническая гарантия безопасности исполнения (`AutonomousExecutionContext`) и сам `MonitoringAgent`, который работает вне пользовательских сессий, анализирует входящие сигналы и может генерировать алерты строго через READ-ONLY инструменты.

**Архитектурные требования:** `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` §3.4.

---

## Задачи (что сделать)

### 1. AutonomousExecutionContext (`security/autonomous-execution-context.ts`)
- [ ] Создать новый изолированный класс контекста `AutonomousExecutionContext` (или расширить `RaiToolActorContext` строгим флагом `isAutonomous`).
- [ ] Гарантировать, что при `isAutonomous = true`, роутинг или реестры **БЛОКИРУЮТ** любые действия с `riskLevel === 'WRITE' | 'CRITICAL'`.
- [ ] Реестры (`RaiToolsRegistry` / `RiskToolsRegistry`) должны проверять этот контекст перед выполнением `tool.handler(...)` и выкидывать ошибку безопасности, если нарушается READ-ONLY правило (например, `SecurityViolationError`).

### 2. Реализация MonitoringAgent (`agents/monitoring-agent.service.ts`)
- [ ] Создать `MonitoringAgent`. У него нет `userId` и `threadId` в привычном смысле, только `companyId` и `traceId`.
- [ ] Агент анализирует фоновые сигналы (например, падение NDVI, прогноз заморозков из мока).
- [ ] Агент вызывает `RiskToolsRegistry.execute('emit_alerts', ...)` для создания алертов.
- [ ] **Лимит частоты и дедупликация:**
  - Реализовать примитивный rate limit (например, in-memory Map или кэш): не более N алертов в час для одного `companyId`.
  - Дедупликация: не спамить одним и тем же алертом (можно хэшировать контент алерта).
- [ ] **Signals Snapshot:** при генерации алерта агент должен сохранять "почему" он это сделал (в виде структурированного объекта или лога). На этом этапе достаточно выводить это в `Logger` или возвращать в `explain`.

### 3. Event-driven симуляция (Outbox Subscriber / Scheduler)
- [ ] Написать простейший триггер `monitoring-trigger.service.ts` (`@Cron()` или просто публичный метод `triggerMonitoringCycle(companyId)`), который будет симулировать получение фоновых событий.
- [ ] Триггер инжектит `MonitoringAgent` и вызывает его метод `run({...})`, передавая ему сгенерированный `traceId` и `AutonomousExecutionContext`.

### 4. Тестирование
- [ ] Unit-тесты для `AutonomousExecutionContext` и `RaiToolsRegistry` (попытка вызвать READ-WRITE инструмент из автономного контекста должна падать с ошибкой).
- [ ] Unit-тесты для `MonitoringAgent` (генерация алерта, дедупликация, rate limit).
- [ ] Обновить DI контейнеры (моки в других тестах при необходимости).

---

## Definition of Done (DoD)

- [ ] Создан и применяется `AutonomousExecutionContext` с аппаратной (на уровне кода) блокировкой WRITE/CRITICAL действий.
- [ ] `MonitoringAgent` реализован, умеет вызывать `emit_alerts` с дедупликацией и лимитом частоты.
- [ ] Создан триггер (Cron или ручной метод) для симуляции фоновой работы.
- [ ] `tsc --noEmit` — ПРОХОДИТ.
- [ ] Все юнит-тесты (новые и существующие) — PASS.

---

## Что вернуть на ревью

Отчёт с:
1. Выводом `tsc --noEmit`.
2. Выводом тестов (с демонстрацией прохождения тестов на `AutonomousExecutionContext` и `MonitoringAgent`).
3. Примером лога/вывода от `MonitoringAgent` при генерации нового алерта и при попытке дублирования (дедупликация).
