# REPORT — S4.1 Chat Widget Logic
Дата: 2026-03-03  
Статус: final  

## Что было целью
- Перевести формирование `widgets[]` из `RaiChatService` со статической заглушки на динамический context-aware слой.
- Изолировать widget logic в отдельный builder.
- Подтвердить тестами, что виджеты реально меняются при смене `route` и `companyId`.

## Что сделано (факты)
- Добавлен [rai-chat-widget-builder.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts), который формирует `DeviationList` и `TaskBacklog` на основе:
  - `companyId`
  - `workspaceContext.route`
  - `workspaceContext.selectedRowSummary`
  - `workspaceContext.lastUserAction`
- В [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts) builder зарегистрирован как provider.
- В [rai-chat.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.ts) удалена встроенная `buildWidgets(...)`; сервис теперь делегирует формирование виджетов builder'у.
- В [rai-chat.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.spec.ts):
  - обновлены ожидания на динамические `title` виджетов;
  - добавлен отдельный тест, который подтверждает изменение виджетов при смене `route` и `companyId`.

## Изменённые файлы
- `apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`
- `interagency/plans/2026-03-03_s4-1_chat-widget-logic.md`
- `interagency/reports/2026-03-03_s4-1_chat-widget-logic.md`
- `interagency/INDEX.md`

## Проверки/прогоны
- `pnpm --dir /root/RAI_EP/apps/api test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts` -> PASS
- `pnpm --dir /root/RAI_EP/apps/api exec tsc -p tsconfig.json --noEmit` -> PASS

## Что сломалось / что не получилось
- Реальные domain services (`TasksService`, `DeviationsService`) не подключались: текущая реализация оставляет extension-point, но использует context-aware mock `v2`.
- Manual check не требовался и не выполнялся.

## Что сделано дополнительно
- Builder использует не только `route`, но и `selectedRowSummary`/`lastUserAction`, чтобы заглушки были ближе к будущей доменной интеграции.
- Сервис чата стал проще: orchestration и widget assembly теперь разделены.

## Ревью: APPROVED
- **Дата ревью:** 2026-03-03
- **Вердикт:** APPROVED
- **Замечания:** Динамика виджетов проверена через `rai-chat.service.spec.ts`. Security policy соблюдена (companyId из TenantContext). Код соответствует канону Software Factory.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/modules/rai-chat/rai-chat.module.ts
 M apps/api/src/modules/rai-chat/rai-chat.service.spec.ts
 M apps/api/src/modules/rai-chat/rai-chat.service.ts
 M interagency/INDEX.md
 M memory-bank/progress.md
?? apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts
?? interagency/plans/2026-03-03_s4-1_chat-widget-logic.md
- interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md [DONE]
```

### git diff
```diff
diff --git a/apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts b/apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts
+export class RaiChatWidgetBuilder {
+  build({ companyId, workspaceContext }): RaiChatWidget[] { ... }
+}

diff --git a/apps/api/src/modules/rai-chat/rai-chat.service.ts b/apps/api/src/modules/rai-chat/rai-chat.service.ts
+import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
+private readonly widgetBuilder: RaiChatWidgetBuilder,
+widgets: this.widgetBuilder.build({
+  companyId,
+  workspaceContext: request.workspaceContext,
+}),
-private buildWidgets(...) { ...hardcoded widgets... }

diff --git a/apps/api/src/modules/rai-chat/rai-chat.service.spec.ts b/apps/api/src/modules/rai-chat/rai-chat.service.spec.ts
+expect(result.widgets).toEqual(
+  expect.arrayContaining([
+    expect.objectContaining({ payload: expect.objectContaining({ title: "Отклонения по маршруту registry / fields" }) }),
+    expect.objectContaining({ payload: expect.objectContaining({ title: "Бэклог NY-1 для registry / fields" }) }),
+  ]),
+)
+it("динамически меняет виджеты при смене route и companyId", async () => { ... })
```

### Логи прогонов
```text
$ pnpm --dir /root/RAI_EP/apps/api test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts
PASS src/modules/rai-chat/rai-chat.service.spec.ts
  RaiChatService
    ✓ returns typed suggested actions and canonical widgets
    ✓ интегрируется с памятью: вызывает retrieve и store
    ✓ строго соблюдает изоляцию по companyId
    ✓ fail-open: таймаут retrieval не ломает чат
    ✓ не пишет секреты в память (denylist)
    ✓ прогоняет путь signal -> advisory -> feedback -> memory append
    ✓ динамически меняет виджеты при смене route и companyId

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total

$ pnpm --dir /root/RAI_EP/apps/api exec tsc -p tsconfig.json --noEmit
PASS
```
