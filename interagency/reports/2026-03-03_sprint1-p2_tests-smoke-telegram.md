# REPORT — Sprint 1 / P2: Tests, E2E Smoke & Telegram Linking
Дата: 2026-03-03
Статус: done
Промпт: `interagency/prompts/2026-03-03_sprint1-p2_tests-smoke-telegram.md`

## Что сделано

- Расширено unit/spec покрытие для `RaiToolsRegistry` и `SupervisorAgent` так, чтобы были проверены все 4 новых tools и все 4 intent-маршрута.
- Выполнен живой HTTP smoke через `POST /api/rai/chat` для:
  - `compute_deviations`
  - `compute_plan_fact`
  - `emit_alerts`
  - `generate_tech_map_draft`
- Подтверждено, что `generate_tech_map_draft` создаёт запись `TechMap` со статусом `DRAFT` в реальной БД.
- Проверен Telegram linking contour в `apps/telegram-bot/src/telegram/telegram.update.ts`.
- Обновлён `PROJECT_EXECUTION_CHECKLIST.md` с truth-sync записью по Sprint 1 P1 и отметкой по `memoryUsed[]`.

## Изменённые файлы

- `apps/api/package.json`
- `apps/api/pnpm-lock.yaml`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
- `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md`

## Проверка

### 1. Unit/spec

Команда:

```bash
cd apps/api && pnpm test -- --runInBand \
  src/modules/rai-chat/tools/rai-tools.registry.spec.ts \
  src/modules/rai-chat/supervisor-agent.service.spec.ts
```

Результат:

- `PASS src/modules/rai-chat/supervisor-agent.service.spec.ts`
- `PASS src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `Test Suites: 2 passed, 2 total`
- `Tests: 14 passed, 14 total`

### 2. Живой `POST /api/rai/chat` smoke

Проверка доступности API:

```json
{"status":"ok","info":{"database":{"status":"up"},"memory_heap":{"status":"up"},"storage":{"status":"up"}},"error":{},"details":{"database":{"status":"up"},"memory_heap":{"status":"up"},"storage":{"status":"up"}}}
```

#### 2.1 `compute_deviations`

Запрос:

```bash
curl -sS -X POST 'http://localhost:4000/api/rai/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"покажи отклонения","workspaceContext":{"route":"/consulting/techmaps"}}'
```

Итог:

- `toolCalls[0].name = "compute_deviations"`
- `payload.count = 0`
- в ответе присутствует `memoryUsed[]`

#### 2.2 `compute_plan_fact`

Запрос:

```bash
curl -sS -X POST 'http://localhost:4000/api/rai/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"kpi по плану","workspaceContext":{"route":"/consulting","filters":{"seasonId":"demo-season-2026-kuban-1"}}}'
```

Итог:

- `toolCalls[0].name = "compute_plan_fact"`
- `payload.planId = "demo-harvest-plan-2026-kuban-1"`
- `payload.hasData = true`

#### 2.3 `emit_alerts`

Запрос:

```bash
curl -sS -X POST 'http://localhost:4000/api/rai/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"есть ли алерты и эскалации","workspaceContext":{"route":"/consulting"}}'
```

Итог:

- `toolCalls[0].name = "emit_alerts"`
- `payload.severity = "S3"`
- `payload.count = 0`

#### 2.4 `generate_tech_map_draft`

Запрос:

```bash
curl -sS -X POST 'http://localhost:4000/api/rai/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"сделай техкарту рапс","workspaceContext":{"route":"/consulting/techmaps","activeEntityRefs":[{"kind":"field","id":"demo-field-kuban-1"}],"filters":{"seasonId":"demo-season-2026-kuban-1"}}}'
```

Итог:

- `toolCalls[0].name = "generate_tech_map_draft"`
- `payload.draftId = "cmmb1tdc20007jivbaiornnpa"`
- `payload.status = "DRAFT"`
- `payload.fieldRef = "demo-field-kuban-1"`
- `payload.seasonRef = "demo-season-2026-kuban-1"`

### 3. Проверка БД для `TechMap`

Проверка:

```json
{
  "id": "cmmb1tdc20007jivbaiornnpa",
  "status": "DRAFT",
  "companyId": "default-rai-company",
  "fieldId": "demo-field-kuban-1",
  "seasonId": "demo-season-2026-kuban-1",
  "crop": "rapeseed",
  "version": 2,
  "createdAt": "2026-03-03T20:16:39.363Z"
}
```

Вывод:

- `generate_tech_map_draft` реально создал `TechMap` в tenant-scope.

### 4. Telegram linking cascade

Проверено:

- `apps/telegram-bot/src/telegram/telegram.update.ts` поддерживает link-patch для `AgroEventDraft` через `farmRef`, `fieldRef`, `taskRef`.
- `apps/telegram-bot/src/shared/api-client/api-client.service.ts` вызывает только `agro-events/*` endpoints для draft/fix/link/confirm.
- Прямого вызова `/api/rai/chat` из Telegram-контура нет.
- Формирование `workspaceContext` для chat-flow из Telegram-контура не реализовано.

Вывод:

- linking cascade существует для Agro Draft-потока;
- linking cascade в chat-flow для `generate_tech_map_draft` из Telegram сейчас отсутствует;
- минимальный фикс не делался, потому что в текущем scope нет существующего Telegram→chat маршрута, который можно было бы безопасно расширить без изменения поведения.

## Дополнительное замечание по окружению

- Для выполнения живого smoke пришлось устранить runtime-блокер: `apps/api/src/shared/http/http-resilience.module.ts` делает `require("axios")`, но пакет отсутствовал в зависимостях `apps/api`.
- Добавлен `axios` в `apps/api/package.json`, после чего приложение успешно проходит bootstrap.

## Итог

- P2 выполнен по тестам и smoke.
- Все 4 tool-маршрута подтверждены живым `POST /api/rai/chat`.
- `TechMap` со статусом `DRAFT` подтверждён в БД.
- `memoryUsed[]` присутствует в живом chat contract.
- Telegram linking для Agro Draft подтверждён, но Telegram→chat `workspaceContext` bridge отсутствует и не менялся в рамках этого промпта.
