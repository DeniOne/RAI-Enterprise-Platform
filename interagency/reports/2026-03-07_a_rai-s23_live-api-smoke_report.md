# REPORT — A_RAI S23 Live API Smoke

Дата: 2026-03-07
Промт: `interagency/prompts/2026-03-07_a_rai-s23_live-api-smoke.md`
Статус: READY_FOR_REVIEW

## Что сделано

- Добавлен live HTTP smoke suite [a_rai-live-api-smoke.spec.ts](/root/RAI_EP/apps/api/test/a_rai-live-api-smoke.spec.ts).
- Harness поднимает реальный Nest application через `createNestApplication()` и ходит в него через `supertest`.
- Smoke больше не собирает вручную фасад из контроллеров: он импортирует реальный feature-module graph `RaiChatModule + ExplainabilityPanelModule`.
- Покрыт канонический Stage 2 control-plane slice:
  - observability / explainability: `GET /api/rai/explainability/queue-pressure`
  - governance / incidents: `GET /api/rai/incidents/feed`
  - governed control-plane read model: `GET /api/rai/agents/config`
  - governed write path: `POST /api/rai/agents/config/change-requests`
  - legacy-bypass negative case: `POST /api/rai/agents/config` -> `404`

## Почему это smoke, а не controller-unit

- Тесты не вызывают методы контроллеров напрямую.
- Каждый сценарий поднимает HTTP surface (`app.getHttpServer()`) и делает реальный запрос через `supertest`.
- Контроллеры приходят из боевых модулей `RaiChatModule` и `ExplainabilityPanelModule`, а не из вручную собранного test facade.
- Guard chain и route resolution реально участвуют:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `TenantContextService`
  - controller routing с global prefix `/api`

## Что smoke вскрыл в production wiring

- `RaiChatModule` использовал memory-зависимости (`KnowledgeToolsRegistry`, `ExternalSignalsService`), но не импортировал [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts).
- [memory.module.ts](/root/RAI_EP/apps/api/src/shared/memory/memory.module.ts) содержал нестабильные `.js` imports для jest/runtime и не импортировал `AuditModule`, хотя использовал `AuditService`.
- `ExplainabilityPanelModule` зависел от `AutonomyPolicyService` через импорт `RaiChatModule`, но [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts) не экспортировал этот provider.

## Что исправлено по итогам smoke

- [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts) теперь импортирует `MemoryModule`.
- [memory.module.ts](/root/RAI_EP/apps/api/src/shared/memory/memory.module.ts) переведён на стабильные ts-imports и теперь импортирует `AuditModule`.
- [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts) теперь экспортирует `AutonomyPolicyService` для `ExplainabilityPanelModule`.
- Smoke harness использует только точечные infra-shims для нерелевантных тяжёлых модулей (`Satellite/TechMap/Consulting/...`), но не подменяет target feature graph.

## Какие маршруты выбраны и почему

### 1. `GET /api/rai/explainability/queue-pressure`

- Проверяет live observability surface после `S22`.
- Подтверждает, что control tower backend route реально существует и отдаёт queue/backpressure contract по HTTP.

### 2. `GET /api/rai/incidents/feed`

- Проверяет governance/incidents surface.
- Подтверждает tenant-scoped semantics на живом route, а не только `200 OK`.

### 3. `GET /api/rai/agents/config`

- Проверяет governed control-plane read model.
- Подтверждает, что runtime-aware `agents[]` read model доезжает через HTTP surface.

### 4. `POST /api/rai/agents/config/change-requests`

- Проверяет canonical governed write path.
- Подтверждает, что direct production write уже не нужен для control-plane mutation.

### 5. `POST /api/rai/agents/config`

- Negative case на legacy bypass route.
- Подтверждает, что старый imperative path не торчит в live API surface.

## Tenant / governed semantics

- Для `incidents/feed` tenant меняется на `company-b`, и smoke явно проверяет, что сервис вызывается именно с `company-b`.
- Для `agents/config` и `change-requests` smoke проверяет, что companyId идёт из `TenantContextService`, а не из payload.
- Negative case проверяет отсутствие legacy direct-write route в живом приложении.

## Изменённые файлы

- [a_rai-live-api-smoke.spec.ts](/root/RAI_EP/apps/api/test/a_rai-live-api-smoke.spec.ts)
- [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts)
- [memory.module.ts](/root/RAI_EP/apps/api/src/shared/memory/memory.module.ts)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [interagency/INDEX.md](/root/RAI_EP/interagency/INDEX.md)
- [2026-03-07_a_rai-s23_live-api-smoke_report.md](/root/RAI_EP/interagency/reports/2026-03-07_a_rai-s23_live-api-smoke_report.md)

## Верификация

### `tsc --noEmit`

PASS:

```text
pnpm --filter api exec tsc --noEmit
```

### Live API smoke

PASS:

```text
CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles test/a_rai-live-api-smoke.spec.ts
```

Результат:

```text
PASS test/a_rai-live-api-smoke.spec.ts
  A_RAI live API smoke
    ✓ GET /api/rai/explainability/queue-pressure отвечает live observability contract
    ✓ GET /api/rai/incidents/feed соблюдает tenant-scoped semantics на живом HTTP route
    ✓ GET /api/rai/agents/config отдаёт governed control-plane read model по HTTP
    ✓ POST /api/rai/agents/config/change-requests создаёт governed change request по живому HTTP path
    ✓ POST /api/rai/agents/config остаётся закрытым как legacy bypass route
```

## Вывод по readiness

Пункт `Есть smoke tests на живые API маршруты` теперь можно честно поднять в `[x]`.

Ограничение зафиксировано явно: это не full product e2e suite, а минимальный live smoke slice на ключевой Stage 2 API surface. Но для readiness-gap промта этого достаточно, потому что:

- smoke идёт через поднятое приложение и реальный HTTP;
- target routes приходят из реального feature-module graph, а не из вручную собранного controller facade;
- покрыты observability, governance и governed control-plane routes;
- есть negative case на legacy bypass path;
- tenant-scoped semantics проверяются явно.
