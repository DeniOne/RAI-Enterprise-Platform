---
id: DOC-EXE-ONE-BIG-PHASE-A3-HITL-MATRIX-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-HITL-MATRIX-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md;apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts;apps/api/src/modules/rai-chat/security/pending-action.service.ts;apps/api/src/modules/rai-chat/pending-actions.controller.ts;apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts;apps/api/src/modules/rai-chat/autonomy-policy.service.ts;apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts
---
# PHASE A3 HITL MATRIX

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-HITL-MATRIX-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует текущую `human-in-the-loop` схему для `Tier 1` по реальному runtime-коду. Это не общий policy-манифест, а execution-артефакт для того, чтобы high-impact действия не интерпретировались “по ощущениям”.

## 1. Источник истины для HITL

Матрица собрана по текущему runtime-контракту:

1. `RiskPolicyEngineService.evaluate()` в [risk-policy-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts)
2. `PendingActionService` в [pending-action.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/pending-action.service.ts)
3. `PendingActionsController` в [pending-actions.controller.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/pending-actions.controller.ts)
4. execution blocking и `PendingAction` creation в [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts)
5. autonomy degradation logic в [autonomy-policy.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/autonomy-policy.service.ts)
6. behavioural tests в [supervisor-agent.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts)

При конфликте между этим документом и любым planning-текстом приоритет у `code/tests/gates`.

## 2. Универсальные правила HITL

| Правило | Что подтверждено кодом | Практический смысл |
|---|---|---|
| `READ` не требует human gate | `RiskPolicyEngineService.evaluate()` возвращает `ALLOWED` | безопасный advisory/read слой остаётся без `PendingAction` |
| любой `WRITE/CRITICAL`, который попадает под `RiskPolicy` или `TOOL_FIRST`, создаёт `PendingAction` | [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts) | агент не может сам завершить high-impact action |
| `PendingAction` имеет текущую фактическую двухшаговую цепочку | `approveFirst()` и `approveFinal()` в `PendingActionService` | даже когда вердикт называется `REQUIRES_USER_CONFIRMATION`, runtime сейчас ведёт через два статуса approval |
| финальный sign-off и execute-path требуют `ADMIN/CEO` | `PendingActionsController.approveFinal()` и `.execute()` | high-impact action не закрывается только первым review |
| `QUARANTINE` режет все `WRITE/CRITICAL` до read-only | `AutonomyPolicyService` + `rai-tools.registry.ts` | при quality drift система принудительно уходит в безопасный режим |
| `TOOL_FIRST` переводит non-read path в `PendingAction`, даже если сам tool разрешён role/config | `rai-tools.registry.ts` | разрешённый tool не равен свободной автономии |
| direct CRM write — узкое исключение, а не общий bypass | `directCrmUserWrite` в [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts) и тест в [supervisor-agent.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts) | только прямое подтверждённое действие пользователя может пройти без общего `PendingAction`-паттерна, и это нельзя расширять на другие write-flows |

## 3. Лестница HITL для `Tier 1`

| HITL level | Runtime form | Что это значит |
|---|---|---|
| `H0` | `No human gate` | read/advisory path, `PendingAction` не создаётся |
| `H1` | `Human review required` | человек обязан просмотреть payload и смысл действия до продолжения потока |
| `H2` | `Human confirmation required` | создаётся `PendingAction`; нужен как минимум первый approval |
| `H3` | `Final sign-off required` | нужен `approveFinal` от `ADMIN/CEO` перед execute-path |
| `H4` | `Two-person approval` | критичный path; требуется двухэтапный approval, а не одно подтверждение |
| `H5` | `Blocked / advisory-only` | execution-path для `Tier 1` запрещён, остаётся только объяснение или draft |

## 4. Current HITL matrix by flow class

| Flow class | Typical tools / path | Risk source | HITL level | Current runtime rule для `Tier 1` |
|---|---|---|---|---|
| `Read / evidence / RAG` | `query_knowledge`, `compute_plan_fact`, `simulate_scenario`, `get_weather_forecast`, `workspace_snapshot` | `READ` | `H0` | выполняется без `PendingAction`, но остаётся в explainability/audit контуре |
| `Agro draft / change proposal` | `generate_tech_map_draft` | `WRITE`, domain `agro` | `H2 -> H3` | runtime создаёт `PendingAction`; для завершения нужен approval-chain, свободный execute-path запрещён |
| `Risk alert write` | `emit_alerts` | `WRITE`, domain `risk` | `H2 -> H3` | alerts не идут напрямую; сначала `PendingAction`, затем final sign-off |
| `CRM governed write` | `register_counterparty`, `create_crm_account`, `create_crm_contact`, `create_crm_obligation` и другие `crm` write-tools | `WRITE`, domain `crm` | `H2 -> H3` | по умолчанию governed write через `PendingAction`; narrow direct-user exception не распространяется на autonomous path |
| `Front-office escalation write` | `create_front_office_escalation` | `WRITE`, domain `front_office` | `H2 -> H3` | escalation требует governed confirmation; route/thread context обязателен |
| `Commerce non-critical write` | `create_commerce_contract`, `create_commerce_obligation`, `create_invoice_from_fulfillment`, `create_payment` | `WRITE`, domain `commerce` | `H2 -> H3` | runtime блокирует свободное выполнение и отправляет в approval-chain |
| `Commerce critical posting` | `post_invoice`, `confirm_payment`, `allocate_payment` | `CRITICAL`, domain `commerce` | `H4` | считается критичным path; нужен усиленный two-person approval и final privileged sign-off |
| `Finance write reserve` | потенциальные future `WRITE` tools в `finance` | `WRITE`, domain `finance` | `H3` | `RiskPolicy` уже требует director-style confirmation; в текущем default Tier `finance` write-tools не активированы |
| `Autonomy degraded mode` | любой non-read tool при `TOOL_FIRST` | autonomy policy | `H2 -> H3` | даже разрешённый tool переводится в `PendingAction`, пока качество не вернулось в безопасный режим |
| `Autonomy quarantine` | любой `WRITE/CRITICAL` при `QUARANTINE` | autonomy policy | `H5` | execute-path блокируется полностью, остаётся только read/advisory |
| `Expert roles without explicit tool policy` | `chief_agronomist`, `data_scientist` | no explicit bindings | `H5` | по умолчанию advisory-only до появления отдельного governed tool policy |

## 5. Кто именно участвует в human gate

| Шаг | Что делает человек | Что подтверждено кодом |
|---|---|---|
| `review` | проверяет payload и смысл действия до продолжения | `PendingAction` создаётся до вызова handler |
| `approve-first` | переводит действие из `PENDING` в `APPROVED_FIRST` | `PendingActionService.approveFirst()` |
| `final sign-off` | переводит действие в `APPROVED_FINAL` | `PendingActionService.approveFinal()` |
| `execute approved action` | запускает tool с `approvedPendingActionId` и `userConfirmed=true` | `PendingActionsController.executeApprovedAction()` |

Текущее важное ограничение:

- `approveFinal` и `execute` разрешены только для `ADMIN/CEO`;
- значит даже `REQUIRES_USER_CONFIRMATION` в текущем runtime фактически заканчивается privileged final sign-off, а не произвольным пользовательским кликом.

## 6. Что эта матрица уже решает

Матрица уже убирает двусмысленность по трём вопросам:

1. Где human gate вообще не нужен.
2. Какие write/critical paths проходят через обязательный approval-chain.
3. Какие действия для `Tier 1` нельзя трактовать как допустимую автономию даже при наличии tool-binding.

## 7. Что матрица ещё не закрывает

Эта матрица сама по себе ещё не закрывает:

- product-level `advisory-only` register по high-impact business actions;
- formal `eval-suite`, который проверяет обходы `HITL`;
- tenant-specific governance overrides;
- UX-контракт для `web/chat` confirmation flow.

Поэтому `A3.2` можно переводить в рабочий execution-state, но не в полный `done` для всего трека `A3`.
