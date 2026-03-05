# PROMPT — Agent Configurator & Management API (Phase 4.16)
Дата: 2026-03-05
Статус: active
Приоритет: P2

## Цель
Подготовить Backend API для управления реестром агентов (Agent Configurator, Capabilities Mapping, Tenant Agent Access). Это финал Фазы 4, позволяющий через UI (Control Tower) настраивать существующих агентов, прописывать им системные промпты, привязывать `ToolsRegistry` и давать доступ конкретным тенантам.

## Контекст
- **Связанные документы:**
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` (Phase 4, пункт 4.6).
- Сейчас агенты (например, AgronomAgent, EconomistAgent) захардкожены в `FanOut` или `Supervisor`. Нам нужна модель конфигурации агентов в базе (Prisma), чтобы системные промпты, используемые модели (GPT-4 / Claude) и доступные тулы можно было менять без деплоя.

## Ограничения
- Фокус на Backend API (Схема БД, Сервис, Контроллер). Frontend UI будет строиться поверх этих эндпоинтов позже.
- Изоляция тенантов обязательна (`companyId`). Опс-инженер может настраивать агентов для всех или для конкретного арендатора (если `companyId` не null).

## Задачи (что сделать)
- [ ] Добавить в Prisma модель `AgentConfiguration`:
  - `id`, `name`, `role` (уникальный ключ, например `agronomist`, `economist`), `systemPrompt` (Text), `llmModel` (String), `maxTokens` (Int), `isActive` (Boolean).
  - Связь с `companyId` (если null — это глобальный агент по умолчанию, если задан — переопределение для тенанта).
  - Поле `capabilities` (JSON) — массив имён доступных тулов или целых реестров (например `["AgroToolsRegistry", "SearchWeb"]`).
- [ ] Описать `AgentManagementService`:
  - `getAgentConfigs(companyId)` — возвращает иерархию (глобальные + переопределения тенанта).
  - `upsertAgentConfig(companyId, configDto)` — создание или обновление.
  - `toggleAgent(role, companyId, isActive)` — включение/выключение агента.
- [ ] Создать API-эндпоинт (например, `CRUD /rai/agents/config`) в модуле (можно `RaiChat` или `Explainability`).
- [ ] Покрыть сервис базовыми unit-тестами.

## Definition of Done (DoD)
- [ ] Модель Prisma создана (`prisma db push` / `prisma generate` работают).
- [ ] CRUD API для конфигурации агентов реализован.
- [ ] Тесты PASS (`tsc`, `jest`).

## Тест-план (минимум)
- [ ] Unit: `getAgentConfigs` корректно мёржит глобальные конфиги (`companyId: null`) с переопределениями тенанта.
- [ ] Unit: `upsertAgentConfig` сохраняет список capability (тулов).

## Что вернуть на ревью
- Изменённые файлы (список).
- Результаты `tsc` & `jest` по пакету.
