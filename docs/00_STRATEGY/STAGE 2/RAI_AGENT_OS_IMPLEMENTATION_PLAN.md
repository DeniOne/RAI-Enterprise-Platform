# RAI_EP — Agent OS Shell + Persistent Memory (Plan/Checklist)
Статус: EXECUTION CHECKLIST
Основание: Agent-First / Chat-First Spec (LAW)
Принцип данных: Carcass + Flex (JSONB attrs под schemaKey, provenance/confidence)

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
- [ ] Вынести layout в AppShell: TopNav + LeftRaiChatDock + MainWorkspace
- [ ] Чат живёт в Shell и не размонтируется при навигации
- [ ] Сохранить текущие маршруты/страницы без переписывания логики

Эффект: агент не “теряется” при переходах, UX становится OS-like.

### 1.2 TopNav (горизонтальная навигация)
- [ ] Перенести существующую структуру меню в TopNav
- [ ] Реализовать dropdown подменю (группы: Урожай/CRM/Финансы/Коммерция/Настройки)
- [ ] Поддержать active route + deep links

Эффект: навигация не съедает ширину, рабочая область шире.

### 1.3 LeftRaiChatDock (Docked/Focus)
- [ ] Docked width 320–360px
- [ ] Focus width 480–560px
- [ ] Toggle в header чата
- [ ] Persist режима в localStorage

Эффект: чат не мешает работе, но всегда доступен.

---

## 2) WorkspaceContext (как агент “видит” Main Workspace)

### 2.1 Канонический контракт WorkspaceContext
- [ ] Ввести единый тип `WorkspaceContext` (не зависит от страниц)
- [ ] На каждой странице публиковать контекст в общий store (например, `workspaceContextStore`)
- [ ] В чат запросы всегда отправлять: message + workspaceContext

Рекомендуемый минимум:
- route
- activeEntityRefs (fieldRef/farmRef/partyRef/techmapRef/taskRef)
- filters/sort/pagination (без тяжёлых данных)
- selectedRow summary (id/type/short summary)
- lastUserAction (строка)

Эффект: агент отвечает по структуре, а не по “распознаванию экрана”.

### 2.2 Правило нагрузки
- [ ] Никаких больших таблиц/JSON в контексте
- [ ] Только refs + краткие summary
- [ ] Детальные данные агент получает typed tool-call’ом (search/read)

Эффект: быстро и детерминированно, без токен-ада.

---

## 3) Chat API v1 (Agent Console Protocol)

### 3.1 Endpoint контракт
- [ ] POST `/api/rai/chat` принимает:
  - message
  - workspaceContext
  - clientTraceId (для трассировки)
- [ ] Ответ:
  - text
  - widgets[] (structured payload)
  - toolCalls[] (опционально, для отладки)
  - openUiToken (опционально)

Эффект: чат становится интерфейсом к агентам и виджетам.

### 3.2 Typed Tool Calls only (LAW)
- [ ] Agent вызывает домен только через типизированные вызовы
- [ ] Никакого string-execution
- [ ] Все tool calls логируются (audit)

Эффект: институциональная предсказуемость.

---

## 4) Reactive Panel (правый вывод РАИ)

### 4.1 RaiReactivePanel
- [ ] Ввести единый renderer `renderWidget(widgetPayload)`
- [ ] Поддержать MVP виджеты:
  - DeviationList
  - RiskOverview
  - TaskBacklog
  - FieldStatusCard
  - Last24hChanges
- [ ] Виджеты рендерятся справа как overlay/drawer, не блокируя workspace

Эффект: агент усиливает интерфейс, не превращая систему в “чатик”.

---

## 5) Память (ВАЖНО): делаем через MemoryAdapter, а не “сразу новые таблицы”

### 5.1 MemoryAdapter Contract (обязательный слой абстракции)
- [ ] Создать интерфейс `MemoryAdapter` (server-side):

Методы (минимум):
- `appendInteraction(ctx, userMessage, agentResponse, toolCalls)`
- `writeEpisode(ctx, episode)` (сжатый эпизод)
- `retrieve(ctx, query, limit)` → episodes[]
- `getProfile(ctx)` / `updateProfile(ctx, patch)`

Эффект: память можно подключить к текущей реализации без миграций UI/агента.

### 5.2 Storage Decision (без предположений)
- [ ] Подключить MemoryAdapter к текущей памяти (что уже есть)
- [ ] Если текущая память покрывает retrieve+append — используем её как Primary
- [ ] Если не покрывает — добавляем минимальный Carcass+Flex слой (см. 5.3)

Эффект: не ломаем существующее, расширяем только по необходимости.

### 5.3 Carcass+Flex модель памяти (если нужно расширять)
НЕ “зоопарк таблиц”.
Минимальный каркас + JSONB flex.

Carcass (минимум 2 сущности):
- MemoryInteraction (сырой лог)
- MemoryEpisode (сжатые эпизоды)

Flex:
- `attrs` JSONB под `schemaKey`
- `provenance`, `confidence`, `updatedBy`, `updatedAt`

Чеклист:
- [ ] schemaKey для Interaction/Episode/Profile
- [ ] attrs JSONB хранит расширяемые поля
- [ ] provenance/confidence обязательны

Эффект: память расширяется без переделок схемы каждый раз.

### 5.4 “Память на всё время” — это политика, а не бесконечный токен-лог
- [ ] Raw log хранить по retention (например, 6–12 месяцев) — это тех. политика
- [ ] “Вечно” хранить Episodes + Profile (они компактные)
- [ ] Retrieval всегда top-K + scoped по tenant/user + контекст страницы

Эффект: пользователь получает “вечную память”, система не задыхается.

---

## 6) Безопасность памяти (non-negotiable)
- [ ] Tenant isolation (жёстко)
- [ ] RBAC на retrieval (роль/контекст)
- [ ] Audit trail на чтение памяти (особенно profile)
- [ ] “Delete my data” / purge по userId (юридическая гигиена)

Эффект: память не превращается в риск.

---

## 7) Минимальный rollout (чтобы быстро показать результат)

### Phase A (1–2 дня)
- [ ] AppShell
- [ ] ChatDock Docked/Focus
- [ ] WorkspaceContext store + отправка в API
- [ ] Mock `/api/rai/chat` возвращает text + 1 widget

Эффект: появляется Agent OS UX.

### Phase B (следом)
- [ ] Подключить SupervisorAgent к API
- [ ] Включить structured widgets справа

Эффект: “Comet-эффект” — агент реагирует на страницу.

### Phase C (CRITICAL)
- [ ] Подключить MemoryAdapter к существующей памяти
- [ ] Включить retrieve → prompt composition → append

Эффект: пользовательский контекст становится долговременным.

---

## 8) Definition of Done
- [ ] Чат не сбрасывается при навигации
- [ ] Агент получает workspaceContext на каждом запросе
- [ ] Виджеты рендерятся справа из structured payload
- [ ] Память работает через MemoryAdapter и изолирована по tenant/user
- [ ] Episodes/Profile сохраняются и используются при ответах