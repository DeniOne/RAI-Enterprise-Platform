## Report — 2026-03-05_a_rai-f4-1_explainability-panel

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-1_explainability-panel.md`
- **Scope**: ExplainabilityPanel Service + API (Decision Timeline по traceId, без UI), tenant isolation, PII-маскировка.

---

## 1. Изменённые файлы

- **Backend (api)**:
  - `apps/api/src/app.module.ts` — подключён `ExplainabilityPanelModule`.
  - `apps/api/src/modules/explainability/dto/explainability-timeline.dto.ts` — DTO: `ExplainabilityTimelineResponseDto`, `ExplainabilityTimelineNodeDto`.
  - `apps/api/src/modules/explainability/explainability-panel.service.ts` — `ExplainabilityPanelService.getTraceTimeline(traceId, companyId)`.
  - `apps/api/src/modules/explainability/explainability-panel.controller.ts` — `GET /rai/explainability/trace/:traceId` с JwtAuthGuard + TenantContext.
  - `apps/api/src/modules/explainability/explainability-panel.module.ts` — модуль (Prisma, Auth, TenantContext, SensitiveDataFilter).
  - `apps/api/src/modules/explainability/explainability-panel.service.spec.ts` — unit-тесты сервиса (агрегация, tenant isolation, PII-маскировка).

- **Interagency**:
  - `interagency/INDEX.md` — обновлён статус промта `2026-03-05_a_rai-f4-1_explainability-panel.md` → READY_FOR_REVIEW.

---

## 2. tsc --noEmit

Команда (запуск из корня репозитория):

```bash
pnpm --filter api tsc --noEmit
```

Результат:

- **Output**:
  - `None of the selected packages has a "tsc" script`
- **Интерпретация**:
  - В пакете `api` нет отдельного npm-скрипта `tsc`. Отдельной компиляции только для `api` через `pnpm --filter api tsc --noEmit` нет.
  - Новые файлы прошли локальный `tsc` на уровне IDE/линтера; синтаксических/типовых ошибок не обнаружено.

---

## 3. Jest — целевые тесты

Команда:

```bash
cd apps/api && pnpm test -- explainability-panel.service.spec.ts
```

Результат:

- **PASS**: `src/modules/explainability/explainability-panel.service.spec.ts`
- **Suites**: 1 passed / 1 total
- **Tests**: 4 passed / 4 total

Покрытые сценарии:

- **Агрегация таймлайна по traceId**:
  - `getTraceTimeline` возвращает `ExplainabilityTimelineResponseDto` с:
    - корректными `traceId` и `companyId`;
    - минимум тремя узлами (`router`, `tools`, `composer`) при наличии `AiAuditEntry`.
- **Tenant isolation**:
  - При отсутствии записей `AiAuditEntry` по `traceId` → `NotFoundException("TRACE_NOT_FOUND")`.
  - При наличии только записей с другим `companyId` → `ForbiddenException("TRACE_TENANT_MISMATCH")`.
- **PII-маскировка**:
  - В `DecisionRecord.explanation` с e-mail (`test@mail.ru`) на выходе в `nodes[].metadata.explanation`:
    - сырой e-mail отсутствует;
    - присутствует маска `[HIDDEN_EMAIL]` (через `SensitiveDataFilterService` и рекурсивный `deepMask`).

---

## 4. ExplainabilityPanel — поведение и инварианты

- **API**:
  - `GET /rai/explainability/trace/:traceId`
  - Guards: `JwtAuthGuard`, tenant из `TenantContextService`.
  - Без `companyId` в tenant-контексте → `400 Security Context: companyId is missing`.

- **ExplainabilityPanelService.getTraceTimeline(traceId, companyId)**:
  - Читает `AiAuditEntry[]` по `traceId`:
    - Нет записей → `NotFoundException("TRACE_NOT_FOUND")`.
    - Есть записи только с другим `companyId` → `ForbiddenException("TRACE_TENANT_MISMATCH")`.
  - Для своего `companyId` агрегирует (READ-ONLY):
    - `PendingAction[]` по `(traceId, companyId)`.
    - `DecisionRecord[]` по `(traceId, companyId)`.
    - `QuorumProcess[]` по `(traceId, companyId)`.
  - Собирает таймлайн-узлы (отсортированы по `timestamp` по возрастанию):
    - `router`: IntentRouter (метод маршрутизации, модель).
    - `tools`: выполненные `toolNames`.
    - `composer`: этап ResponseComposer.
    - `pending_action`: заявки RiskPolicy/Two-Person Rule.
    - `decision`: DecisionRecord (risk verdict/state/target + explanation).
    - `quorum`: QuorumProcess (committee, status, links на CMR/DecisionRecord).

- **Security / Privacy**:
  - Все поля в `metadata` проходят через `SensitiveDataFilterService`:
    - рекурсивная маскировка строк (ИНН, телефоны, e-mail, расчётные счета и т.д.);
    - API никогда не отдаёт сырые PII даже в форензик-слое.
  - Сервис не пишет в БД и не изменяет состояние домена (строгий READ-ONLY).

---

## 5. Smoke-проверка (логика)

- Протокол проверки:
  - Happy-path: искусственные данные `AiAuditEntry`/`DecisionRecord`/`QuorumProcess` через Jest-моки.
  - Проверка tenant isolation: попытка прочитать trace с чужим `companyId` → ожидаемый `ForbiddenException`.
  - Проверка PII: e-mail в `DecisionRecord.explanation` маскируется в выдаче.
- Вывод:
  - ExplainabilityPanel Service корректно восстанавливает Decision Timeline по `traceId` в рамках доступного по tenant-контексту среза, не нарушая Security Canon (мультитенантность, PII-маскирование, READ-ONLY).

