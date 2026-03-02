# REPORT — P2.1 Расширение WorkspaceContext на Operations и Commerce
Дата: 2026-03-02  
Статус: final  

## Ревью: APPROVED
Проверено по CANON/FORBIDDEN/SECURITY_CANON; tenant isolation сохранён; web-spec PASS. Ограничения (нет browser smoke, operations = consulting/execution/manager) зафиксированы.

---

## Что было целью
- Расширить канонический `WorkspaceContext` за пределы CRM/TechMap.
- Сделать так, чтобы `Commerce` и operational-screen публиковали релевантные `activeEntityRefs`, `selectedRowSummary` и `lastUserAction`.
- Сохранить lightweight-контракт: только refs + summaries, без `companyId` и тяжёлых payload.

## Что сделано (факты)
- Подтверждён `Decision-ID` `AG-WORKSPACE-CONTEXT-EXPAND-001` со статусом `ACCEPTED` в `DECISIONS.log`.
- Зафиксированы реальные целевые экраны в текущем repo:
  - `Commerce`: `apps/web/app/(app)/commerce/contracts/page.tsx`
  - `Operations`: `apps/web/app/consulting/execution/manager/page.tsx`
- Расширен контракт `WorkspaceContext`:
  - в web `apps/web/shared/contracts/workspace-context.ts`
  - в API DTO `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
  - добавлены новые `kind`: `contract`, `operation`
- Добавлен helper `apps/web/lib/workspace-context-utils.ts`:
  - строит ограниченные по длине `WorkspaceEntityRef`
  - строит ограниченные по длине `SelectedRowSummary`
  - нормализует строки и не даёт раздувать payload
- В `Commerce contracts` подключён publisher-слой:
  - `filters = { domain: "commerce", section: "contracts", severity }`
  - при фокусе/выборе публикуется `activeEntityRefs = [{ kind: "contract", id }]`
  - публикуется краткий summary договора и `lastUserAction`
- В `Execution manager` подключён publisher-слой:
  - `filters = { domain: "operations", section: "execution-manager", status }`
  - при фокусе/действии публикуется `activeEntityRefs = [{ kind: "operation", id }]`
  - публикуется краткий summary операции и `lastUserAction`
- Tenant isolation сохранён:
  - `companyId` не добавлялся в `WorkspaceContext`
  - API по-прежнему получает tenant только из доверенного backend context
- Добавлены/обновлены web-spec'и:
  - `apps/web/shared/contracts/commerce-contracts-page.spec.tsx`
  - `apps/web/shared/contracts/execution-manager-workspace-context.spec.tsx`

## Изменённые файлы
- `apps/web/shared/contracts/workspace-context.ts`
- `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
- `apps/web/lib/workspace-context-utils.ts`
- `apps/web/app/(app)/commerce/contracts/page.tsx`
- `apps/web/app/consulting/execution/manager/page.tsx`
- `apps/web/shared/contracts/commerce-contracts-page.spec.tsx`
- `apps/web/shared/contracts/execution-manager-workspace-context.spec.tsx`
- `interagency/INDEX.md`
- `interagency/reports/2026-03-02_p2-1_workspacecontext-expand.md`

## Проверки/прогоны
- `cd apps/web && npx jest --runInBand shared/contracts/commerce-contracts-page.spec.tsx` -> **PASS**
- `cd apps/web && npx jest --runInBand shared/contracts/execution-manager-workspace-context.spec.tsx` -> **PASS**
- Manual check: PASS
  - по коду подтверждено, что `AiChatStore` продолжает отправлять весь `workspaceContext` в `POST /api/rai/chat`
  - `companyId` в payload контекста отсутствует

## Что сломалось / что не получилось
- Отдельный browser/manual smoke “страница → чат → backend payload” в UI не запускался; доказательство собрано через page wiring и web-spec'и.
- В качестве operational-screen использован фактический экран `consulting/execution/manager`; отдельного route `/operations/*` в текущем `apps/web/app` не найдено.

## Следующий шаг
- Внешнее ревью пакета `P2.1`.
- После `APPROVED`: truth-sync execution-доков/чеклистов под новый факт `WorkspaceContext` для `Commerce` и `Operations`.

## Технические артефакты

### git status
```text
 M DECISIONS.log
 M apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts
 M apps/web/app/(app)/commerce/contracts/page.tsx
 M apps/web/app/consulting/execution/manager/page.tsx
 M apps/web/shared/contracts/commerce-contracts-page.spec.tsx
 M apps/web/shared/contracts/workspace-context.ts
?? apps/web/lib/workspace-context-utils.ts
?? apps/web/shared/contracts/execution-manager-workspace-context.spec.tsx
?? interagency/reports/2026-03-02_p2-1_workspacecontext-expand.md
```

### git diff (ключевые фрагменты)
```diff
diff --git a/apps/web/shared/contracts/workspace-context.ts b/apps/web/shared/contracts/workspace-context.ts
-    kind: z.enum(['farm', 'field', 'party', 'techmap', 'task']),
+    kind: z.enum(['farm', 'field', 'party', 'techmap', 'task', 'contract', 'operation']),
```

```diff
diff --git a/apps/web/app/(app)/commerce/contracts/page.tsx b/apps/web/app/(app)/commerce/contracts/page.tsx
+    const setActiveEntityRefs = useWorkspaceContextStore((s) => s.setActiveEntityRefs);
+    const setSelectedRowSummary = useWorkspaceContextStore((s) => s.setSelectedRowSummary);
+    const setFilters = useWorkspaceContextStore((s) => s.setFilters);
+    const setLastUserAction = useWorkspaceContextStore((s) => s.setLastUserAction);
+    setActiveEntityRefs([buildWorkspaceRef('contract', focusedContract.id)]);
+    setSelectedRowSummary(buildWorkspaceSummary(...));
```

```diff
diff --git a/apps/web/app/consulting/execution/manager/page.tsx b/apps/web/app/consulting/execution/manager/page.tsx
+    const { isFocused } = useEntityFocus({...});
+    setFilters({ domain: 'operations', section: 'execution-manager', ... });
+    setActiveEntityRefs([buildWorkspaceRef('operation', focusedOperation.id)]);
+    setSelectedRowSummary(buildWorkspaceSummary(...));
+    setLastUserAction(`focus-operation:${focusedOperation.id}`);
```

### Логи прогонов
```text
$ cd apps/web && npx jest --runInBand shared/contracts/commerce-contracts-page.spec.tsx
PASS shared/contracts/commerce-contracts-page.spec.tsx
  Commerce contracts page smart routing
    ✓ filters by severity and focuses row by entity (82 ms)
```

```text
$ cd apps/web && npx jest --runInBand shared/contracts/execution-manager-workspace-context.spec.tsx
PASS shared/contracts/execution-manager-workspace-context.spec.tsx
  Execution manager workspace context
    ✓ publishes focused operational summary into WorkspaceContext (57 ms)
```

### Пример payload'ов WorkspaceContext
```json
{
  "route": "/commerce/contracts",
  "activeEntityRefs": [
    { "kind": "contract", "id": "a2" }
  ],
  "filters": {
    "domain": "commerce",
    "section": "contracts",
    "severity": "warning"
  },
  "selectedRowSummary": {
    "kind": "contract",
    "id": "a2",
    "title": "C-002",
    "status": "DRAFT"
  },
  "lastUserAction": "focus-contract:a2"
}
```

```json
{
  "route": "/consulting/execution/manager",
  "activeEntityRefs": [
    { "kind": "operation", "id": "op-42" }
  ],
  "filters": {
    "domain": "operations",
    "section": "execution-manager",
    "status": null
  },
  "selectedRowSummary": {
    "kind": "operation",
    "id": "op-42",
    "title": "Внесение удобрений",
    "subtitle": "Подкормка",
    "status": "IN_PROGRESS"
  },
  "lastUserAction": "focus-operation:op-42"
}
```
