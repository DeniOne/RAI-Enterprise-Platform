# RAI_EP — Agent OS Shell + Persistent Memory (Plan/Checklist)
Статус: EXECUTION CHECKLIST
Основание: Agent-First / Chat-First Spec (LAW)
Принцип данных: Carcass + Flex (JSONB attrs под schemaKey, provenance/confidence)
Смотри для контекста в /root/RAI_EP/docs/00_STRATEGY/STAGE 2/SPEC_AGENT_FIRST_RAI_EP.md
---

## 0) Цель
Сделать Agent-First оболочку:
- TopNav (горизонтальное меню)
- Левый пилон: постоянный RAI Chat (Docked/Focus)
- Правая часть: Main Workspace (страницы продукта)
- “РАИ видит воркспэйс” через структурный WorkspaceContext
- Память пользователя “на всё время” через MemoryAdapter (без привязки к конкретной реализации)

Эффект:
- агент всегда доступен
- агент отвечает по контексту текущей страницы
- память включается как инфраструктурный слой и не ломает домен

---

## 1) AppShell (UI Foundation)

### 1.1 Ввести глобальный Shell Layout
- [x] **Цель:** чат живёт в Shell и не размонтируется при навигации; TopNav + LeftRaiChatDock + MainWorkspace интегрированы.
- **Статус truth-sync:** `VERIFIED` (см. S1.1)
- **Доказательство:** [AppShell.tsx](file:///root/RAI_EP/apps/web/components/layouts/AppShell.tsx), [LeftRaiChatDock.tsx](file:///root/RAI_EP/apps/web/components/ai-chat/LeftRaiChatDock.tsx), отчет [2026-03-02_s1-1_app-shell-persistent-rai-chat.md](file:///root/RAI_EP/interagency/reports/2026-03-02_s1-1_app-shell-persistent-rai-chat.md)

Эффект: агент не “теряется” при переходах, UX становится OS-like.

### 1.2 TopNav (горизонтальная навигация)
- [x] **Цель:** навигация не съедает ширину, поддерживается active route и группы меню.
- **Статус truth-sync:** `VERIFIED` (см. S1.2)
- **Доказательство:** [TopNav.tsx](file:///root/RAI_EP/apps/web/components/navigation/TopNav.tsx), отчет [2026-03-02_s1-2_topnav-navigation.md](file:///root/RAI_EP/interagency/reports/2026-03-02_s1-2_topnav-navigation.md), hotfix-отчет [2026-03-03_s1-3_topnav-role-switch-hotfix.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s1-3_topnav-role-switch-hotfix.md)
- **Детали:** Sidebar удален, все ссылки перенесены в TopNav. Иконки вынесены в головное меню, dropdown ролей закреплён в GovernanceBar. tsc PASS, manual check PASS.

Эффект: навигация не съедает ширину, рабочая область шире.

### 1.3 LeftRaiChatDock (Docked/Focus)
- [x] **Цель:** чат не мешает работе, но всегда доступен, режимы Docked/Focus переключаются.
- **Статус truth-sync:** `VERIFIED` (реализовано в рамках P2.3)
- **Доказательство:** [AiChatPanel.tsx](file:///root/RAI_EP/apps/web/components/ai-chat/AiChatPanel.tsx), [ai-chat-store.ts](file:///root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts), отчет [2026-03-02_p2-3_ux-polish-dock-focus.md](file:///root/RAI_EP/interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md)
- **Детали:** ручной ресайз (`chatWidth`), переключение режимов `dock/focus`, персистентность в `localStorage`. Эффект достигнут.

---

## 2) WorkspaceContext (как агент “видит” Main Workspace)

### 2.1 Канонический контракт WorkspaceContext
- [x] Ввести единый тип `WorkspaceContext` (не зависит от страниц)
- [x] На каждой странице публиковать контекст в общий store (например, `workspaceContextStore`)
- [x] В чат запросы всегда отправлять: message + workspaceContext
- **Статус truth-sync:** `VERIFIED` (см. S2.1)
- **Доказательство:** `apps/web/shared/contracts/workspace-context.ts`, `apps/web/lib/stores/workspace-context-store.ts`, `apps/web/app/consulting/yield/page.tsx`, `apps/web/__tests__/ai-chat-store.spec.ts`, отчёт `interagency/reports/2026-03-03_s2-1_workspace-context-contract.md`

Рекомендуемый минимум:
- route
- activeEntityRefs (fieldRef/farmRef/partyRef/techmapRef/taskRef)
- filters/sort/pagination (без тяжёлых данных)
- selectedRow summary (id/type/short summary)
- lastUserAction (строка)

Эффект: агент отвечает по структуре, а не по “распознаванию экрана”.

### 2.2 Правило нагрузки
- [x] Никаких больших таблиц/JSON в контексте
- [x] Только refs + краткие summary
- [x] Детальные данные агент получает typed tool-call’ом (search/read)
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [workspace-context-store.ts](file:///root/RAI_EP/apps/web/lib/stores/workspace-context-store.ts), отчет [2026-03-03_s2-2_workspace-context-load-rule.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s2-2_workspace-context-load-rule.md)

Эффект: быстро и детерминированно, без токен-ада.

---

## 3) Chat API v1 (Agent Console Protocol)

### 3.1 Endpoint контракт
- [x] POST `/api/rai/chat` принимает:
  - message
  - workspaceContext
  - clientTraceId (для трассировки)
- [x] Ответ (V1):
  - text
  - widgets[] (structured payload)
  - toolCalls[] (валидация выполненных инструментов)
  - openUiToken (сигнал на открытие UI)
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [rai-chat.dto.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts), [rai-chat.service.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.ts), отчет [2026-03-03_s3-1_chat-api-v1.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s3-1_chat-api-v1.md)

Эффект: чат становится интерфейсом к агентам и виджетам.

### 3.2 Typed Tool Calls only (LAW)
- [x] Agent вызывает домен только через типизированные вызовы
- [x] Никакого string-execution
- [x] Все tool calls логируются (audit + payload)
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [rai-tools.registry.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts), [rai-tools.registry.spec.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts), отчет [2026-03-03_s3-2_typed-tool-calls.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s3-2_typed-tool-calls.md)

Эффект: институциональная предсказуемость.

---

## 4) Reactive Panel (правый вывод РАИ)

### 4.1 RaiReactivePanel
- [x] Ввести единый renderer `renderWidget(widgetPayload)`
- [x] Поддержать MVP виджеты:
  - DeviationList
  - TaskBacklog
- [x] Виджеты рендерятся в чат-панели на основе схемы
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [rai-chat-widgets.types.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/widgets/rai-chat-widgets.types.ts), [RaiChatWidgetBuilder.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts), отчет [2026-03-03_s4-1_chat-widget-logic.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s4-1_chat-widget-logic.md)

Эффект: агент усиливает интерфейс, не превращая систему в “чатик”.

---

## 5) Память (ВАЖНО): делаем через MemoryAdapter, а не “сразу новые таблицы”

### 5.1 MemoryAdapter Contract (S5.1 - ОБЯЗАТЕЛЬНЫЙ СЛОЙ)
- [x] Создать интерфейс `MemoryAdapter` (server-side)
- [x] Методы: `appendInteraction`, `retrieve`, `getProfile`, `updateProfile`
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [memory-adapter.interface.ts](file:///root/RAI_EP/apps/api/src/shared/memory/memory-adapter.interface.ts), [default-memory-adapter.service.ts](file:///root/RAI_EP/apps/api/src/shared/memory/default-memory-adapter.service.ts), отчет [2026-03-03_s5-1_memory-adapter-contract.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s5-1_memory-adapter-contract.md)

Эффект: память можно подключить к текущей реализации без миграций UI/агента.

### 5.2 Storage Decision (S5.1 - ИНТЕГРАЦИЯ)
- [x] Подключить MemoryAdapter к текущей памяти (MemoryManager)
- [x] Использовать существующую реализацию как Primary
- **Статус truth-sync:** `VERIFIED` (см. S5.1)

Эффект: не ломаем существующее, расширяем только по необходимости.

### 5.3 Carcass+Flex модель памяти (S5.2 - MEMORY CANON, S5.3 - PRISMA SCHEMA)
НЕ “зоопарк таблиц”.
Минимальный каркас + JSONB flex. Детали зафиксированы в [MEMORY_CANON.md](file:///root/RAI_EP/docs/01_ARCHITECTURE/PRINCIPLES/MEMORY_CANON.md).

Carcass (минимум 2 сущности):
- [x] `MemoryInteraction` (сырой лог) реализовано в Prisma.
- [x] `MemoryEpisode` (сжатые эпизоды) реализовано в Prisma.
- [x] `MemoryProfile` (L-Tier) реализовано в Prisma.

Flex:
- `attrs` JSONB под `schemaKey`
- `provenance`, `confidence`, `updatedBy`, `updatedAt`

Чеклист:
- [x] schemaKey для Interaction/Episode/Profile (зафиксировано в каноне)
- [x] attrs JSONB хранит расширяемые поля (зафиксировано в каноне)
- [x] provenance/confidence обязательны (зафиксировано в каноне)

Эффект: память расширяется без переделок схемы каждый раз.

### 5.4 “Память на всё время” — это политика (S5.2 - MEMORY CANON)
- [x] Raw log хранить по retention (например, 6–12 месяцев) — это тех. политика (зафиксировано)
- [x] “Вечно” хранить Episodes + Profile (они компактные) (зафиксировано)
- [x] Retrieval всегда top-K + scoped по tenant/user + контекст страницы (зафиксировано)

Эффект: пользователь получает “вечную память”, система не задыхается.

---

## 6) Безопасность памяти (non-negotiable) (S5.2 - MEMORY CANON)
- [x] Tenant isolation (жёстко) (зафиксировано)
- [x] RBAC на retrieval (роль/контекст) (зафиксировано)
- [x] Audit trail на чтение памяти (особенно profile) (зафиксировано)
- [x] “Delete my data” / purge по userId (зафиксировано)

Эффект: память не превращается в риск.

---

## 7) Минимальный rollout (чтобы быстро показать результат)

### Phase A (1–2 дня)
- [x] AppShell
- [x] ChatDock Docked/Focus
- [x] WorkspaceContext store + отправка в API
- [x] `/api/rai/chat` возвращает text + widgets
- **Статус truth-sync:** `COMPLETED`

Эффект: появляется Agent OS UX.

### Phase B (следом)
- [ ] Подключить SupervisorAgent к API
- [x] Включить structured widgets справа

**Статус truth-sync:** `IN_PROGRESS`

Эффект: “Comet-эффект” — агент реагирует на страницу.

### Phase C (CRITICAL)
- [x] Подключить MemoryAdapter к существующей памяти
- [x] Включить retrieve → prompt composition → append

Эффект: пользовательский контекст становится долговременным.

---

## 8) Definition of Done
- [x] Чат не сбрасывается при навигации
- [x] Агент получает workspaceContext на каждом запросе
- [x] Виджеты рендерятся справа из structured payload
- [x] Память работает через MemoryAdapter и изолирована по tenant/user
- [ ] Episodes/Profile сохраняются и используются при ответах (в процессе)
