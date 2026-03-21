---
id: DOC-OPS-WORKFLOWS-BUSINESS-FORMULA-E2E-DRY-RUN-20260321
layer: Operations
type: Runbook
status: draft
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-OPS-BUSINESS-FORMULA-E2E-DRY-RUN-20260321
claim_status: asserted
verified_by: code
last_verified: 2026-03-21
evidence_refs: apps/api/src/modules/rai-chat/rai-chat.controller.ts;apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts;apps/api/src/modules/consulting/consulting.controller.ts;apps/api/src/modules/field-registry/field-registry.controller.ts;apps/api/src/modules/season/season.controller.ts;apps/api/src/modules/tech-map/tech-map.controller.ts;apps/api/src/modules/field-observation/field-observation.controller.ts;apps/api/src/modules/task/task.controller.ts;apps/api/src/modules/finance-economy/ofs/application/ofs.controller.ts;apps/api/src/shared/rai-chat/rai-tools.types.ts
---
# Сквозной тест формулы бизнеса через агентный контур (dry-run)

## CLAIM
id: CLAIM-OPS-BUSINESS-FORMULA-E2E-DRY-RUN-20260321
status: asserted
verified_by: code
last_verified: 2026-03-21

## Цель
Пройти руками сквозной сценарий на тестовых данных:
`Регистрация контрагента` -> `Контекст хозяйства` -> `План Урожая` -> `Эталон (Техкарта)` -> `Контроль исполнения` -> `Управление отклонениями` -> `Фактический результат` -> `Δ (прирост)` -> `Монетизация`.

## Контур выполнения
- API base: `http://localhost:4000/api`
- Основной агентный вход: `POST /api/rai/chat`
- Для детерминизма в этом runbook используется `toolCalls` в `rai/chat` + прямые REST endpoint там, где нужен гарантированный факт.
- Авторизация: `Authorization: Bearer <AUTH_TOKEN>`
- Идемпотентность для `POST/PATCH`: `Idempotency-Key: <UUID>`

## Минимальный тестовый датасет
Используйте значения как стартовые и замените только при конфликте в вашей БД.

```json
{
  "companyId": "demo-company-001",
  "counterparty": {
    "inn": "7707083893",
    "jurisdictionCode": "RU",
    "partyType": "LEGAL_ENTITY",
    "legalName": "ООО ТЕСТ ХОЗЯЙСТВО"
  },
  "crmAccount": {
    "name": "Тест Хозяйство Север",
    "type": "CLIENT"
  },
  "field": {
    "cadastreNumber": "61:01:000000:1234",
    "name": "Поле-1",
    "area": 120.5,
    "soilType": "CHERNOZEM"
  },
  "season": {
    "year": 2026,
    "status": "PLANNING",
    "expectedYield": 4.2
  },
  "harvestPlan": {
    "targetMetric": "YIELD_T_HA",
    "period": "SEASON_2026",
    "minValue": 3.6,
    "optValue": 4.2,
    "maxValue": 4.8,
    "baselineValue": 3.9
  },
  "harvestFact": {
    "crop": "rapeseed",
    "plannedYield": 4.2,
    "actualYield": 4.5,
    "harvestedArea": 120.5,
    "totalOutput": 542.25,
    "marketPrice": 23500
  }
}
```

## Шаги E2E

### Шаг 0. Регистрация контрагента (agent)
`POST /api/rai/chat`

```json
{
  "message": "Зарегистрируй контрагента по ИНН 7707083893",
  "workspaceContext": { "route": "/parties" },
  "toolCalls": [
    {
      "name": "register_counterparty",
      "payload": {
        "inn": "7707083893",
        "jurisdictionCode": "RU",
        "partyType": "LEGAL_ENTITY",
        "legalName": "ООО ТЕСТ ХОЗЯЙСТВО"
      }
    }
  ]
}
```

Артефакт выхода: `partyId`.

### Шаг 1. Контекст хозяйства
1) Создать CRM-аккаунт:
`POST /api/crm/accounts`

```json
{
  "name": "Тест Хозяйство Север",
  "inn": "7707083893",
  "type": "CLIENT",
  "partyId": "<partyId>",
  "companyId": "demo-company-001"
}
```

2) Создать поле:
`POST /api/registry/fields`

```json
{
  "cadastreNumber": "61:01:000000:1234",
  "name": "Поле-1",
  "area": 120.5,
  "soilType": "CHERNOZEM",
  "accountId": "<accountId>",
  "companyId": "demo-company-001",
  "coordinates": {
    "type": "Polygon",
    "coordinates": [[[39.70,47.21],[39.71,47.21],[39.71,47.22],[39.70,47.22],[39.70,47.21]]]
  }
}
```

3) Создать сезон:
`POST /api/seasons`

```json
{
  "year": 2026,
  "status": "PLANNING",
  "fieldId": "<fieldId>",
  "expectedYield": 4.2
}
```

Артефакт выхода: `accountId`, `fieldId`, `seasonId`.

### Шаг 2. План Урожая
`POST /api/consulting/plans`

```json
{
  "accountId": "<accountId>",
  "seasonId": "<seasonId>",
  "targetMetric": "YIELD_T_HA",
  "period": "SEASON_2026",
  "minValue": 3.6,
  "optValue": 4.2,
  "maxValue": 4.8,
  "baselineValue": 3.9,
  "contextSnapshot": {
    "notes": "Тестовый dry-run",
    "waterLimit": "medium",
    "machineryReady": true
  }
}
```

Затем перевести план до `ACTIVE`:
- `POST /api/consulting/plans/<planId>/transitions` со статусом `REVIEW`
- `POST /api/consulting/plans/<planId>/transitions` со статусом `APPROVED`
- `POST /api/consulting/plans/<planId>/transitions` со статусом `ACTIVE`

Артефакт выхода: `planId` в статусе `ACTIVE`.

### Шаг 3. Эталон (Техкарта)
Вариант через agent:
`POST /api/rai/chat`

```json
{
  "message": "Сгенерируй черновик техкарты",
  "workspaceContext": {
    "route": "/consulting/techmaps/active",
    "filters": { "seasonId": "<seasonId>" }
  },
  "toolCalls": [
    {
      "name": "generate_tech_map_draft",
      "payload": {
        "fieldRef": "<fieldId>",
        "seasonRef": "<seasonId>",
        "crop": "rapeseed"
      }
    }
  ]
}
```

Артефакт выхода: `draftId` (идентификатор техкарты).

### Шаг 4. Контроль исполнения
1) Получить активные операции:
`GET /api/consulting/execution/active`

2) Запустить и закрыть одну операцию:
- `POST /api/consulting/execution/<operationId>/start`
- `POST /api/consulting/execution/complete`

Пример закрытия:

```json
{
  "operationId": "<operationId>",
  "notes": "Тестовое выполнение",
  "actualResources": [
    { "resourceId": "<mapResourceId>", "amount": 95, "notes": "Ниже плана" }
  ]
}
```

3) Зафиксировать наблюдение поля:
`POST /api/field-observation`

```json
{
  "type": "MEASUREMENT",
  "intent": "MONITORING",
  "integrityStatus": "STRONG_EVIDENCE",
  "fieldId": "<fieldId>",
  "seasonId": "<seasonId>",
  "content": "Всходы ровные, локальные пропуски 2-3%",
  "telemetryJson": { "soilMoisture": 22.1, "ndvi": 0.71 }
}
```

Артефакт выхода: факт выполнения операций + наблюдения.

### Шаг 5. Управление отклонениями
Вариант через agent:
`POST /api/rai/chat`

```json
{
  "message": "Покажи отклонения по сезону",
  "workspaceContext": {
    "route": "/consulting/deviations",
    "filters": { "seasonId": "<seasonId>", "fieldId": "<fieldId>" }
  },
  "toolCalls": [
    {
      "name": "compute_deviations",
      "payload": {
        "scope": {
          "seasonId": "<seasonId>",
          "fieldId": "<fieldId>"
        }
      }
    }
  ]
}
```

Артефакт выхода: список `deviations` с `count`.

### Шаг 6. Фактический результат
`POST /api/consulting/yield`

```json
{
  "planId": "<planId>",
  "fieldId": "<fieldId>",
  "crop": "rapeseed",
  "plannedYield": 4.2,
  "actualYield": 4.5,
  "harvestedArea": 120.5,
  "totalOutput": 542.25,
  "marketPrice": 23500,
  "qualityClass": "CLASS_1",
  "harvestDate": "2026-09-15T00:00:00.000Z"
}
```

Артефакт выхода: запись факта уборки для `planId`.

### Шаг 7. Δ (прирост)
1) `GET /api/consulting/kpi/plan/<planId>`
2) `POST /api/rai/chat` с `compute_plan_fact`:

```json
{
  "message": "Сделай план-факт по сезону",
  "workspaceContext": {
    "route": "/finance",
    "filters": { "seasonId": "<seasonId>", "planId": "<planId>" }
  },
  "toolCalls": [
    {
      "name": "compute_plan_fact",
      "payload": { "scope": { "planId": "<planId>", "seasonId": "<seasonId>" } }
    }
  ]
}
```

Проверка Δ:
- `delta_yield = actualYield - plannedYield`
- `delta_margin = fact_margin - plan_margin` (берётся из KPI/plan-fact ответа)

### Шаг 8. Монетизация
Проверить финансовый срез:
`GET /api/ofs/finance/dashboard`

Дополнительно (если нужно сценарно):
- `GET /api/consulting/cashflow/current`
- `GET /api/consulting/cashflow/projection?startDate=2026-03-01&endDate=2026-12-31`

Артефакт выхода: `totalBalance`, `budgetConsumed`, `budgetRemaining`, `budgetBurnRate`.

## Критерии успешного прогона
- Создан контрагент и связан с CRM-аккаунтом.
- Созданы `field` и `season`, план переведён в `ACTIVE`.
- Сгенерирован `tech map draft`.
- Есть хотя бы 1 закрытая операция и 1 запись `field-observation`.
- Получен расчёт отклонений.
- Сохранён фактический урожай.
- Получен расчёт план-факт и вычислен `Δ`.
- Получен финансовый итог в `ofs/finance/dashboard`.

## Известные ограничения текущего MVP
- `simulate_scenario` и `compute_risk_assessment` в текущем реестре инструментов возвращают `stub`.
- Для стабильного прохождения шага рекомендуется указывать `toolCalls` явно, чтобы избежать неоднозначной маршрутизации естественного текста.
- Часть write-операций чувствительна к ролям и tenant-контексту; используйте пользователя с правами planning/execution/strategic/finance согласно шагу.
