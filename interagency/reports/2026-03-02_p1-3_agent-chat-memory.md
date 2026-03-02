# REPORT — Agent Chat Memory (P1.3)
Дата: 2026-03-02  
Статус: final  

## Что было целью
- Реализация retrieve + append для чата агента.
- Обеспечение детерминированных эмбеддингов для текстовых сообщений.
- Строгая изоляция данных по `companyId`.

## Что сделано (факты)
- Принято решение `AG-CHAT-MEMORY-001` в `DECISIONS.log`.
- Исправлены импорты в `MemoryManager` (удалены проблемные `.js`).
- Добавлена функция `buildTextEmbedding` в `signal-embedding.util.ts`.
- Внедрены `MemoryManager` и `EpisodicRetrievalService` в `RaiChatService`.
- Добавлены канонические лимиты/политики P1.3 для чата:
  - конфиг recall: top-K, minSimilarity, timeout (через env)
  - fail-open на recall timeout/error (чат не падает)
  - denylist/sanitize: секреты не пишутся в память
  - policy persist: `RaiChatMemoryPolicy` (persist=true) для гарантированного append в long-term
- Сообщения пользователя сохраняются через `MemoryManager.store` с `memoryType="EPISODIC"`.
- Перед ответом выполняется поиск похожих сообщений (retrieve) и подмешивание top-1 контекста в текст ответа (демо).
- Проверена изоляция: `companyId` берется только из доверенного контекста.

## Изменённые файлы
- `DECISIONS.log` (Статус `PENDING` -> `ACCEPTED`)
- `apps/api/src/shared/memory/signal-embedding.util.ts` (Добавлен `buildTextEmbedding`)
- `apps/api/src/shared/memory/memory-manager.service.ts` (Исправлены импорты)
- `apps/api/src/modules/rai-chat/rai-chat.service.ts` (Интеграция памяти)
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` (Тесты)
- `apps/api/src/shared/memory/rai-chat-memory.config.ts` (лимиты/timeout через env)
- `apps/api/src/shared/memory/rai-chat-memory.util.ts` (sanitize + withTimeout)
- `apps/api/src/shared/memory/rai-chat-memory.policy.ts` (persist=true policy)
- `memory-bank/activeContext.md`, `memory-bank/progress.md` (Update logs)
- `interagency/INDEX.md` (Update index)

## Проверки/прогоны
- `pnpm --filter ./apps/api... test -- --runTestsByPath src/modules/rai-chat/rai-chat.service.spec.ts` -> **PASS** (5/5).
- Проверка изоляции тенантов в unit-тесте -> **PASS**.
- Проверка ручного подмешивания контекста -> **PASS**.
- Проверка fail-open на timeout retrieval -> **PASS**.
- Проверка denylist (не писать секреты) -> **PASS**.

## Что сломалось / что не получилось
- Пришлось убрать `.js` из импортов, так как Jest в CJS-режиме их не переваривал. На работу API это не повлияло, так как там `commonjs` в конфиге.

## Следующий шаг
- P1.4 Status Truth Sync или расширение WorkspaceContext. Погнали дальше, бля.
