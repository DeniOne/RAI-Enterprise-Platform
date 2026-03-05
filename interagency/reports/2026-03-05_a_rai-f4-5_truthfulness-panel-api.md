## Report — 2026-03-05_a_rai-f4-5_truthfulness-panel-api

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md`
- **Scope**: Truthfulness/Quality Panel API (аггрегация BS% и Evidence Coverage по TraceSummary, топ худших трейсов для тенанта), строго READ-ONLY, tenant isolation.

---

## 1. Изменённые файлы

- **Backend (api)**:
  - `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts` — DTO: `TruthfulnessDashboardResponseDto`, `TruthfulnessWorstTraceDto` (avgBsScore, p95BsScore, avgEvidenceCoverage, top-10 worst traces).
  - `apps/api/src/modules/explainability/explainability-panel.service.ts` — метод `getTruthfulnessDashboard(companyId, timeWindowHours)` с агрегацией метрик по `TraceSummary`.
  - `apps/api/src/modules/explainability/explainability-panel.controller.ts` — эндпоинт `GET /rai/explainability/dashboard` с JwtAuthGuard + TenantContext (`companyId` из контекста).
  - `apps/api/src/modules/explainability/explainability-panel.service.spec.ts` — unit-тесты для `getTruthfulnessDashboard` (агрегация, сортировка worst traces, поведение при отсутствии данных).

- **Interagency**:
  - `interagency/INDEX.md` — обновлён статус промта `2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` → READY_FOR_REVIEW.

---

## 2. tsc --noEmit

Команда (запуск из `apps/api`):

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Результат:

- **Exit code**: 0
- **Output**: пустой (ошибок компиляции TypeScript не зафиксировано).

Вывод: типы для новых DTO и сервиса согласованы с текущей кодовой базой, нарушений нет.

---

## 3. Jest — целевые тесты

Команда (запуск из `apps/api`):

```bash
cd apps/api && pnpm test -- --runTestsByPath src/modules/explainability/explainability-panel.service.spec.ts
```

Результат:

- **PASS**: `src/modules/explainability/explainability-panel.service.spec.ts`
- **Suites**: 1 passed / 1 total
- **Tests**: 6 passed / 6 total

Покрытые сценарии:

- **Explainability Timeline (наследовано из f4-1)**:
  - Happy-path агрегации таймлайна по `traceId` (router/tools/composer).
  - `NotFoundException` при отсутствии `AiAuditEntry` по trace.
  - `ForbiddenException` при tenant mismatch.
  - PII-маскирование (`SensitiveDataFilterService`, deepMask) в metadata.

- **Truthfulness Dashboard (новые тесты)**:
  - Корректный расчёт `avgBsScore`, `avgEvidenceCoverage`, `p95BsScore` для трёх `TraceSummary` одного тенанта.
  - Сортировка `worstTraces` по `bsScorePct` по убыванию с лимитом 10; проверка порядка `traceId`.
  - Поведение при отсутствии данных: все агрегаты = `0`, `worstTraces = []`.

---

## 4. Truthfulness Dashboard API — поведение и инварианты

- **API**:
  - `GET /rai/explainability/dashboard?hours=<number>`
  - Guards: `JwtAuthGuard`, tenant из `TenantContextService`.
  - Без `companyId` в tenant-контексте → `400 Security Context: companyId is missing`.
  - Параметр `hours`:
    - парсится как `Number(hours)`;
    - при `<= 0` или `NaN` → `400 Invalid timeWindowHours`;
    - при отсутствии → дефолт `24` (часы).

- **ExplainabilityPanelService.getTruthfulnessDashboard(companyId, timeWindowHours)**:
  - READ-ONLY запрос к `TraceSummary`:
    - `where: { companyId, createdAt: { gte: now - timeWindowHours } }`;
    - `orderBy: { createdAt: "desc" }`.
  - При отсутствии записей:
    - `avgBsScore = 0`;
    - `p95BsScore = 0`;
    - `avgEvidenceCoverage = 0`;
    - `worstTraces = []`.
  - При наличии записей:
    - `avgBsScore` = среднее `bsScorePct` по трейсам (0–100).
    - `p95BsScore` = 95-й персентиль `bsScorePct` (по отсортированному массиву по возрастанию).
    - `avgEvidenceCoverage` = среднее `evidenceCoveragePct`.
    - `worstTraces`:
      - сортировка по `bsScorePct` по убыванию;
      - срез топ-10;
      - для каждого трейса: `traceId`, `bsScorePct`, `evidenceCoveragePct`, `invalidClaimsPct`, `createdAt` (ISO-строка).

- **Безопасность и изоляция**:
  - Агрегация строго по `companyId` из `TenantContextService` (мультитенантность соблюдена).
  - API слой и сервис не создают и не модифицируют записи (строгий READ-ONLY поверх `TraceSummary`).
  - Используются только поля, уже собранные Truthfulness Engine (`bsScorePct`, `evidenceCoveragePct`, `invalidClaimsPct`), без прямого обращения к Evidence/Claims.

---

## 5. Smoke-проверка (логика)

- Протокол:
  - Через unit-тесты смоделированы:
    - 3 трейса одного тенанта с разными BS%/Evidence → проверка расчёта агрегатов и порядка worst traces.
    - Пустой результат `TraceSummary.findMany` → корректный "нулевой" дэшборд.
  - Tenant isolation дополнительно следует из `where: { companyId }` в Prisma-запросе и guard слоя.
- Вывод:
  - Truthfulness Dashboard API корректно отображает агрегированные метрики честности (`BS%`) и покрытие evidence для конкретного тенанта за заданное окно времени, не нарушает Security Canon (tenant isolation, READ-ONLY), и готов к интеграции во фронтовый Truthfulness/Quality Panel.

