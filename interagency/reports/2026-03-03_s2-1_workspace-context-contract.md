# REPORT — S2.1 WorkspaceContext Contract
Дата: 2026-03-03
Статус: final

## Ревью: APPROVED
Проверено по фактическому коду и целевым спекам. `workspaceContext` остаётся lightweight, `companyId` не передаётся из frontend payload, tenant isolation не нарушен.

## Что было целью
- Довести `S2.1 / WorkspaceContext contract` до фактического закрытия.
- Гарантировать, что чат всегда отправляет актуальный `workspaceContext`.
- Исключить протекание page-level контекста между роутами.
- Подтвердить coverage ключевых экранов `CRM / TechMap / Yield-KPI` и включить backend observability.

## Что сделано (факты)
- Подтверждён текущий shell lifecycle:
  - `AiChatRoot` уже выполняет `setRouteAndReset(pathname)` при смене route.
  - Это гарантированно очищает `activeEntityRefs`, `filters`, `selectedRowSummary`, `lastUserAction` при навигации.
- Усилена проверка chat integration:
  - в `apps/web/__tests__/ai-chat-store.spec.ts` добавлен тест, подтверждающий отправку актуального `workspaceContext` в `POST /api/rai/chat`.
- Закрыт page coverage для `Yield/KPI` сценария:
  - `apps/web/app/consulting/yield/page.tsx` теперь публикует `filters`, `activeEntityRefs`, `selectedRowSummary`, `lastUserAction`;
  - при выборе плана публикуются refs `techmap / field / farm`, без тяжёлых payload.
- Добавлен store lifecycle spec:
  - `apps/web/shared/contracts/workspace-context-store.spec.ts` подтверждает, что `setRouteAndReset(...)` сбрасывает page-scoped поля и сохраняет только новый `route`.
- Добавлен page spec для yield-контекста:
  - `apps/web/shared/contracts/consulting-yield-workspace-context.spec.tsx`.
- Backend observability доведён:
  - `apps/api/src/modules/rai-chat/rai-chat.controller.ts` теперь логирует безопасный summary принятого `workspaceContext`:
    - `route`
    - количество и типы refs
    - наличие `filters`
    - наличие `selectedRowSummary`
    - `lastUserAction`
  - полный dump объекта не пишется, `companyId` из payload не принимается.
- Обновлён backend controller spec:
  - `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts` приведён к актуальной сигнатуре контроллера через mock `RaiChatService`.

## Ключевые экраны, закрывающие S2.1
- `CRM / Contracts`: `apps/web/app/(app)/commerce/contracts/page.tsx`
- `TechMap`: `apps/web/app/consulting/techmaps/active/page.tsx`
- `Operations`: `apps/web/app/consulting/execution/manager/page.tsx`
- `Yield/KPI`: `apps/web/app/consulting/yield/page.tsx`
- `CRM farm details`: `apps/web/components/party-assets/farms/FarmDetailsPage.tsx`

## Изменённые файлы
- `apps/api/src/modules/rai-chat/rai-chat.controller.ts`
- `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts`
- `apps/web/app/consulting/yield/page.tsx`
- `apps/web/__tests__/ai-chat-store.spec.ts`
- `apps/web/shared/contracts/workspace-context-store.spec.ts`
- `apps/web/shared/contracts/consulting-yield-workspace-context.spec.tsx`
- `interagency/reports/2026-03-03_s2-1_workspace-context-contract.md`

## Проверки/прогоны
- `cd apps/web && pnpm exec jest --runInBand __tests__/ai-chat-store.spec.ts shared/contracts/workspace-context-store.spec.ts shared/contracts/consulting-yield-workspace-context.spec.tsx shared/contracts/commerce-contracts-page.spec.tsx shared/contracts/execution-manager-workspace-context.spec.tsx` -> **PASS**
- `cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit` -> **PASS**
- `cd apps/api && pnpm exec jest --runInBand test/modules/rai-chat/rai-chat.controller.spec.ts` -> **PASS**

## Пример подтверждённого payload
```json
{
  "threadId": "thread-0",
  "message": "Покажи контекст",
  "workspaceContext": {
    "route": "/consulting/yield",
    "activeEntityRefs": [
      { "kind": "farm", "id": "farm-1" }
    ],
    "lastUserAction": "select-plan:plan-1"
  }
}
```

## Что не делалось
- Browser Network capture не снимался вручную; доказательство собрано через unit/spec-слой и фактическую fetch-проверку в `ai-chat-store.spec.ts`.
- Контракт `2.2 Правило нагрузки` формально не расширялся отдельным enforcement-слоем на backend; в рамках `S2.1` соблюдение подтверждено кодом publishers и тестами.
