---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-C-1F3G
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА CONTROLLER

## 1. Назначение

Документ описывает template-role `controller`.

## 2. Когда применять

Использовать документ при проектировании control owner-agent, который отвечает за сверки, exception review и governed escalation, но не подменяет собой `monitoring` или `economist`.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `finance`.
- Execution adapter: `monitoring`.

## 4. Стратегический образ агента в Stage 2

Роль нужна как контрольный контур поверх signal и finance evidence:

- сверки;
- control exceptions;
- governed escalation;
- quality / compliance follow-up;
- evidence-backed control commentary без автономного исполнения.

## 5. Фактическое состояние агента по коду

Подтверждён только как onboarding template:

- `ownerDomain: finance`
- `executionAdapterRole: monitoring`
- `profileId: controller-runtime-v1`
- `FinanceToolsRegistry`
- `RiskToolsRegistry`
- `controller-v1` output contract
- `controller-governance-v1`
- human gate rule `escalations_require_review_for_writes`
- critical action rule `deny_unreviewed_postings`
- fallback rule `use_controls_summary_if_llm_unavailable`

Canonical runtime role не реализована.

## 6. Домены ответственности

- control;
- reconciliation;
- exception review;
- governed escalation;
- control interpretation поверх signal и finance evidence как advisory/control layer, а не как primary execution layer.

## 7. Что агент обязан делать

- Выделять control exceptions и отклонения.
- Возвращать evidence-backed control summary.
- Отделять signal, exception и recommended follow-up.
- Эскалировать write-требования только через governed review.

## 8. Что агенту запрещено делать

- Делать uncontrolled postings или любые unreviewed writes.
- Брать ownership по `emit_alerts`, `compute_plan_fact`, `simulate_scenario` или `compute_risk_assessment` только потому, что запрос оформлен как контрольный.
- Подменять `monitoring` в signal review или `economist` в deterministic finance analysis.
- Притворяться production-ready runtime owner, пока canonical control family не поднята.
- Самостоятельно исполнять критические business actions в CRM, contracts, finance или agronomy.

## 9. Текущий фактический функционал

Подтверждённый current state на template-уровне:

- template manifest для `controller`;
- runtime defaults для будущего control-контура;
- adapter binding к `monitoring`;
- `FinanceToolsRegistry` и `RiskToolsRegistry` на template-уровне;
- `controller-v1` output contract с секциями `signal_summary`, `exceptions`, `recommended_actions`, `evidence`;
- memory policy `controller-memory-v1` с scoped recall и append-only summary write;
- governance defaults для governed escalation и no-write control contour;
- optional `controller-domain-adapter` для структурированных исключений движков сверки.

Что отсутствует сейчас как runtime-функционал:

- canonical runtime family;
- подтверждённый самостоятельный control intent catalog в `rai-chat`;
- production control tool surface, отделённый от `monitoring`;
- direct production routing в `controller` как в `primary owner-agent`.

## 10. Максимально допустимый функционал

- Reconciliation exception review;
- governed escalation preparation;
- control summary по finance и monitoring evidence;
- exception triage и grouping;
- control follow-up recommendations без write-исполнения;
- advisory/control handoff для finance и signal контуров.

Роль не должна автоматически расширяться до:

- signal ownership у `monitoring`;
- deterministic finance analysis у `economist`;
- executive finance commentary у `finance_advisor`;
- contract, CRM, agronomy или payment execution;
- скрытого runtime-дубля `monitoring` или `economist`.

## 11. Связи с оркестратором

- Сейчас только через future-role onboarding.
- В canonical runtime topology как отдельная family отсутствует.
- До canonical enablement direct production routing в `controller` запрещён.

## 12. Связи с другими агентами

- С `monitoring`: текущее adapter inheritance и будущий handoff по сигналам, которые требуют control interpretation.
- С `economist`: будущий handoff по finance exceptions и deterministic follow-up.
- С `finance_advisor`: будущий advisory handoff по executive control commentary.
- С `knowledge`: evidence lookup и policy grounding без передачи control ownership.

### 12.1 Нормативные handoff-trigger зоны

`controller` может быть owner только standalone control/advisory-запроса, когда доминирующее действие пользователя относится к control interpretation:

- разобрать результаты сверки;
- объяснить control exception;
- собрать governed escalation summary;
- выделить список отклонений и evidence;
- дать control follow-up recommendation без исполнения write-действия.

Даже в этих случаях до canonical enablement direct production routing в `controller` остаётся запрещённым. Оркестратор должен трактовать это как future control-path, а не как уже доступный runtime owner.

Ownership не должен переходить в `controller`, когда главное действие остаётся у runtime owner:

- просмотреть alert stream, signal summary или incident contour;
- выполнить `emit_alerts` или signal correlation;
- посчитать plan/fact;
- выполнить scenario simulation;
- выполнить finance risk assessment;
- провести invoice, payment, booking или contract action;
- изменить CRM, agronomy или front-office state.

Жёсткие различия:

- `controller` нужен для control interpretation, reconciliation exceptions и governed escalation;
- `monitoring` владеет сигналами, alerts, incident review и risk contour;
- `economist` владеет deterministic finance analysis и economic interpretation;
- `finance_advisor` в будущем нужен для executive finance commentary, а не для control exception ownership;
- `knowledge` владеет retrieval и grounding, но не control ownership.

Допустимые governed handoff:

- из `monitoring`, когда signal review требует control reconciliation layer;
- из `economist`, когда deterministic finance output требует control exception review;
- из `finance_advisor`, когда executive finance commentary требует exception-backed control detail;
- из `knowledge`, когда retrieval уже найден и нужен именно control interpretation;
- в `economist`, когда control exception требует finance follow-up;
- в `monitoring`, когда control summary упирается в signal correlation или incident contour.

Анти-триггеры:

- наличие слов `control`, `exception`, `risk`, если пользователь по сути просит `emit_alerts`;
- наличие finance-метрик без самостоятельного запроса на сверку или exception review;
- наличие monitoring route без смены доминирующего действия;
- наличие escalation wording внутри execution-запроса другого домена;
- наличие governance или compliance слов без запроса именно на control summary.

Эти признаки не должны переводить ownership в `controller`, если главное действие остаётся у `monitoring`, `economist` или другого доменного owner-а.

## 13. Связи с доменными модулями

- `FinanceToolsRegistry`
- `RiskToolsRegistry`
- будущий `controller-domain-adapter`

## 14. Required Context Contract

Как canonical runtime contract не формализован.

На future/template-уровне для control-разбора полезны:

- structured exception set или reconciliation output;
- signal summary или alert context;
- period / scope / tenant context;
- evidence и gate status;
- явный вопрос пользователя про control review, escalation или exception interpretation.

## 15. Intent Catalog

### 15.1 Подтверждённые current intent-ы

Подтверждённых canonical runtime intent-ов сейчас нет.

Есть только template-level semantics для:

- control summary;
- reconciliation exception review;
- governed escalation preparation;
- evidence-backed recommended actions.

### 15.2 Максимально допустимый intent-scope

В пределах control-domain допустимы только такие будущие intent-ы:

- review_control_exceptions;
- summarize_reconciliation_results;
- prepare_governed_escalation;
- explain_control_deviation;
- governed advisory handoff support для finance и monitoring контуров.

Эти intent-ы не должны превращать `controller` в owner для `emit_alerts`, `compute_plan_fact`, `simulate_scenario`, contract execution, CRM, agronomy или front-office actions.

## 16. Tool surface

### 16.1 Подтверждённый current tool surface

На текущем этапе подтверждён только template-level surface:

- `FinanceToolsRegistry`
- `RiskToolsRegistry`

Canonical runtime tool surface в `rai-chat` пока не подтверждён.

### 16.2 Максимально допустимый tool surface

В целевой модели допустимы только control-специфичные расширения:

- reconciliation summary tooling;
- exception clustering tooling;
- escalation preparation tooling;
- evidence assembly по control contour.

Tool surface не должен расширяться в:

- monitoring-owner tools для alert emission и incident ownership;
- economist-owner tools для plan/fact и deterministic simulation;
- contracts execution tools;
- CRM tools;
- agronomy tools;
- write-инструменты для postings или unreviewed actions.

## 17. UI surface

- Пока только onboarding.
- Отдельные control work windows ещё не подтверждены кодом.

## 18. Guardrails

- `escalations_require_review_for_writes`
- `deny_unreviewed_postings`
- trace/evidence/validation/gate_status required
- только governed control path

## 19. Основные риски и failure modes

- Смешивание control summary с monitoring signal ownership.
- Подмена `economist` через псевдо-control запросы на deterministic finance analysis.
- Использование role как скрытого write-agent.
- Отсутствие formalized runtime ownership contract при наличии template semantics.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- Output contract validation.
- После enablement: routing, exception handling, no-write и escalation regression tests.

## 21. Критерии production-ready

- Canonical runtime family.
- Ясное разграничение с `monitoring` и `economist`.
- Structured exception model.
- Control-specific intent contract.
- Smoke-сценарии по сверкам, exception review и governed escalation.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)
