# PROMPT — A_RAI Фаза 1.4: Декомпозиция SupervisorAgent (Memory, Runtime, Composer)
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (завершение ФАЗЫ 1 A_RAI)  
Decision-ID: AG-ARAI-F1-004  
Зависит от: AG-ARAI-F1-001 (IntentRouter)

---

## Цель

Завершить декомпозицию монолитного `SupervisorAgent`, выделив из него оставшиеся 3 компонента согласно архитектуре A_RAI v2.0 (`RAI_AI_SYSTEM_ARCHITECTURE.md` §3.1). `SupervisorAgent` должен стать тонким оркестратором (управляющим фасадом), делегирующим специализированную логику.

**Три новые сущности:**
1. **MemoryCoordinator** — инкапсулирует логику работы с памятью (retrieve, append, профиль агента).
2. **ResponseComposer** — отвечает за форматирование текстового ответа, присоединение виджетов (`RaiChatWidgetBuilder`) и генерацию `suggestedActions`.
3. **AgentRuntime** — отвечает за жизненный цикл, дедлайны (таймауты) и вызов конкретных субагентов/инструментов.

---

## Контекст и Текущее состояние

Сейчас в `SupervisorAgent`:
- Около 450 строк кода.
- Жёстко зашита логика создания эмбеддингов, обработки таймаутов памяти (строки ~90-130).
- Жёстко зашита логика склеивания текста ответа (строки ~140-170).
- Жёстко зашит вызов `executeToolCalls`.

Нам нужно растащить этот код по изолированным сервисам (`@Injectable()`).

---

## Задачи (что сделать)

### 1. MemoryCoordinator (`memory-coordinator.service.ts`)
- [ ] Вынести логику вызова `memoryAdapter.retrieve` (с `withTimeout` и `buildTextEmbedding`) и `memoryAdapter.getProfile`.
- [ ] Вынести логику `memoryAdapter.append` (санитизация, обработка ошибок, асинхронная запись).
- [ ] Контракт: 
  - `recallContext(request, actorContext)` → возвращает `MemoryContext` и `MemoryProfile`
  - `commitInteraction(request, classification, response, actorContext)` → fire-and-forget сохранение.

### 2. ResponseComposer (`response-composer.service.ts`)
- [ ] Вынести логику формирования итогового `RaiChatResponseDto`.
- [ ] Перенести в него зависимость `RaiChatWidgetBuilder` и `externalSignalsService.process` (так как external signals возвращают `advisory`, влияющие на текст ответа).
- [ ] Генерация `text` (склейка ответов тулов, памяти, advisory).
- [ ] Генерация `suggestedActions` (перенести приватный метод).

### 3. AgentRuntime (`agent-runtime.service.ts`)
- [ ] Вынести логику исполнения инструментов (`executeToolCalls`).
- [ ] Добавить обертку таймаута на весь цикл работы агента (hard deadline 30 секунд).
- [ ] Интегрировать `AgronomAgent` — вызов субагента должен происходить внутри Runtime.

### 4. Рефакторинг SupervisorAgent
- [ ] Оставить в `SupervisorAgent` только высокоуровневую оркестрацию:
  ```typescript
  // Примерный флоу:
  const context = await this.memoryCoordinator.recallContext(...);
  const intent = this.intentRouter.classify(...);
  const executionResult = await this.agentRuntime.run({ intent, message, toolCalls, ...});
  const response = await this.responseComposer.buildResponse(executionResult, context, ...);
  this.memoryCoordinator.commitInteraction(...);
  // (запись AiAuditEntry уже вынесена в F1-1, её оставить тут или в Runtime)
  return response;
  ```
- [ ] Удалить все вынесенные приватные методы.

### 5. Обновление Модуля и Тестов
- [ ] Зарегистрировать `MemoryCoordinator`, `AgentRuntime`, `ResponseComposer` в `RaiChatModule`.
- [ ] Обновить `supervisor-agent.service.spec.ts` (замокать новые зависимости вместо старых).
- [ ] Написать хотя бы по 1 базовому юнит-тесту (создать `spec` файлы) для новых сервисов, чтобы проверить DI и отсутствие синтаксических ошибок.

---

## Ограничения

- Никакой новой бизнес-логики! Только рефакторинг текущей логики `SupervisorAgent`.
- Все тесты `rai-chat` должны проходить.
- Сохранить обработку ошибок (например, `catch(logger.warn)` при таймауте памяти).

---

## Definition of Done (DoD)

- [ ] Разнесены 3 сервиса.
- [ ] `SupervisorAgent` похудел (в идеале < 150 строк).
- [ ] `tsc --noEmit` — PASS.
- [ ] `jest` по модулю `rai-chat` — PASS (100% старых тестов работают, возможно с моками).

---

## Что вернуть на ревью

Отчёт с:
1. Выводом `tsc --noEmit`.
2. Выводом тестов `pnpm test -- src/modules/rai-chat`.
3. Копией нового метода `orchestrate` из `SupervisorAgent`.
