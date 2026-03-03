# PROMPT — Sprint 1 / P1: Tools Registry Domain Bridge
Дата: 2026-03-03  
Статус: done  
Приоритет: P1  

## Цель

Наполнить `RaiToolsRegistry` четырьмя боевыми инструментами (`computeDeviations`, `computePlanFact`, `emitAlerts`, `generateTechMapDraft`) и добавить минимальный intent-based routing в `SupervisorAgent`, чтобы агент начал отвечать на реальные запросы о состоянии полей и техкарт — используя существующие доменные сервисы.

## Контекст

- **Спека:** [RAI_EP — Agent-First Sprint 1 Spec (v1).md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_EP%20%E2%80%94%20Agent-First%20Sprint%201%20Spec%20%28v1%29.md)
- **LAW:** [SPEC_AGENT_FIRST_RAI_EP.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/SPEC_AGENT_FIRST_RAI_EP.md) — §6.2 Tool Calls (typed)
- **Чеклист:** [PROJECT_EXECUTION_CHECKLIST.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/PROJECT_EXECUTION_CHECKLIST.md)

### Что уже готово (не трогать):
- `SupervisorAgent` — `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` (328 строк, оркестрирует всё)
- `RaiToolsRegistry` — `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` (инфраструктура есть, 2 stub-тула)
- `DeviationService` — `apps/api/src/modules/consulting/deviation.service.ts` ✅
- `ConsultingService` / `KpiService` — `apps/api/src/modules/consulting/` ✅
- `AgroEscalationLoopService` — `apps/api/src/modules/agro-events/agro-escalation-loop.service.ts` ✅
- `TechMapService` — `apps/api/src/modules/tech-map/tech-map.service.ts` ✅ (FSM: DRAFT→REVIEW→ACTIVE)
- `MemoryAdapter` + Engrams + эпизодическое извлечение ✅

## Ограничения (жёстко)

- **Tenant isolation:** `companyId` берётся **только** из `RaiToolActorContext` (передаётся из auth/jwt), **никогда** из payload tool call.
- **Typed only:** новые инструменты регистрируются исключительно через `RaiToolsRegistry.register()` с типизированными Zod-схемами payload. Никаких `any` в критичном контуре.
- **Не трогать:** `SupervisorAgent.orchestrate()` — только расширяем routing внутри него. Не трогать `MemoryAdapter`, `WorkspaceContext`, `AiChatPanel`, `telegram.update.ts`.
- **Не делать:** тесты (это Prompt 2), DaData, полный Telegram Intake, LangGraph.
- **`generateTechMapDraft` — только STUB:** создаёт пустой DRAFT с данными поля и сезона. Tasks[], assumptions[] = пустые, missingMust[] заполнен полностью. TODO-комментарий: "Sprint TechMap Intake — полноценная генерация".

## Задачи (что сделать)

### 1. Расширить типы в `rai-tools.types.ts`
- [x] Добавить в `RaiToolName`: `ComputeDeviations`, `ComputePlanFact`, `EmitAlerts`, `GenerateTechMapDraft`
- [x] Описать payload-интерфейсы:
  - `ComputeDeviationsPayload`: `{ scope: { companyId: string; seasonId?: string; fieldId?: string } }`
  - `ComputePlanFactPayload`: `{ scope: { companyId: string; planId?: string } }`
  - `EmitAlertsPayload`: `{ companyId: string; severity?: 'S3' | 'S4' }`
  - `GenerateTechMapDraftPayload`: `{ fieldRef: string; seasonRef: string; crop: 'rapeseed' | 'sunflower' }`
- [x] Описать result-интерфейсы для каждого тула

### 2. Зарегистрировать tools в `rai-tools.registry.ts`
- [x] `compute_deviations` → вызывает `DeviationService` методы (scoped по `companyId` из context, **не** из payload)
- [x] `compute_plan_fact` → вызывает `ConsultingService` / `KpiService` (scoped по `companyId`)
- [x] `emit_alerts` → читает `AgroEscalation` из Prisma (scoped по `companyId`), возвращает OPEN escalations S3/S4
- [x] `generate_tech_map_draft` → вызывает `TechMapService.create()` с `status: DRAFT`, все tasks=[], missingMust заполнен; **TODO-комментарий** о будущей генерации

### 3. Подключить доменные сервисы к `RaiToolsRegistry` через DI
- [x] Инжектировать `DeviationService`, `ConsultingService`, `AgroEscalationLoopService`, `TechMapService` в модуль `RaiChatModule`
- [x] Убедиться что модули экспортируют нужные сервисы (или добавить exports)

### 4. Intent routing в `SupervisorAgent`
- [x] Добавить приватный метод `detectIntent(message: string): RaiToolName | null`
- [x] Минимальные keyword-паттерны:
  - "отклонени" / "deviation" → `compute_deviations`
  - "план.факт" / "plan fact" / "kpi" → `compute_plan_fact`
  - "алерт" / "эскалац" / "alert" → `emit_alerts`
  - "техкарт" / "techmap" / "сделай карту" → `generate_tech_map_draft`
- [x] При совпадении — auto-добавить tool call в `executedTools` до формирования ответа
- [x] Результат инструмента включить в текст ответа (краткая сводка: кол-во отклонений, статус плана и т.д.)

## Definition of Done (DoD)

- [x] `tsc --noEmit` на `apps/api` проходит без ошибок
- [x] Все 4 новых тула видны в `RaiToolsRegistry`
- [x] `companyId` нигде не принимается из payload tool call — только из `RaiToolActorContext`
- [x] `generate_tech_map_draft` создаёт запись в БД со `status=DRAFT` и корректным `companyId`
- [x] Routing по keyword работает: сообщение "покажи отклонения" → tool `compute_deviations` запускается автоматически
- [x] Никаких `any` в новых интерфейсах tool payload/result

## Тест-план (минимум — тесты в Prompt 2)

> Тесты — отдельный промт (Sprint 1 / P2). Здесь только smoke-проверки руками или через curl.

- [x] `tsc --noEmit` PASS
- [ ] POST `/api/rai/chat` с `{ "message": "покажи отклонения по технкарте", "workspaceContext": { "route": "/consulting/techmaps" } }` → в ответе `toolCalls[]` содержит `compute_deviations`
- [ ] POST `/api/rai/chat` с `{ "message": "сделай техкарту на поле 4Б рапс", ... }` → в ответе `toolCalls[]` содержит `generate_tech_map_draft`, в БД появилась запись TechMap со `status=DRAFT`

## Что вернуть на ревью

- Изменённые файлы:
  - `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`
  - `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`
  - `apps/api/src/modules/rai-chat/rai-chat.module.ts`
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` (только метод `detectIntent` + его вызов)
- Результат `tsc --noEmit` (вывод терминала)
- Лог curl-запросов с ответами (toolCalls в JSON)
- Отчёт: `interagency/reports/2026-03-03_sprint1-p1_tools-registry-domain-bridge.md`
