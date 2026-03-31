---
id: DOC-EXE-ONE-BIG-PHASE-A3-TOOL-PERMISSION-MATRIX-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-TOOL-PERMISSION-MATRIX-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;apps/api/src/modules/rai-chat/agent-registry.service.ts;apps/api/src/shared/rai-chat/rai-tools.types.ts;apps/api/src/modules/rai-chat/agent-runtime-config.service.ts;apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts;apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts;apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts
---
# PHASE A3 TOOL PERMISSION MATRIX

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-TOOL-PERMISSION-MATRIX-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует default governed tool-perimeter для `Tier 1` по текущему runtime-коду. Это не заменяет tenant-specific runtime config: при конфликте приоритет у `code/tests/gates`.

## 1. Источник истины для матрицы

Матрица собрана из пяти слоёв runtime truth:

1. `DEFAULT_TOOL_BINDINGS` в [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
2. `TOOL_RISK_MAP` в [rai-tools.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/rai-tools.types.ts)
3. `resolveToolAccess` в [agent-runtime-config.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-runtime-config.service.ts)
4. risk-verdict логика в [risk-policy-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts)
5. autonomy/human gate enforcement в [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts)

Дополнительно integration snapshot в [runtime-spine.integration.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts) подтверждает базовый global-perimeter для `agronomist`, `economist`, `knowledge`, `monitoring`.

## 2. Универсальные правила доступа к tools

| Правило | Что подтверждено кодом | Практический смысл |
|---|---|---|
| `READ` tools можно выполнять без human gate, если tool разрешён role/config | `TOOL_RISK_MAP`, `RiskPolicyEngineService.evaluate()` | read/advisory операции составляют базовый безопасный слой |
| `WRITE` tools не являются свободно автономными | `rai-tools.registry.ts`, `RiskPolicyEngineService` | для write-path нужен governed runtime, а не просто наличие tool |
| `CRITICAL` tools требуют `REQUIRES_TWO_PERSON_APPROVAL` | `risk-policy-engine.service.ts` | commerce critical-path нельзя считать Tier-1-safe без усиленного human gate |
| `QUARANTINE` блокирует все `WRITE/CRITICAL` | `rai-tools.registry.ts`, `autonomy-policy.service.ts` | при деградации качества AI остаётся только read-perimeter |
| `TOOL_FIRST` превращает non-read tool call в `PendingAction` | `rai-tools.registry.ts` | даже разрешённый tool остаётся human-gated при повышенном autonomy risk |
| direct CRM write — ограниченное исключение | `rai-tools.registry.ts` | CRM write может пройти без `PendingAction` только как прямое подтверждённое действие пользователя |
| отсутствие binding в runtime config = deny для governed tools | `agent-runtime-config.service.ts` | role/tool матрица не только документ, но и runtime allowlist |

## 3. Built-in system tools

| Tool | Risk | Domain | Default meaning |
|---|---|---|---|
| `echo_message` | `READ` | `knowledge` | built-in debug/echo, read-only |
| `workspace_snapshot` | `READ` | `knowledge` | built-in context snapshot, read-only |

Эти built-in tools не являются high-impact operational path и не расширяют agent autonomy.

## 4. Default role-to-tool matrix

| Role | Default capability | Tool | Risk | Domain | Permission rule для `Tier 1` |
|---|---|---|---|---|---|
| `agronomist` | `AgroToolsRegistry` | `compute_deviations` | `READ` | `agro` | разрешён как governed read/advisory |
| `agronomist` | `AgroToolsRegistry` | `generate_tech_map_draft` | `WRITE` | `agro` | разрешён только через risk/autonomy gate; не автономный execute-path |
| `economist` | `FinanceToolsRegistry` | `compute_plan_fact` | `READ` | `finance` | разрешён как governed read/advisory |
| `economist` | `FinanceToolsRegistry` | `simulate_scenario` | `READ` | `finance` | разрешён как governed read/advisory |
| `economist` | `FinanceToolsRegistry` | `compute_risk_assessment` | `READ` | `finance` | разрешён как governed read/advisory |
| `knowledge` | `KnowledgeToolsRegistry` | `query_knowledge` | `READ` | `knowledge` | разрешён как RAG/read-only path |
| `monitoring` | `RiskToolsRegistry` | `get_weather_forecast` | `READ` | `risk` | разрешён как monitoring read |
| `monitoring` | `RiskToolsRegistry` | `emit_alerts` | `WRITE` | `risk` | разрешён только через governed human gate; не автономный write |
| `crm_agent` | `CrmToolsRegistry` | `lookup_counterparty_by_inn` | `READ` | `crm` | разрешён как CRM read |
| `crm_agent` | `CrmToolsRegistry` | `get_crm_account_workspace` | `READ` | `crm` | разрешён как CRM read |
| `crm_agent` | `CrmToolsRegistry` | `register_counterparty` | `WRITE` | `crm` | governed write; direct user-confirmed CRM flow имеет ограничённое исключение |
| `crm_agent` | `CrmToolsRegistry` | `create_counterparty_relation` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `create_crm_account` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `update_crm_account` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `create_crm_contact` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `update_crm_contact` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `delete_crm_contact` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `create_crm_interaction` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `update_crm_interaction` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `delete_crm_interaction` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `create_crm_obligation` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `update_crm_obligation` | `WRITE` | `crm` | governed write, human-gated |
| `crm_agent` | `CrmToolsRegistry` | `delete_crm_obligation` | `WRITE` | `crm` | governed write, human-gated |
| `front_office_agent` | `FrontOfficeToolsRegistry` | `log_dialog_message` | `READ` | `front_office` | разрешён как ingress/read path |
| `front_office_agent` | `FrontOfficeToolsRegistry` | `classify_dialog_thread` | `READ` | `front_office` | разрешён как governed classification |
| `front_office_agent` | `FrontOfficeToolsRegistry` | `create_front_office_escalation` | `WRITE` | `front_office` | governed write, human-gated; route/thread context обязателен |
| `contracts_agent` | `ContractsToolsRegistry` | `list_commerce_contracts` | `READ` | `commerce` | разрешён как read |
| `contracts_agent` | `ContractsToolsRegistry` | `get_commerce_contract` | `READ` | `commerce` | разрешён как read |
| `contracts_agent` | `ContractsToolsRegistry` | `list_fulfillment_events` | `READ` | `commerce` | разрешён как read |
| `contracts_agent` | `ContractsToolsRegistry` | `list_invoices` | `READ` | `commerce` | разрешён как read |
| `contracts_agent` | `ContractsToolsRegistry` | `get_ar_balance` | `READ` | `commerce` | разрешён как read |
| `contracts_agent` | `ContractsToolsRegistry` | `create_commerce_contract` | `WRITE` | `commerce` | governed write, human-gated |
| `contracts_agent` | `ContractsToolsRegistry` | `create_commerce_obligation` | `WRITE` | `commerce` | governed write, human-gated |
| `contracts_agent` | `ContractsToolsRegistry` | `create_fulfillment_event` | `WRITE` | `commerce` | governed write, human-gated |
| `contracts_agent` | `ContractsToolsRegistry` | `create_invoice_from_fulfillment` | `WRITE` | `commerce` | governed write, human-gated |
| `contracts_agent` | `ContractsToolsRegistry` | `create_payment` | `WRITE` | `commerce` | governed write, human-gated |
| `contracts_agent` | `ContractsToolsRegistry` | `post_invoice` | `CRITICAL` | `commerce` | запрещён как свободный `Tier 1` execute-path; нужен усиленный human gate |
| `contracts_agent` | `ContractsToolsRegistry` | `confirm_payment` | `CRITICAL` | `commerce` | запрещён как свободный `Tier 1` execute-path; нужен усиленный human gate |
| `contracts_agent` | `ContractsToolsRegistry` | `allocate_payment` | `CRITICAL` | `commerce` | запрещён как свободный `Tier 1` execute-path; нужен усиленный human gate |
| `chief_agronomist` | `ExpertModule` | `none by default` | `n/a` | `agro_expert` | advisory-only until explicit governed tool policy appears |
| `data_scientist` | `ExpertModule` | `none by default` | `n/a` | `data_science` | advisory-only until explicit governed tool policy appears |

## 5. Что эта матрица уже решает

Матрица уже снимает двусмысленность по трём вопросам:

1. Какие tools вообще входят в default governed perimeter по role.
2. Где read/advisory слой действительно безопасен для `Tier 1`.
3. Какие write/critical paths нельзя трактовать как допустимую автономию.

## 6. Что матрица ещё не закрывает

Эта матрица сама по себе ещё не закрывает:

- universal `HITL matrix`
- отдельный `advisory-only` register по high-impact flows
- formal `eval-suite`
- tenant-specific override review

Поэтому `A3.1` можно переводить в рабочий execution-state, но не в полный `done` для всего трека `A3`.
