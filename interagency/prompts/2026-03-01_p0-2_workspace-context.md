# PROMPT — P0.2 Канонический WorkspaceContext (refs + summaries, без тяжёлых данных)
Дата: 2026-03-01  
Статус: active  
Приоритет: P0  

## Цель
Сделать канонический `WorkspaceContext`, чтобы агент получал **структурный контекст активной страницы** (route + refs + краткие summary), а web отправлял его **в каждом** запросе `POST /api/rai/chat`. Контекст должен быть лёгким (без таблиц/полных DTO), пригодным для валидации схемой и одинаковым для web+api.

## Контекст
- Сейчас в web в чат улетает по сути только `route` (см. `apps/web/components/ai-chat/AiChatRoot.tsx`, `apps/web/lib/stores/ai-chat-store.ts`).
- По плану Agent OS: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (раздел “WorkspaceContext”).
- Приоритет и DoD: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md` (P0.2).
- Reality map: `docs/00_STRATEGY/STAGE 2/PROJECT_REALITY_MAP.md` (WorkspaceContext = PARTIAL).

## Ограничения (жёстко)
- **Никаких тяжёлых данных** в контексте: никаких таблиц/полных списков/сырых DTO/больших JSON.
- **Только refs + краткие summaries** (короткий текст, 1–3 поля “что это”).
- **Не отправлять** `companyId`, `userId`, токены, cookies, PII/персональные данные через `workspaceContext`.
- Контекст — **подсказка**, не источник правды: сервер всё равно делает tenant isolation и доступы (см. `docs/01_ARCHITECTURE/PRINCIPLES/SECURITY_CANON.md`).
- Не ломать существующий UX чата/overlay; изменения должны быть локальны (store + публикация + request payload).

## Задачи (что сделать)
### 1) Зафиксировать минимальный контракт `WorkspaceContext` (type + schema)
- [ ] Ввести канонический контракт в web (TS type + zod schema):
  - рекомендованный путь: `apps/web/shared/contracts/workspace-context.ts`
- [ ] Минимальные поля (строго):
  - `route: string`
  - `activeEntityRefs?: Array<{ kind: 'farm' | 'field' | 'party' | 'techmap' | 'task'; id: string }>`
  - `filters?: Record<string, string | number | boolean | null>`
  - `selectedRowSummary?: { kind: string; id: string; title: string; subtitle?: string; status?: string }`
  - `lastUserAction?: string`
- [ ] Добавить простые лимиты в schema (чтобы не раздувалось):
  - route maxLen (например 256)
  - summaries maxLen (например title 160, subtitle 240, lastUserAction 200)
  - activeEntityRefs maxCount (например 10)
- [ ] Привести `apps/web/lib/stores/ai-chat-store.ts` к этому контракту:
  - убрать локальный `ChatContext` (или превратить его в `WorkspaceContext`)
  - `sendMessage()` должен отправлять `workspaceContext` только в каноническом формате.

### 2) WorkspaceContext store в web (единая точка публикации)
- [ ] Завести отдельный store, например `apps/web/lib/stores/workspace-context-store.ts` (zustand):
  - `context: WorkspaceContext`
  - методы: `setRoute`, `setActiveEntityRefs`, `setFilters`, `setSelectedRowSummary`, `setLastUserAction`, `resetNonRouteOnNavigation` (опционально).
- [ ] В `apps/web/components/ai-chat/AiChatRoot.tsx`:
  - при смене pathname публиковать `route`
  - при навигации сбрасывать “страничные” поля (filters/selectedRowSummary/lastUserAction), но **не ломать** сам чат.
- [ ] В `apps/web/lib/stores/ai-chat-store.ts`:
  - брать `workspaceContext` из `workspace-context-store` (а не держать свою копию).

### 3) Паблишеры на ключевых страницах (минимум: CRM + TechMap)
**CRM (минимум):**
- [ ] Страница карточки хозяйства публикует refs+summary:
  - `apps/web/components/party-assets/farms/FarmDetailsPage.tsx`
  - activeEntityRefs: `{ kind:'farm', id:farmId }` (+ при желании `{ kind:'field', id }` для вкладки полей, но без массивов “всё поле”)
  - selectedRowSummary: `{ kind:'farm', id, title:farm.name, subtitle:'Карточка хозяйства' }`
- [ ] (Если проще/быстрее) альтернативно: публиковать контекст в route-компонентах `apps/web/app/(app)/assets/farms/[id]/page.tsx` через client wrapper.

**TechMap (минимум):**
- [ ] Страница списка активных техкарт публикует контекст по query focus:
  - `apps/web/app/consulting/techmaps/active/page.tsx`
  - если есть `?entity=...`, найти focused row и публиковать:
    - activeEntityRefs: `{ kind:'techmap', id: row.item.id }`
    - selectedRowSummary: `{ kind:'techmap', id, title: row.code, subtitle: row.item.crop ?? '-', status: row.item.status }`
  - filters: статус ACTIVE (как факт страницы, без массивов)
- [ ] (Опционально) Для detail страницы техкарты: если есть клиентская карточка/страница — публиковать `{kind:'techmap', id}` + короткий summary.

### 4) API: привести DTO/валидацию `workspaceContext` к контракту (убрать `any`)
- [ ] Обновить `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`:
  - убрать `[key: string]: any`
  - добавить валидацию структуры (минимум: `route` строка, ограничить размер массивов/строк)
  - не принимать/не ожидать `companyId` внутри `workspaceContext`

## Definition of Done (DoD)
- [ ] Есть единый контракт `WorkspaceContext` (тип + schema) и он используется web-чатом.
- [ ] Минимум 2 ключевые зоны реально публикуют refs+summary:
  - CRM: карточка хозяйства (`FarmDetailsPage`) публикует `{kind:'farm', id}` + summary.
  - TechMap: `/consulting/techmaps/active` публикует `{kind:'techmap', id}` + summary по `?entity=...`.
- [ ] Каждый запрос `POST /api/rai/chat` включает `workspaceContext` в каноническом формате.
- [ ] В контексте нет тяжёлых данных и нет `companyId` из payload.

## Тест-план (минимум)
- [ ] Web: открыть `/assets/farms/<id>` → отправить сообщение в чат → убедиться (логом/дебагом), что в request ушли `route` + `{kind:'farm', id}` + короткий summary.
- [ ] Web: открыть `/consulting/techmaps/active?entity=TM-001` (или иной идентификатор) → отправить сообщение → в request есть `{kind:'techmap', id}` и summary.
- [ ] API: юнит/контракт-тест на DTO (или простой e2e тест контроллера) — `workspaceContext` валидируется, превышение лимитов режется/отклоняется.

## Что вернуть на ревью
- Изменённые файлы (список), минимум ожидаемо:
  - `apps/web/shared/contracts/workspace-context.ts`
  - `apps/web/lib/stores/workspace-context-store.ts`
  - `apps/web/components/ai-chat/AiChatRoot.tsx`
  - `apps/web/lib/stores/ai-chat-store.ts`
  - `apps/web/components/party-assets/farms/FarmDetailsPage.tsx`
  - `apps/web/app/consulting/techmaps/active/page.tsx`
  - `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
- Дифф/патч ключевых мест (контракт, store, публикация, отправка, DTO).
- Результаты тестов/прогонов + короткие логи/скрин/сниппет запроса (без токенов).

