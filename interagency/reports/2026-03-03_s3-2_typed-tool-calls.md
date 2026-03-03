# REPORT — S3.2 Typed Tool Calls only
Дата: 2026-03-03  
Статус: final  

## Что было целью
- Зацементировать law `Typed Tool Calls only` для `RAI Chat`.
- Усилить forensic-логирование `RaiToolsRegistry`, чтобы payload каждого вызова попадал в лог при success и fail.
- Подтвердить тестами, что публичный typed gateway остаётся `execute(...)`.

## Что сделано (факты)
- В [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts) обновлён `logToolCall(...)`:
  - payload теперь включается в forensic JSON;
  - логирование работает на ветках `tool_not_registered`, `validation_failed`, `handler_failed`, `success`;
  - добавлена безопасная сериализация payload через `serializePayload(...)`.
- `execute(...)` сохранён как единственный публичный путь исполнения инструмента с Joi-валидацией.
- Бизнес-логика инструментов `echo_message` и `workspace_snapshot` не менялась.
- В [rai-tools.registry.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts) добавлены и обновлены тесты:
  - success-log содержит payload,
  - validation failure log содержит невалидный payload,
  - handler failure log содержит payload и `reason`.

## Изменённые файлы
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `interagency/plans/2026-03-03_s3-2_typed-tool-calls.md`
- `interagency/reports/2026-03-03_s3-2_typed-tool-calls.md`
- `interagency/INDEX.md`

## Проверки/прогоны
- `pnpm --dir /root/RAI_EP/apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts` -> PASS
- `pnpm --dir /root/RAI_EP/apps/api exec tsc -p tsconfig.json --noEmit` -> PASS

## Что сломалось / что не получилось
- Manual check не требовался и не выполнялся.
- Отдельный persistent audit через `AuditService` не добавлялся: scope задачи ограничен forensic-логированием `Logger` внутри реестра.

## Что сделано дополнительно
- Добавлена защита на случай несереализуемого payload: в лог попадает маркер `"[unserializable_payload]"`, а не падение логирования.
- Forensic JSON остаётся детерминированным и включает `toolName`, `companyId`, `traceId`, `status`, `payload`, `reason`.

## Следующий шаг
- Передать пакет на внешнее ревью.
- После ревью синхронизировать статус задачи и execution-чеклисты по факту принятия.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts
 M apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts
 M interagency/INDEX.md
?? interagency/plans/2026-03-03_s3-2_typed-tool-calls.md
```

### git diff
```diff
diff --git a/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts b/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts
+      this.logToolCall(name, actorContext, false, payload, "tool_not_registered");
+      this.logToolCall(name, actorContext, false, payload, "validation_failed");
+      this.logToolCall(name, actorContext, true, validation.value);
+      this.logToolCall(name, actorContext, false, validation.value, "handler_failed");
+      payload: this.serializePayload(payload),
+  private serializePayload(payload: unknown): unknown { ... }

diff --git a/apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts b/apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts
+    expect(warnSpy).toHaveBeenCalledWith(
+      expect.stringContaining('"payload":{"wrong":true}'),
+    );
+    expect(logSpy).toHaveBeenCalledWith(
+      expect.stringContaining('"payload":{"route":"/tasks","lastUserAction":"open-task"}'),
+    );
+  it("logs payload when handler execution fails", async () => { ... })
```

### Логи прогонов
```text
$ pnpm --dir /root/RAI_EP/apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts
[Nest] ... LOG [RaiToolsRegistry] {"toolName":"echo_message","companyId":"company-1","traceId":"trace-1","status":"success","payload":{"message":"hello"}}
PASS src/modules/rai-chat/tools/rai-tools.registry.spec.ts
  RaiToolsRegistry
    ✓ executes a registered tool with a valid payload
    ✓ rejects invalid payload and does not execute the handler
    ✓ logs every successful tool call
    ✓ logs payload when handler execution fails

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total

$ pnpm --dir /root/RAI_EP/apps/api exec tsc -p tsconfig.json --noEmit
PASS
```
