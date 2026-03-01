# PROMPT — P0.1 Реальный чат endpoint в `apps/api` (вместо web-мока)
Дата: 2026-03-01  
Статус: active  
Приоритет: P0  

## Цель
Убрать мок-логику веб-чата и сделать канонический endpoint в `apps/api`, чтобы UI общался с backend, а не сам с собой.

## Контекст (опора)
- Контракт Agent OS: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`
- Source of truth: `docs/01_ARCHITECTURE/PRINCIPLES/CANON.md`
- Security: `docs/01_ARCHITECTURE/PRINCIPLES/SECURITY_CANON.md`

## Ограничения (жёстко)
- `companyId` берётся **только** из доверенного контекста (JWT/session/tenant context), не из payload.
- Никаких LLM. Только детерминированный ответ.
- Никаких `any[]` в публичном контракте ответа (минимум — тип/схема).
- Не ломать существующий UI чата (FAB/hotkey/overlay).

## Задачи
### 1) `apps/api`: добавить модуль `rai-chat`
- [ ] Создать `apps/api/src/modules/rai-chat/`:
  - `rai-chat.module.ts`
  - `rai-chat.controller.ts`
  - `dto/rai-chat.dto.ts` (request/response)
- [ ] Endpoint: `POST /api/rai/chat`
- [ ] Request body: `{ message: string; workspaceContext?: { route?: string; ... }; clientTraceId?: string }`
- [ ] Response body: `{ text: string; widgets: Array<{ type: string; payload: unknown }>; traceId?: string }`
- [ ] Поведение (MVP):
  - `text`: “Принял: <message>” + “route: <route>” если есть
  - `widgets`: 1 виджет-заглушка, например:
    - `{ type: "Last24hChanges", payload: { route, ts } }`
- [ ] Подключить `RaiChatModule` в `apps/api/src/app.module.ts`

### 2) `apps/web`: переключить чат на `apps/api`
- [ ] Найти место отправки сообщения (скорее всего `apps/web/lib/stores/ai-chat-store.ts`).
- [ ] Переключить запрос на `POST /api/rai/chat` (через существующий proxy).
- [ ] `apps/web/app/api/ai-chat/route.ts`:
  - либо превратить в тонкий proxy в `apps/api` без своей логики,
  - либо убрать из цепочки вызовов (не быть источником истины).

### 3) Тест (минимум) в `apps/api`
- [ ] Добавить тест на контроллер:
  - message обязателен
  - ответ содержит `text` и `widgets[]`

## Definition of Done (DoD)
- [ ] Веб-чат получает ответы от `apps/api` endpoint (не мок).
- [ ] В новом endpoint нет хардкода `companyId` и он не берётся из payload.
- [ ] Тесты `apps/api` проходят.

## Тест-план
- [ ] Отправить сообщение в чате из веба и увидеть ответ с `widgets[]`.
- [ ] Проверить ошибку валидации при пустом `message`.

## Что вернуть на ревью
- Список изменённых файлов
- Дифф ключевых файлов (`rai-chat.*`, изменения в web store/route)
- Логи тестов/ошибки

