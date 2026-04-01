---
id: DOC-EXE-ONE-BIG-PHASE-C-IMPLEMENTATION-PLAN-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-C-IMPLEMENTATION-PLAN-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_NEW_CHAT_MEMO.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md;apps/api/src/modules/front-office/front-office-external.controller.ts;apps/api/src/modules/front-office/front-office.service.ts;apps/api/src/shared/front-office/front-office-threading.service.ts;apps/web/app/(app)/layout.tsx;apps/web/middleware.ts;apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx;apps/web/lib/api/front-office.ts
---
# PHASE C IMPLEMENTATION PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-C-IMPLEMENTATION-PLAN-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот документ переводит `Phase C` из общего канона в конкретный пакет реализации для минимального `web`-входа и модели доступа.

Для канона подфазы использовать также [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md).

Для живого статуса строк использовать также [PHASE_C_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_EXECUTION_BOARD.md).

## 0. Смысл и границы `Phase C`

`Phase C` реализуется как двухконтурная модель:

- внешний контур `portal/front-office`;
- внутренний governed контур `AiChat`.

Цель фазы — стабилизировать путь:

- `login -> session -> thread -> message -> response`;
- показать `work windows + explainability/evidence` в пользовательском интерфейсе.

Жёсткие границы:

- в `Phase C` не включать `installability`, `backup/restore`, pilot-hardening и menu breadth;
- из хвостов `Phase B` поднимать только блокеры `Phase C` (`B-2.4.2`, `B-2.5.2`);
- все остальные хвосты `Phase B` держать как carry-over до отдельного возврата.

## 1. Подфазы исполнения

### `C0` — scope lock и board-дисциплина

Что входит:

- зафиксировать границы `C` против `D`;
- вести фазу только через board-строки `C-2.x.y`;
- удерживать статусы только из набора `open/in_progress/guard_active/done`.

Что меняется:

- фаза перестаёт расползаться в смежные контуры.

### `C1` — доступ, роли, сессии

Что входит:

- убрать runtime-зависимость от role simulation;
- брать роль и capability-флаги из authenticated principal (`/users/me`);
- ограничить `FRONT_OFFICE_USER` только `portal/front-office`;
- отключить для внешнего контура внутренний shell (`LeftRaiChatDock`);
- включить единые session-guards для рабочих маршрутов `(app)`.

Что меняется:

- доступ и интерфейс начинают жить по фактической роли пользователя, а не по локальной simulation-модели.

### `C2` — внешний портал

Что входит:

- добавить viewer-scoped endpoint `POST /portal/front-office/intake/message` для inbound `web_chat`;
- расширить `GET /portal/front-office/threads/:threadKey/messages` параметрами `afterId` и `limit`;
- включить polling с курсором (`5s`) в `ExternalFrontOfficeThreadClient`;
- убрать Telegram-only ограничение в reply-пути для `web_chat`;
- расширить reply-ответ полями `deliveryStatus`, `channel`, `messageId`, `createdAt`.

Что меняется:

- внешний контур получает предсказуемый вход, ответ и инкрементальное обновление ленты.

### `C3` — внутренний governed чат

Что входит:

- закрепить канонический путь через `POST /api/rai/chat`;
- оставить `/api/ai-chat` только как legacy-совместимость;
- удерживать стабильность `thread continuity`, `pending clarification resume`, `work window state`;
- запретить внешний доступ к внутреннему чату.

Что меняется:

- внутренний контур работает через единый runtime вход без дублирующей логики.

### `C4` — explainability/evidence в UI

Что входит:

- во внешнем портале показывать минимальный explainability-блок у сообщений;
- во внутреннем `AiChat` удерживать отображение `work windows`, `trust summary`, `evidence`;
- закрыть мост чтения из `workflow_explainability` и `execution_loop_summary`.

Что меняется:

- пользователь видит не только сообщение, но и контекст объяснимости/доказательств.

### `C5` — минимальная модель ролей и security-аудит

Что входит:

- `FRONT_OFFICE_USER` получает только viewer-scoped thread-действия в своём `accountId`;
- внутренние роли сохраняют доступ к `rai/chat` и операторским front-office действиям;
- отказанные доступы пишутся в audit как security-события.

Что меняется:

- модель доступа становится минимальной, предсказуемой и проверяемой через audit.

## 2. Изменения API и контрактов

Обязательный API-срез `Phase C`:

1. `POST /portal/front-office/intake/message`.
2. `GET /portal/front-office/threads/:threadKey/messages?afterId&limit`.
3. reply-ответ включает `deliveryStatus`, `channel`, `messageId`, `createdAt`.
4. `FrontOfficeThreadMessage` включает `deliveryStatus` и поля:
   - `metadata.explainabilitySummary`
   - `metadata.evidenceCount`.
5. UI-контракт доступа: источник роли и capability-флагов — authenticated principal, не simulation-store.

## 3. Тестовый план

Backend:

- `web_chat` e2e: `new inbound -> routing -> reply -> read`;
- controller/service тесты на intake endpoint и viewer isolation;
- покрытие non-telegram delivery ветки для `web_chat`.

Web:

- route-guard тесты для `FRONT_OFFICE_USER`;
- тесты `ExternalFrontOfficeThreadClient` на polling + delivery-status;
- regression-тесты `AiChatStore` на восстановление `threadId` и `pending clarification`.

Smoke-приёмка:

- внешний путь: `login -> thread list -> thread -> send -> response -> read marker`;
- внутренний путь: `AiChat -> message -> work windows -> explainability`;
- проверка `403` для внешней роли на внутренние endpoints.

## 4. Exit-критерии `Phase C`

`Phase C` закрывается, когда одновременно выполнены условия:

1. Для внешнего контура стабилен путь `login -> session -> thread -> message -> response`.
2. Для `web_chat` работает viewer-scoped inbound endpoint и polling с курсором.
3. Reply-путь для `web_chat` не зависит от Telegram transport.
4. Внешний контур не имеет доступа к внутреннему `AiChat` runtime.
5. Внутренний чат использует канонический путь `/api/rai/chat`; `/api/ai-chat` остаётся только legacy proxy.
6. Explainability/evidence видимы в UI обоих контуров.
7. `FRONT_OFFICE_USER` ограничен своим `accountId` и только viewer-scoped действиями.
8. Отказанные доступы фиксируются в audit как security-события.

## 5. Допущения

1. `Phase C` закрывается в текстовом baseline (`photo/voice/file` остаются следующей итерацией).
2. Realtime в `Phase C` — только polling (`5s`), без `SSE/WebSocket`.
3. Новые agent roles и расширение автономии в `Phase C` запрещены.
4. Работы `Phase D` (`installability`, `backup/restore`, pilot-hardening) не входят в объём `Phase C`.
