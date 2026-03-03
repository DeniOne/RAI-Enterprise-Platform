# PROMPT — Sprint 1 / P2: Tests, E2E Smoke & Telegram Linking
Дата: 2026-03-03  
Статус: active  
Приоритет: P1  

## Цель

Верифицировать результаты Sprint 1 P1: прогнать unit-тесты на новые tools, выполнить E2E smoke через POST `/api/rai/chat`, проверить Telegram linking cascade (что при `fieldRef` в контексте `generate_tech_map_draft` отрабатывает корректно). Зафиксировать статус `VERIFIED` в чеклисте.

## Контекст

- **Промт P1:** `interagency/prompts/2026-03-03_sprint1-p1_tools-registry-domain-bridge.md` [DONE]
- **Отчёт P1:** `interagency/reports/2026-03-03_sprint1-p1_tools-registry-domain-bridge.md`
- **LAW:** [SPEC_AGENT_FIRST_RAI_EP.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/SPEC_AGENT_FIRST_RAI_EP.md) — §12 Test Scenarios (12.2, 12.3)
- **Чеклист:** [PROJECT_EXECUTION_CHECKLIST.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/PROJECT_EXECUTION_CHECKLIST.md)

### Что уже сделано в P1:
- `compute_deviations`, `compute_plan_fact`, `emit_alerts`, `generate_tech_map_draft` — зарегистрированы
- `SupervisorAgent.detectIntent()` — keyword routing работает (smoke curl PASS)
- `tsc --noEmit` на `apps/api` — PASS
- Unit тесты на registry и supervisor — PASS (добавлены в P1)

### Известные ограничения из отчёта P1:
- `generate_tech_map_draft` в autorouting запускается только если `workspaceContext` уже содержит `fieldRef` + `seasonId` — свободный парсинг из текста не реализован
- Smoke через curl на `generate_tech_map_draft` не выполнялся

## Ограничения (жёстко)

- **Не менять логику** — только тесты и smoke-верификация существующего кода
- **Tenant isolation:** в тестах не мокать `companyId` напрямую в payload — только через `actorContext`
- **Не трогать:** `telegram.update.ts` — только читать и проверять поведение. Вносить правки в Telegram только если найден реальный баг в linking cascade

## Задачи (что сделать)

### 1. Unit-тесты на новые tools (если не хватает покрытия)
- [ ] Проверить покрытие `rai-tools.registry.spec.ts`: все 4 новых тула должны быть покрыты (execute + типы payload)
- [ ] Проверить `supervisor-agent.service.spec.ts`: тест на `detectIntent` — минимум 4 кейса:
  - "покажи отклонения" → `compute_deviations`
  - "kpi план факт" → `compute_plan_fact`
  - "алерт эскалация" → `emit_alerts`
  - "сделай техкарту рапс" → `generate_tech_map_draft`
- [ ] Если тесты не написаны — написать; если написаны — убедиться что все 4 PASS

### 2. E2E Smoke через curl (все 4 тула)
- [ ] `POST /api/rai/chat` с `"покажи отклонения"` → `toolCalls[0].name == "compute_deviations"` ✅ (уже проверено, задокументировать)
- [ ] `POST /api/rai/chat` с `"kpi по плану"` → `toolCalls[0].name == "compute_plan_fact"`
- [ ] `POST /api/rai/chat` с `"есть ли алерты"` → `toolCalls[0].name == "emit_alerts"`
- [ ] `POST /api/rai/chat` с `fieldRef`+`seasonId` в `workspaceContext` и `"сделай техкарту"` → `toolCalls[0].name == "generate_tech_map_draft"`, в БД появилась запись TechMap со `status=DRAFT`

### 3. Проверка Telegram linking cascade
- [ ] Прочитать `apps/telegram-bot/src/telegram/telegram.update.ts` — найти место где `fieldRef` прокидывается в `workspaceContext`
- [ ] Убедиться что при наличии активного поля в контексте чата — `generate_tech_map_draft` получает `fieldRef` и `seasonId`
- [ ] Если проброс не реализован — добавить минимальный маппинг (только если это маленький фикс, не переписывать telegram.update.ts)

### 4. Обновить PROJECT_EXECUTION_CHECKLIST.md
- [ ] Добавить новый пункт Sprint 1 P1 со статусом `VERIFIED` и командами проверки
- [ ] Отметить `memoryUsed[]` добавление в chat contract (добавлено в S5.6, проверить что есть в чеклисте)

## Definition of Done (DoD)

- [ ] `pnpm --filter api test -- rai-tools.registry.spec.ts supervisor-agent.service.spec.ts` — все тесты PASS
- [ ] Все 4 curl smoke-проверки завершены и задокументированы в отчёте
- [ ] `generate_tech_map_draft` создаёт запись в БД (проверить через Prisma Studio или `prisma.$queryRaw`)
- [ ] `PROJECT_EXECUTION_CHECKLIST.md` обновлён со статусом `VERIFIED`
- [ ] Отчёт создан: `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md`

## Тест-план

```bash
# 1. Unit тесты
cd apps/api && pnpm test -- --runInBand \
  src/modules/rai-chat/tools/rai-tools.registry.spec.ts \
  src/modules/rai-chat/supervisor-agent.service.spec.ts

# 2. Smoke — compute_deviations (уже работало)
curl -s -X POST http://localhost:4000/api/rai/chat \
  -H "Content-Type: application/json" \
  -H "x-company-id: test-company" \
  -d '{"message": "покажи отклонения", "workspaceContext": {"route": "/consulting/techmaps"}}' | jq '.toolCalls'

# 3. Smoke — compute_plan_fact
curl -s -X POST http://localhost:4000/api/rai/chat \
  -H "Content-Type: application/json" \
  -H "x-company-id: test-company" \
  -d '{"message": "kpi по плану", "workspaceContext": {"route": "/consulting"}}' | jq '.toolCalls'

# 4. Smoke — emit_alerts
curl -s -X POST http://localhost:4000/api/rai/chat \
  -H "Content-Type: application/json" \
  -H "x-company-id: test-company" \
  -d '{"message": "есть ли алерты и эскалации", "workspaceContext": {"route": "/consulting"}}' | jq '.toolCalls'

# 5. Smoke — generate_tech_map_draft (с fieldRef в контексте)
curl -s -X POST http://localhost:4000/api/rai/chat \
  -H "Content-Type: application/json" \
  -H "x-company-id: test-company" \
  -d '{"message": "сделай техкарту рапс", "workspaceContext": {"route": "/consulting/techmaps", "activeEntityRefs": [{"type": "field", "id": "field-test-1"}, {"type": "season", "id": "season-test-1"}]}}' | jq '{toolCalls: .toolCalls, text: .text}'
```

## Что вернуть на ревью

- Результат unit тестов (вывод pnpm test)
- Логи curl (все 4 smoke) с полными JSON-ответами
- Скриншот или вывод `prisma.$queryRaw` с TechMap `status=DRAFT` (если `generate_tech_map_draft` отработал)
- Обновлённый `PROJECT_EXECUTION_CHECKLIST.md` (диф)
- Отчёт: `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md`
