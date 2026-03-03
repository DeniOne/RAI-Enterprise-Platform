# REPORT — Sprint 1 / P1: Tools Registry Domain Bridge
Дата: 2026-03-03
Статус: done
Промпт: `interagency/prompts/2026-03-03_sprint1-p1_tools-registry-domain-bridge.md`

## Что сделано

- `RaiToolsRegistry` расширен до 4 боевых инструментов: `compute_deviations`, `compute_plan_fact`, `emit_alerts`, `generate_tech_map_draft`
- Добавлены typed payload/result контракты в `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`
- `generate_tech_map_draft` замкнут на `TechMapService.createDraftStub(...)` с tenant-scope из `RaiToolActorContext`
- Для `compute_deviations` добавлен scoped read-model через `DeviationService`
- Для `compute_plan_fact` добавлен scoped KPI bridge через `KpiService`
- Для `emit_alerts` добавлено чтение `AgroEscalation` из Prisma по `companyId` и `status=OPEN`
- В `SupervisorAgent` добавлен минимальный keyword intent routing и auto tool execution
- Краткие сводки результатов tools добавляются в `response.text`
- Экспорты модулей и DI-контур `RaiChatModule` доведены до рабочего состояния

## Изменённые файлы

- `apps/api/src/modules/agro-events/agro-events.module.ts`
- `apps/api/src/modules/consulting/consulting.module.ts`
- `apps/api/src/modules/consulting/deviation.service.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`
- `apps/api/src/modules/tech-map/tech-map.service.ts`

## Проверка

- `pnpm --filter api exec tsc --noEmit` — PASS
- `pnpm --filter api test -- rai-tools.registry.spec.ts supervisor-agent.service.spec.ts` — PASS

## Ограничения / отклонения

- `generate_tech_map_draft` в autorouting запускается только если `workspaceContext` уже содержит достаточные refs (`fieldRef`, `seasonId`); свободный парсинг этих ссылок из текста не добавлялся
- Smoke через `curl` и реальный POST `/api/rai/chat` не выполнялись в рамках этой финализации
- Несмотря на фразу в prompt "тесты — отдельный prompt", были добавлены и прогнаны таргетные unit/spec проверки для стабилизации изменений

## Итог

- Prompt реализован на уровне кода и локальных проверок
- Чеклист в prompt обновлён
- Отчёт создан
