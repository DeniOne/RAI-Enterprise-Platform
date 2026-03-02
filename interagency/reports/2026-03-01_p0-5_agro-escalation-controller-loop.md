# REPORT — P0.5 AgroEscalation Controller Loop
Дата: 2026-03-02  
Статус: final  

## Что было целью
- Верифицировать, существует ли реальный backend loop для `AgroEscalation` после commit Agro-события.
- Если loop отсутствует, минимально подключить его в `apps/api` рядом с `agro-events`.
- Доказать тестом, что при `operationDelayDays >= 4` создаётся `AgroEscalation`, а при нулевой задержке не создаётся.

## Что сделано (факты)
- Подтверждён `Decision-ID` `AG-AGRO-ESCALATION-LOOP-001` со статусом `ACCEPTED` в `DECISIONS.log`.
- В `apps/api/src/modules/agro-events` добавлен `AgroEscalationLoopService`.
- Loop подключён в `AgroEventsOrchestratorService` сразу после успешного `commitDraft(...)`.
- Источник `operationDelayDays` реализован детерминированно:
  - берётся `plannedEndTime` из `mapOperation` по `taskRef`;
  - `delayDays = floor(committedAt - plannedEndTime)` в днях, с нижней отсечкой `0`.
- Пороги P0.5 зафиксированы в коде:
  - `S3`, если `delayDays >= 4`
  - `S4`, если `delayDays >= 7`
- Создание `AgroEscalation` выполняется только для `S3/S4` со значениями:
  - `metricKey = "operationDelayDays"`
  - `severity`
  - `reason` как детерминированная строка
  - `references = { eventId, fieldRef, taskRef }`
  - `status = "OPEN"`
- Добавлена минимальная идемпотентность: перед `create` выполняется поиск по `companyId + metricKey` и фильтрация по `references.eventId`, чтобы не плодить дубликаты на один event.
- Tenant isolation соблюдён:
  - loop использует только `committed.companyId`;
  - `payload.companyId` игнорируется и тестом не влияет на tenant scope.
- Добавлены unit-тесты:
  - `agro-escalation-loop.service.spec.ts`
  - расширен `agro-events.orchestrator.service.spec.ts`, чтобы доказать вызов loop после commit.

## Изменённые файлы
- `apps/api/src/modules/agro-events/agro-escalation-loop.service.ts`
- `apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts`
- `apps/api/src/modules/agro-events/agro-events.module.ts`
- `apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts`
- `apps/api/src/modules/agro-events/agro-events.orchestrator.service.spec.ts`
- `apps/api/src/modules/agro-events/agro-events.types.ts`

## Проверки/прогоны
- Команда:
  - `node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand`
- Результат:
  - `PASS src/modules/agro-events/agro-escalation-loop.service.spec.ts`
  - `PASS src/modules/agro-events/agro-events.orchestrator.service.spec.ts`
  - `Tests: 7 passed, 7 total`
- Команда:
  - `node -r ts-node/register/transpile-only -e "require('./src/modules/agro-events/agro-escalation-loop.service.ts'); require('./src/modules/agro-events/agro-events.orchestrator.service.ts'); require('./src/modules/agro-events/agro-events.module.ts')"`
- Результат:
  - завершилась без вывода и без import/runtime ошибок.

## Что сломалось / что не получилось
- Полный интеграционный прогон через реальную БД/HTTP для P0.5 не выполнялся; доказательство собрано на unit-уровне модуля.
- Идемпотентность реализована минимально через чтение существующих `AgroEscalation` по `companyId + metricKey` и фильтрацию `references.eventId` в памяти; отдельного уникального ограничения в Prisma в рамках P0.5 не добавлялось, потому что миграции запрещены scope.

## Следующий шаг
- Внешнее ревью пакета P0.5.
- После `APPROVED` можно обновлять чеклисты / `memory-bank` и только затем рассматривать git-фиксацию по явной команде.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/modules/agro-events/agro-events.module.ts
 M apps/api/src/modules/agro-events/agro-events.orchestrator.service.spec.ts
 M apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts
 M apps/api/src/modules/agro-events/agro-events.types.ts
 M "docs/ANTIGRAVITY SOFTWARE FACTORY — REVIEW PACKET PROMPT.md"
 M interagency/plans/2026-03-01_p0-5_agro-escalation-controller-loop.md
?? apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts
?? apps/api/src/modules/agro-events/agro-escalation-loop.service.ts
```

### git diff
Ключевой tracked diff:
```diff
diff --git a/apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts b/apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts
+import { AgroEscalationLoopService } from "./agro-escalation-loop.service";
+constructor(..., private readonly escalationLoop: AgroEscalationLoopService) {}
+await this.escalationLoop.handleCommittedEvent(result.committed);
```

```diff
diff --git a/apps/api/src/modules/agro-events/agro-events.module.ts b/apps/api/src/modules/agro-events/agro-events.module.ts
+import { AgroEscalationLoopService } from "./agro-escalation-loop.service";
+providers: [AgroEscalationLoopService, ...]
```

Ключевой untracked diff:
```diff
diff --git a/apps/api/src/modules/agro-events/agro-escalation-loop.service.ts b/apps/api/src/modules/agro-events/agro-escalation-loop.service.ts
new file mode 100644
+const METRIC_KEY = "operationDelayDays";
+async handleCommittedEvent(event: AgroEventCommittedRecord): Promise<void> {
+  const operation = await this.prisma.mapOperation.findUnique(...)
+  const delayDays = ...
+  const severity = ...
+  if (severity !== "S3" && severity !== "S4") return;
+  await this.prisma.agroEscalation.create(...)
+}
```

```diff
diff --git a/apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts b/apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts
new file mode 100644
+it("создаёт escalation при delayDays=4 с severity=S3", ...)
+it("не создаёт escalation при delayDays=0", ...)
+it("не берёт tenant из payload, использует только committed.companyId", ...)
```

### Логи прогонов
```text
$ node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand
PASS src/modules/agro-events/agro-escalation-loop.service.spec.ts
[Nest] ... WARN [AgroEscalationLoopService] Agro escalation created: event-1 operationDelayDays=4 S3
[Nest] ... LOG [AgroEventsOrchestratorService] Agro draft committed: draft-1 (30684b5a)
PASS src/modules/agro-events/agro-events.orchestrator.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

```text
$ node -r ts-node/register/transpile-only -e "require('./src/modules/agro-events/agro-escalation-loop.service.ts'); require('./src/modules/agro-events/agro-events.orchestrator.service.ts'); require('./src/modules/agro-events/agro-events.module.ts')"
[no output]
```

### Manual check
- Manual check: FAIL
- Проверено:
  - живой прогон через реальную БД/HTTP не выполнялся;
  - функциональное доказательство собрано через unit-тесты модуля и import/runtime check.

---
## Ревью (Cursor TECHLEAD)
- **Вердикт:** APPROVED
- **Проверки:** CANON/FORBIDDEN/SECURITY_CANON — ок; дифф — секретов нет, companyId только из event.companyId (committed), не из payload; тест-план выполнен (jest 7/7, ts-node import).
- **Ограничение:** живой интеграционный прогон через БД/HTTP не прогнан; negative/security подтверждён unit-тестом. Приёмка с принятием риска.
