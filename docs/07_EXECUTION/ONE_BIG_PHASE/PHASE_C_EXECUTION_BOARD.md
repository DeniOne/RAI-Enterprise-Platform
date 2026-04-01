---
id: DOC-EXE-ONE-BIG-PHASE-C-EXECUTION-BOARD-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-C-EXECUTION-BOARD-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_NEW_CHAT_MEMO.md;apps/api/src/modules/front-office/front-office-external.controller.ts;apps/api/src/modules/front-office/front-office.service.ts;apps/api/src/shared/front-office/front-office-threading.service.ts;apps/api/src/shared/front-office/front-office-communication.repository.ts;apps/api/src/shared/auth/roles.guard.ts;apps/web/app/(app)/layout.tsx;apps/web/middleware.ts;apps/web/components/layouts/AppShell.tsx;apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx
---
# PHASE C EXECUTION BOARD

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-C-EXECUTION-BOARD-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот файл — живой execution-board для `Phase C`. Он фиксирует только управленческие строки с кодами `C-2.x.y`, статусами `open/in_progress/guard_active/done`, доказательствами и ближайшим действием.

## 1. Правила статусов

- `open` — строка ещё не сдвинута как execution-единица.
- `in_progress` — реализация начата, но exit-критерий строки не закрыт.
- `guard_active` — действует обязательное ограничение, которое нужно удерживать.
- `done` — строка закрыта по смыслу и подтверждена evidence.

## 2. Треки `Phase C`

- `C0` — scope lock и board-дисциплина
- `C1` — доступ, роли, сессии
- `C2` — внешний портал
- `C3` — внутренний governed чат
- `C4` — explainability/evidence в UI
- `C5` — минимальная роль-модель и security-аудит

## 3. Execution board

| Track | ID | Blocker | Owner | Статус | Evidence | Next action |
|---|---|---|---|---|---|---|
| `C0` | `C-2.1.1` | Зафиксировать границы `Phase C` против `Phase D` и carry-over `Phase B` | `techlead / product-governance` | `done` | [PHASE_C_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_IMPLEMENTATION_PLAN.md), [PHASE_C_NEW_CHAT_MEMO.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_NEW_CHAT_MEMO.md), [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md) | удерживать правило: в `C` поднимать только блокеры `B-2.4.2` и `B-2.5.2` |
| `C0` | `C-2.1.2` | Перевести фазу в board-режим с кодами `C-2.x.y` | `techlead` | `done` | [PHASE_C_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_EXECUTION_BOARD.md) | обновлять только `status/evidence/next action`, не размножать side-списки |
| `C0` | `C-2.1.3` | Не тянуть в `C` installability, recovery и pilot-hardening | `product-governance` | `guard_active` | [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md), [PHASE_C_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_IMPLEMENTATION_PLAN.md) | не принимать задачи `D`-контуров в `C` backlog |
| `C1` | `C-2.2.1` | Убрать runtime-зависимость от role simulation | `web / auth` | `done` | [Providers.tsx](/root/RAI_EP/apps/web/core/governance/Providers.tsx), [GovernanceBar.tsx](/root/RAI_EP/apps/web/shared/components/GovernanceBar.tsx) | удерживать источник роли из `/users/me` как единственный для UI-решений доступа |
| `C1` | `C-2.2.2` | Ограничить `FRONT_OFFICE_USER` только `portal/front-office` | `web / auth` | `done` | [middleware.ts](/root/RAI_EP/apps/web/middleware.ts), [app/(app)/layout.tsx](/root/RAI_EP/apps/web/app/(app)/layout.tsx), [AppShell.tsx](/root/RAI_EP/apps/web/components/layouts/AppShell.tsx) | удерживать redirect/guard политику при добавлении новых `(app)` маршрутов |
| `C1` | `C-2.2.3` | Включить единые session-guards для рабочих `(app)` маршрутов | `web / auth` | `done` | [middleware.ts](/root/RAI_EP/apps/web/middleware.ts), [app/(app)/layout.tsx](/root/RAI_EP/apps/web/app/(app)/layout.tsx) | держать mandatory-auth guard для `(app)` и не возвращать anonymous fallback |
| `C1` | `C-2.2.4` | Не допускать возврата simulation-роли в доступные UI-path | `web / governance` | `guard_active` | [Providers.tsx](/root/RAI_EP/apps/web/core/governance/Providers.tsx), [route-guard-front-office.spec.ts](/root/RAI_EP/apps/web/__tests__/route-guard-front-office.spec.ts) | проверять новые UI-компоненты на отсутствие simulation override в access path |
| `C2` | `C-2.3.1` | Добавить viewer-scoped inbound endpoint для `web_chat` | `api / front-office` | `done` | [front-office-external.controller.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office-external.controller.ts), [front-office.service.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office.service.ts), [front-office.service.spec.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office.service.spec.ts) | удерживать endpoint как единую точку старта inbound из внешнего контура |
| `C2` | `C-2.3.2` | Дать предсказуемый polling с курсором (`afterId/limit`) | `api + web` | `done` | [front-office-communication.repository.ts](/root/RAI_EP/apps/api/src/shared/front-office/front-office-communication.repository.ts), [front-office.ts](/root/RAI_EP/apps/web/lib/api/front-office.ts), [ExternalFrontOfficeThreadClient.tsx](/root/RAI_EP/apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx), [external-front-office-thread-client.spec.tsx](/root/RAI_EP/apps/web/__tests__/external-front-office-thread-client.spec.tsx) | удерживать polling contract при дальнейших изменениях message-feed |
| `C2` | `C-2.3.3` | Убрать Telegram-only ограничение из reply для `web_chat` | `api / front-office` | `done` | [front-office-threading.service.ts](/root/RAI_EP/apps/api/src/shared/front-office/front-office-threading.service.ts), [front-office.e2e.spec.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office.e2e.spec.ts) | удерживать thread-store delivery path для non-telegram каналов |
| `C2` | `C-2.3.4` | Расширить reply-контракт полями delivery/channel/message/createdAt | `api + web` | `done` | [front-office-threading.service.ts](/root/RAI_EP/apps/api/src/shared/front-office/front-office-threading.service.ts), [front-office.ts](/root/RAI_EP/apps/web/lib/api/front-office.ts), [ExternalFrontOfficeThreadClient.tsx](/root/RAI_EP/apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx) | держать единый контракт ответа для внешних клиентов |
| `C3` | `C-2.4.1` | Закрепить `POST /api/rai/chat` как канон и оставить `/api/ai-chat` только legacy proxy | `web + api` | `done` | [api.ts](/root/RAI_EP/apps/web/lib/api.ts), [app/api/ai-chat/route.ts](/root/RAI_EP/apps/web/app/api/ai-chat/route.ts) | не добавлять новую бизнес-логику в legacy route |
| `C3` | `C-2.4.2` | Удержать `thread continuity`, `pending clarification resume`, `work window state` после reload/route-change | `web / ai-chat` | `done` | [ai-chat-store.spec.ts](/root/RAI_EP/apps/web/__tests__/ai-chat-store.spec.ts), [ai-chat-sessions-strip.spec.tsx](/root/RAI_EP/apps/web/__tests__/ai-chat-sessions-strip.spec.tsx), [ai-chat-widgets-rail.spec.tsx](/root/RAI_EP/apps/web/__tests__/ai-chat-widgets-rail.spec.tsx) | удерживать rehydrate + route-change regression в `ai-chat-store` suite при изменениях persist-слоя |
| `C3` | `C-2.4.3` | Закрыть доступ внешнего контура к внутреннему чату | `api / auth` | `done` | [rbac.constants.ts](/root/RAI_EP/apps/api/src/shared/auth/rbac.constants.ts), [roles.guard.ts](/root/RAI_EP/apps/api/src/shared/auth/roles.guard.ts), [middleware.ts](/root/RAI_EP/apps/web/middleware.ts) | удерживать `FRONT_OFFICE_USER` вне `rai/chat` и внутренних маршрутов |
| `C4` | `C-2.5.1` | Показать explainability/evidence минимум во внешнем портале | `web / front-office` | `done` | [ExternalFrontOfficeThreadClient.tsx](/root/RAI_EP/apps/web/components/front-office/ExternalFrontOfficeThreadClient.tsx), [front-office-communication.repository.ts](/root/RAI_EP/apps/api/src/shared/front-office/front-office-communication.repository.ts) | удерживать explainability summary как часть message metadata |
| `C4` | `C-2.5.2` | Удержать `work windows`, `trust summary`, `evidence` во внутреннем `AiChat` | `web / ai-chat` | `done` | [AiChatPanel.tsx](/root/RAI_EP/apps/web/components/ai-chat/AiChatPanel.tsx), [RaiOutputOverlay.tsx](/root/RAI_EP/apps/web/components/ai-chat/RaiOutputOverlay.tsx), [rai-chat-response-adapter.ts](/root/RAI_EP/apps/web/lib/rai-chat-response-adapter.ts) | не выводить внутренний chat layer во внешний contour |
| `C4` | `C-2.5.3` | Дать минимальный read-bridge из `workflow_explainability` и `execution_loop_summary` | `api / front-office` | `done` | [front-office-communication.repository.ts](/root/RAI_EP/apps/api/src/shared/front-office/front-office-communication.repository.ts), [tech-map.service.ts](/root/RAI_EP/apps/api/src/modules/tech-map/tech-map.service.ts) | удерживать metadata enrichment без дублирования explainability-логики на фронте |
| `C5` | `C-2.6.1` | Ограничить `FRONT_OFFICE_USER` viewer-scoped действиями своего `accountId` | `api / front-office` | `done` | [front-office-threading.service.ts](/root/RAI_EP/apps/api/src/shared/front-office/front-office-threading.service.ts), [front-office.service.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office.service.ts), [front-office.e2e.spec.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office.e2e.spec.ts) | удерживать account-bound проверку при расширении внешних endpoint |
| `C5` | `C-2.6.2` | Сохранять разделение ролей: внутренние роли — `rai/chat` и операторские действия | `api / auth` | `done` | [rbac.constants.ts](/root/RAI_EP/apps/api/src/shared/auth/rbac.constants.ts), [rai-chat.controller.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.controller.ts) | не расширять роль-периметр без отдельного governance решения |
| `C5` | `C-2.6.3` | Писать отказанные доступы в audit как security-события | `api / security` | `done` | [front-office.service.ts](/root/RAI_EP/apps/api/src/modules/front-office/front-office.service.ts), [roles.guard.ts](/root/RAI_EP/apps/api/src/shared/auth/roles.guard.ts) | удерживать security logging при всех access-denied ветках |

## 4. Exit-критерии фазы

`Phase C` закрывается только когда одновременно:

1. строки `C-2.1.*` и `C-2.2.*` не имеют `open/in_progress`;
2. внешний путь `login -> session -> thread -> message -> response -> read` проходит smoke-приёмку;
3. `web_chat` путь подтверждён e2e (`new inbound -> routing -> reply -> read`);
4. внутренний `AiChat` path подтверждает restore (`thread/pending clarification/work windows`) после reload;
5. для внешней роли подтверждён запрет на внутренние endpoints (`403` + audit событие);
6. explainability/evidence видимы в обоих контурах и опираются на runtime-контракт.
