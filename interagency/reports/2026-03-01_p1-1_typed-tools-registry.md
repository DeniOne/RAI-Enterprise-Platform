# REPORT — Typed tools registry и строгие схемы вызовов
Дата: 2026-03-02  
Статус: final  

## Что было целью
- Реализовать P1.1 в `apps/api`: typed-only registry инструментов для `rai-chat` со строгой схемной валидацией payload, логированием каждого вызова и без `any[]` в критичном контуре tool payload.

## Что сделано (факты)
- Добавлен `AG-TYPED-TOOLS-REGISTRY-001` со статусом `ACCEPTED` в `DECISIONS.log`.
- В `apps/api/src/modules/rai-chat/tools/` создан typed registry `RaiToolsRegistry` на `joi` с контрактом register/execute, whitelist-регистрацией инструментов и отказом для незарегистрированного имени или невалидного payload.
- Зарегистрированы 2 инструмента: `echo_message` и `workspace_snapshot`.
- Введён сервисный слой `RaiChatService`; контроллер `rai-chat` больше не собирает ответ вручную и делегирует исполнение в сервис.
- DTO `rai-chat` расширены типизированными `toolCalls` и `suggestedActions`; `widgets[].payload` переведён с `any` на `Record<string, unknown>`.
- Tenant-контракт сохранён: `companyId` для исполнения и логирования берётся только из `TenantContextService`, не из payload инструмента.
- Добавлены unit-тесты на validate/execute/logging и на интеграцию сервиса `rai-chat` с typed tool execution.

## Изменённые файлы
- `DECISIONS.log`
- `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
- `apps/api/src/modules/rai-chat/rai-chat.controller.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`
- `interagency/INDEX.md`
- `interagency/plans/2026-03-01_p1-1_typed-tools-registry.md`
- `interagency/prompts/2026-03-01_p1-1_typed-tools-registry.md`

## Проверки/прогоны
- `npx jest --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts` -> PASS, 3 tests passed.
- `npx jest --runInBand src/modules/rai-chat/rai-chat.service.spec.ts` -> PASS, 1 test passed.
- `pnpm --filter api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` -> FAIL, процесс завершён `137` на уровне workspace runner; прямой запуск `jest` в `apps/api` прошёл успешно.
- Manual check: PASS. Проверено, что `companyId` не читается из payload tool call и в `RaiChatController` по-прежнему берётся только из `TenantContextService`.

## Что сломалось / что не получилось
- Не выполнен стабильный прогон через `pnpm --filter api test ...`: процесс был убит кодом `137`, поэтому для фактической верификации использован прямой `npx jest` внутри `apps/api`.
- `interagency/INDEX.md` до сборки review packet содержал статус `ACCEPTED`; по канону review packet он переведён в `READY_FOR_REVIEW`.
- Главные чеклисты и `memory-bank` не обновлялись, поскольку это запрещено до внешнего ревью.

## Следующий шаг
- Внешнее ревью через `docs/CURSOR SOFTWARE FACTORY — REVIEW & FINALIZE PROMPT.md`.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts
 M apps/api/src/modules/rai-chat/rai-chat.controller.ts
 M apps/api/src/modules/rai-chat/rai-chat.module.ts
 M "docs/ANTIGRAVITY SOFTWARE FACTORY — REVIEW PACKET PROMPT.md"
 M interagency/INDEX.md
?? apps/api/src/modules/rai-chat/rai-chat.service.spec.ts
?? apps/api/src/modules/rai-chat/rai-chat.service.ts
?? apps/api/src/modules/rai-chat/tools/
?? interagency/plans/2026-03-01_p1-1_typed-tools-registry.md
?? interagency/prompts/2026-03-01_p1-1_typed-tools-registry.md
?? interagency/reports/2026-03-01_p1-1_typed-tools-registry.md
```

### git diff (ключевые файлы и фрагменты)
```diff
diff --git a/DECISIONS.log b/DECISIONS.log
+## AG-TYPED-TOOLS-REGISTRY-001
+**Статус:** ACCEPTED
+### Решение
+Разрешить введение в `apps/api` реестра инструментов (ToolsRegistry) со строгой схемной валидацией payload, типизированным исполнением и обязательным логированием вызовов.

diff --git a/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts b/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts
+import { RaiSuggestedAction, RaiToolName } from "../tools/rai-tools.types";
+export class RaiToolCallDto {
+  @IsEnum(RaiToolName)
+  name: RaiToolName;
+  @IsObject()
+  payload: Record<string, unknown>;
+}
+toolCalls?: RaiToolCallDto[];
+payload: Record<string, unknown>;
+suggestedActions?: RaiSuggestedAction[];

diff --git a/apps/api/src/modules/rai-chat/rai-chat.controller.ts b/apps/api/src/modules/rai-chat/rai-chat.controller.ts
+import { RaiChatService } from "./rai-chat.service";
+return this.raiChatService.handleChat(body, companyId);

diff --git a/apps/api/src/modules/rai-chat/rai-chat.module.ts b/apps/api/src/modules/rai-chat/rai-chat.module.ts
+import { RaiChatService } from "./rai-chat.service";
+import { RaiToolsRegistry } from "./tools/rai-tools.registry";
+providers: [RaiChatService, RaiToolsRegistry],
```

### Логи прогонов
```text
$ npx jest --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts
[Nest] 983520  - 03/02/2026, 12:26:53 AM     LOG [RaiToolsRegistry] {"toolName":"echo_message","companyId":"company-1","traceId":"trace-1","status":"success"}
PASS src/modules/rai-chat/tools/rai-tools.registry.spec.ts (8.105 s)
  RaiToolsRegistry
    ✓ executes a registered tool with a valid payload (62 ms)
    ✓ rejects invalid payload and does not execute the handler (20 ms)
    ✓ logs every successful tool call (17 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total

$ npx jest --runInBand src/modules/rai-chat/rai-chat.service.spec.ts
PASS src/modules/rai-chat/rai-chat.service.spec.ts (8.544 s)
  RaiChatService
    ✓ returns typed suggested actions and tool execution results (27 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total

$ pnpm --filter api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
Exit status 137
```

---
## Ревью (Cursor TECHLEAD)
- **Вердикт:** APPROVED
- **Проверки:** CANON/FORBIDDEN/SECURITY_CANON — ок; companyId только из TenantContextService, не из payload; тест-план выполнен (jest: registry 3/3, service 1/1).
- **Ограничение:** pnpm --filter api test завершился с 137; приёмка при доказательстве через прямой jest в apps/api.
