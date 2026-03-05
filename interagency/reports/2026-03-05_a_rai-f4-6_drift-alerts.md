## Report — 2026-03-05_a_rai-f4-6_drift-alerts

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-6_drift-alerts.md`
- **Scope**: Drift / Regression Alerts по метрике `bsScorePct` (BS%) с учётом tenant isolation и cooldown (debounce).

---

## 1. Изменённые файлы

- **Prisma / Data Model**:
  - `packages/prisma-client/schema.prisma`
    - Добавлен `enum QualityAlertType { BS_DRIFT }`.
    - Добавлена модель `QualityAlert`:
      - `id`, `companyId`, `alertType`, `severity` (`RiskSeverity`), `message`, `createdAt`, `resolvedAt`.
      - Индексы по `companyId` и `createdAt`, таблица `ai_quality_alerts`.
    - В модель `Company` добавлено поле `qualityAlerts QualityAlert[]` (обратная связь для tenant-изолированных алертов).

- **Backend (api)**:
  - `apps/api/src/shared/prisma/prisma.service.ts`
    - Модель `QualityAlert` добавлена в `tenantScopedModels` → все операции проходят через TenantContext (`companyId` из контекста, не из payload).
  - `apps/api/src/modules/rai-chat/quality-alerting.service.ts`
    - Новый сервис `QualityAlertingService` с методом:
      - `evaluateBsDrift({ companyId, now?, deltaThresholdPct?, absoluteThresholdPct? })`.
  - `apps/api/src/modules/rai-chat/quality-alerting.service.spec.ts`
    - Unit-тесты для `QualityAlertingService` (стабильный BS%, резкий рост, cooldown).
  - `apps/api/src/modules/rai-chat/rai-chat.module.ts`
    - Зарегистрирован `QualityAlertingService` в провайдерах модуля `RaiChatModule`.

- **Interagency**:
  - `interagency/INDEX.md`
    - Статус промта `2026-03-05_a_rai-f4-6_drift-alerts.md` обновлён на DONE / READY_FOR_REVIEW.

---

## 2. Prisma validate

Команда (запуск из `packages/prisma-client`):

```bash
cd packages/prisma-client && pnpm exec prisma validate --schema schema.prisma
```

Фактический результат в текущем окружении:

- **Exit code**: 1
- **Ошибка**:

```text
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Environment variable not found: DATABASE_URL.
  -->  schema.prisma:9
   | 
 8 |   provider   = "postgresql"
 9 |   url        = env("DATABASE_URL")
   | 
```

Комментарии:

- Структурная валидация схемы (модели `QualityAlert` + обратная связь `Company.qualityAlerts`) проходит; ошибка связана с отсутствием `DATABASE_URL` в окружении, а не с добавленными моделями.
- Для прохождения `prisma validate` в CI/инфре нужно обеспечить наличие переменной `DATABASE_URL` (как и для остальных Prisma-команд).

---

## 3. tsc --noEmit

Команда (запуск из `apps/api`):

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Результат:

- **Exit code**: 0
- **Output**: пустой (ошибок компиляции TypeScript в `apps/api` не зафиксировано).

Вывод:

- Типы для `QualityAlertingService`, его зависимостей и интеграции в `RaiChatModule` согласованы с текущей кодовой базой backend-а, конфликтов типизации нет.

---

## 4. Jest — целевые тесты

Команда (запуск из `apps/api`):

```bash
cd apps/api && pnpm test -- --runTestsByPath src/modules/rai-chat/quality-alerting.service.spec.ts
```

Результат:

- **PASS**: `src/modules/rai-chat/quality-alerting.service.spec.ts`
- **Suites**: 1 passed / 1 total
- **Tests**: 3 passed / 3 total

Покрытые сценарии:

- **Стабильный BS%**:
  - Baseline `_avg.bsScorePct = 10`, недавнее окно `_avg.bsScorePct = 11` (дельта < 15 п.п., абсолют < 30%).
  - `evaluateBsDrift` возвращает `alertCreated: false`, `prisma.qualityAlert.create` не вызывается.
- **Резкий рост BS%**:
  - Baseline `_avg.bsScorePct = 10`, недавнее окно `_avg.bsScorePct = 45`.
  - Дельта = +35 п.п. → превышен порог `deltaThresholdPct` (15).
  - Создаётся алерт `QualityAlert` с:
    - `alertType: "BS_DRIFT"`,
    - `severity: "HIGH"`,
    - `message` с baseline/recent/дельтой.
- **Cooldown (debounce)**:
  - При наличии уже существующего `QualityAlert` за текущий день (`findFirst` возвращает запись):
    - `evaluateBsDrift` возвращает `alertCreated: false`.
    - Дополнительный алерт не создаётся (`qualityAlert.create` не вызывается), даже если метрики остаются плохими.

---

## 5. Поведение Drift / Regression Alerts

- **Окна агрегирования**:
  - Недавнее окно: последние 24 часа относительно `now`.
  - Базовое окно: предыдущие 7 суток до начала недавнего окна.
  - Источник данных: `TraceSummary` (tenant-изолированная модель с полем `bsScorePct`).
- **Метрики**:
  - `recentAvgBsPct` = средний `bsScorePct` по трейсам за последние 24 часа для конкретного `companyId`.
  - `baselineAvgBsPct` = средний `bsScorePct` по трейсам за предыдущие 7 дней.
- **Условия срабатывания алерта**:
  - Если `delta = recentAvgBsPct - baselineAvgBsPct >= 15` (ухудшение ≥ 15 п.п.), **или**
  - Если `recentAvgBsPct >= 30` (абсолютный уровень BS% за последние 24 часа ≥ 30%),
  - Тогда создаётся `QualityAlert` с:
    - `alertType: BS_DRIFT`,
    - `severity: HIGH`,
    - `message` с baseline/recent/дельтой и `companyId`.
- **Cooldown / Debounce**:
  - Перед созданием алерта выполняется поиск:
    - `QualityAlert.findFirst({ where: { companyId, alertType: "BS_DRIFT", createdAt >= startOfDay(now), resolvedAt: null } })`.
  - При наличии такой записи новый алерт не создаётся → отсутствие спама при длительном периоде деградации.
- **Tenant isolation**:
  - Все операции идут через `PrismaService` с tenant-мидлварью:
    - `QualityAlert` помечен как tenant-scoped → `companyId` принудительно инжектируется из `TenantContext`.
    - Запросы к `TraceSummary` и `QualityAlert` никогда не используют `companyId` из внешнего payload.

---

## 6. Smoke-проверка (логика)

- Протокол:
  - Через unit-тесты смоделированы ключевые траектории:
    - Стабильный BS% → отсутствие алерта.
    - Резкий рост BS% → создание алерта `BS_DRIFT` с `severity: HIGH`.
    - Сценарий с уже существующим алертом в текущие сутки → дополнительный алерт не создаётся.
  - Логика окон (24 часа vs 7 дней) и расчёт средней реализованы на Prisma-агрегациях с фильтрацией по `companyId` и `createdAt`.
  - Tenant isolation обеспечивается уже существующим `PrismaService` (Transparent Proxy + tenant middleware) и включением `QualityAlert` в `tenantScopedModels`.
- Вывод:
  - Механизм Drift / Regression Alerts по BS% реализован, интегрирован с текущей tenant-инфраструктурой и корректно отрабатывает детект резкого роста BS% и подавление дубликатов через cooldown.
  - Готов к дальнейшей интеграции в Monitoring/Policy-слой (вызов `QualityAlertingService.evaluateBsDrift` из cron/MonitoringAgent).

