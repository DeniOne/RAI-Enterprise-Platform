# REPORT — P0.3 Agro Telegram Draft→Commit
Дата: 2026-03-01  
Статус: DONE  

## Ревью (Cursor): APPROVED
- Security/CANON/FORBIDDEN: нарушений не обнаружено в рамках модуля `agro-events`.
- Tenant isolation: `companyId` не принимается из payload; actor собирается из `@CurrentUser()` (исправлено: `id`/`userId`).
- Тест-план: MUST-gate закрыт воспроизводимым unit-прогоном через изолированный jest-config (основной jest-конфиг проекта в этом окружении ранее падал `Killed (137)`).

## Что было целью
- Перенести боевой контур Agro `Draft -> Fix/Link -> Confirm -> Commit` из `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` в `apps/api/src/modules/agro-events/*`.
- Реализовать backend-модуль `apps/api` с MUST-gate, tenant-safe контекстом и `provenanceHash`.
- Подключить модуль в `AppModule` и добавить тесты на MUST-gate.

## Что сделано (факты)
- Создан новый модуль `apps/api/src/modules/agro-events/*` с контроллером, DTO, сервисом, оркестратором, репозиторием, validator и типами.
- Реализованы операции:
  - `POST /api/agro-events/drafts`
  - `POST /api/agro-events/fix`
  - `POST /api/agro-events/link`
  - `POST /api/agro-events/confirm`
  - `POST /api/agro-events/commit`
- `companyId` и `userId` берутся только из `@CurrentUser()`; из payload не читаются.
- MUST-gate реализован в оркестраторе:
  - commit запрещён при непустом `missingMust[]`,
  - `link()`/`fix()` перевычисляют MUST и переводят draft в `READY_FOR_CONFIRM`,
  - `confirm()` при пустом MUST выполняет commit.
- `provenanceHash` реализован детерминированно через каноническую сериализацию JSON + `sha256`.
- Модуль подключён в `apps/api/src/app.module.ts`.
- Добавлен unit-spec `agro-events.orchestrator.service.spec.ts` для MUST-gate сценариев.

## Изменённые файлы
- `apps/api/src/app.module.ts`
- `apps/api/jest.agro-events.config.js`
- `apps/api/tsconfig.agro-events.spec.json`
- `apps/api/src/modules/agro-events/agro-events.controller.ts`
- `apps/api/src/modules/agro-events/agro-events.module.ts`
- `apps/api/src/modules/agro-events/agro-events.orchestrator.service.spec.ts`
- `apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts`
- `apps/api/src/modules/agro-events/agro-events.repository.ts`
- `apps/api/src/modules/agro-events/agro-events.service.ts`
- `apps/api/src/modules/agro-events/agro-events.types.ts`
- `apps/api/src/modules/agro-events/agro-events.validator.ts`
- `apps/api/src/modules/agro-events/dto/agro-events.dto.ts`

## Проверки/прогоны
- Команда:
  - `npx jest --runTestsByPath src/modules/agro-events/agro-events.orchestrator.service.spec.ts --runInBand`
- Результат:
  - первый прогон выявил дефект интеропа `fast-json-stable-stringify is not a function`;
  - после исправления раннер `jest` в этом окружении дважды завершался с `Killed` (code 137), без финального отчёта по assertions.
- Команда:
  - `node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand`
- Результат:
  - `PASS src/modules/agro-events/agro-events.orchestrator.service.spec.ts`
  - `Tests: 4 passed, 4 total`
  - `Test Suites: 1 passed, 1 total`
- Команда:
  - `node -r ts-node/register/transpile-only -e "require('./src/modules/agro-events/agro-events.orchestrator.service.ts')"`
  - `node -r ts-node/register/transpile-only -e "require('./src/modules/agro-events/agro-events.repository.ts')"`
  - `node -r ts-node/register/transpile-only -e "require('./src/modules/agro-events/agro-events.controller.ts')"`
  - `node -r ts-node/register/transpile-only -e "require('./src/modules/agro-events/agro-events.module.ts')"`
- Результат:
  - новые файлы модуля загружаются без runtime/import ошибок.
- Команда:
  - ручной `ts-node`-прогон MUST-gate сценариев
- Результат:
  - `manual-check: agro-events MUST-gate scenarios passed`

## Что сломалось / что не получилось
- Базовый общий `jest`-конфиг проекта для этого spec-файла в текущем окружении завершался `Killed (137)`.
- Для воспроизводимого тестового прогона потребовался изолированный config `apps/api/jest.agro-events.config.js` и узкий `tsconfig.agro-events.spec.json`, исключающий `docs/**/*.ts` и лишний coverage scope.
- Полный `tsc --noEmit` по `apps/api` остаётся неиндикативным для этой задачи, потому что в репозитории уже есть внешние ошибки в `commerce/*` и `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/api/event-actions.service.spec.ts`.

## Следующий шаг
- Внешнее ревью пакета изменений.
- Опционально: либо интегрировать изолированный `jest.agro-events.config.js` в инженерный toolbox, либо позже унифицировать основной test-config проекта, чтобы одиночные module-spec не тянули `docs/**/*.ts`.
- Следующий функциональный шаг по roadmap: P0.4, подключение `apps/telegram-bot` к новым endpoint’ам `agro-events`.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/app.module.ts
 M "docs/ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md"
 M interagency/INDEX.md
?? apps/api/src/modules/agro-events/
?? "docs/CURSOR SOFTWARE FACTORY — STARTER PROMPT.md"
?? interagency/plans/2026-03-01_p0-3_agro-telegram-draft-commit.md
?? interagency/plans/2026-03-01_p0-4_telegram-bot-draft-commit.md
?? interagency/prompts/2026-03-01_p0-3_agro-telegram-draft-commit.md
?? interagency/prompts/2026-03-01_p0-4_telegram-bot-draft-commit.md
```

### git diff
Ключевой tracked diff:
```diff
diff --git a/apps/api/src/app.module.ts b/apps/api/src/app.module.ts
index fa9c91d6..9ebb9211 100644
--- a/apps/api/src/app.module.ts
+++ b/apps/api/src/app.module.ts
@@ -47,6 +47,7 @@ import { HttpResilienceModule } from "./shared/http/http-resilience.module";
 import { BullModule } from "@nestjs/bullmq";
 import { join } from "path";
 import { RaiChatModule } from "./modules/rai-chat/rai-chat.module";
+import { AgroEventsModule } from "./modules/agro-events/agro-events.module";
@@ -127,6 +128,7 @@ import { TenantContextModule } from "./shared/tenant-context/tenant-context.modu
     CommerceModule,
     ExplorationModule,
     RaiChatModule,
+    AgroEventsModule,
     HttpResilienceModule,
```

Ключевой untracked diff-фрагмент:
```diff
diff --git a/root/RAI_EP/apps/api/src/modules/agro-events/agro-events.controller.ts b/root/RAI_EP/apps/api/src/modules/agro-events/agro-events.controller.ts
new file mode 100644
--- /dev/null
+++ b/root/RAI_EP/apps/api/src/modules/agro-events/agro-events.controller.ts
@@ -0,0 +1,48 @@
+@Controller("agro-events")
+@UseGuards(JwtAuthGuard)
+export class AgroEventsController {
+  @Post("drafts")
+  @Post("fix")
+  @Post("link")
+  @Post("confirm")
+  @Post("commit")
+}
```

```diff
diff --git a/root/RAI_EP/apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts b/root/RAI_EP/apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts
new file mode 100644
--- /dev/null
+++ b/root/RAI_EP/apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts
@@ -183,6 +183,22 @@ export class AgroEventsOrchestratorService {
+  async commit(actor: AgroEventsActorContext, dto: CommitAgroEventDto) {
+    const draft = await this.repository.getDraft(
+      actor.companyId,
+      actor.userId,
+      dto.draftId,
+    );
+    const missingMust = this.validator.validateMust(draft);
+    if (missingMust.length > 0) {
+      await this.repository.updateDraft(...);
+      throw new BadRequestException(
+        "Commit запрещён: MUST-поля заполнены не полностью",
+      );
+    }
+    const provenanceHash = this.buildProvenanceHash(draft);
+    const result = await this.repository.commitDraft({ ... });
+    return { draft: result.draft, committed: result.committed, ui: ... };
+  }
```

Полный diff новых файлов слишком объёмен; он покрывает добавление 9 новых файлов модуля `agro-events` плюс spec-файл MUST-gate.

### Логи прогонов
```text
$ npx jest --runTestsByPath src/modules/agro-events/agro-events.orchestrator.service.spec.ts --runInBand
Killed
```

```text
$ NODE_OPTIONS='--max-old-space-size=2048' npx jest --runTestsByPath src/modules/agro-events/agro-events.orchestrator.service.spec.ts --runInBand --no-cache --logHeapUsage
Killed
```

```text
$ node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand
ts-jest[config] (WARN)
The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0.
[Nest] ... LOG [AgroEventsOrchestratorService] Agro draft committed: draft-1 (30684b5a)
PASS src/modules/agro-events/agro-events.orchestrator.service.spec.ts
  AgroEventsOrchestratorService
    ✓ confirm() не вызывает commit при непустом missingMust
    ✓ link() переводит draft в READY_FOR_CONFIRM при закрытии MUST
    ✓ confirm() при пустом MUST создаёт committed и переводит draft в COMMITTED
    ✓ commit() бросает ошибку при непустом MUST

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Ran all test suites.
```

```text
$ node -r ts-node/register/transpile-only <manual-check>
[Nest] ... LOG [AgroEventsOrchestratorService] Agro draft committed: draft-1 (30684b5a)
manual-check: agro-events MUST-gate scenarios passed
```

### Manual check
- Manual check: PASS
- Проверено:
  - `confirm()` не вызывает commit при непустом MUST;
  - `confirm()` при пустом MUST переводит draft в `COMMITTED` и создаёт `provenanceHash`;
  - `commit()` бросает ошибку при непустом MUST.

## Честный вывод по статусу
- Код и DoD по MUST-gate теперь подтверждены воспроизводимым `PASS`-логом для одного spec-файла.
- Слабое место остаётся не в функциональности модуля, а в тяжёлом общем `jest`-конфиге проекта; для проверки использован изолированный config.
