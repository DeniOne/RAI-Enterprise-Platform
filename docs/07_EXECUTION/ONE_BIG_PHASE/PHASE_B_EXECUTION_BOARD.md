---
id: DOC-EXE-ONE-BIG-PHASE-B-EXECUTION-BOARD-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.3.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-B-EXECUTION-BOARD-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md;docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md;docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md;docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md;docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;apps/api/src/modules/rai-chat;apps/api/src/modules/tech-map;apps/api/src/modules/explainability
---
# PHASE B EXECUTION BOARD

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-B-EXECUTION-BOARD-20260331
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот файл — живой execution-board для `Phase B`. Он нужен, чтобы вести подфазу не как абстрактную “сборку ядра”, а как набор конкретных управленческих строк с понятным статусом, evidence и следующим действием.

Для общей схемы исполнения использовать также [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md).

Для канонических границ самой подфазы использовать также [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md).

## 1. Правила статусов

- `open` — задача ещё не сдвинута как execution-строка.
- `in_progress` — по строке уже есть база или частичная реализация, но контур не замкнут.
- `guard_active` — есть активное правило границы, которое нужно удерживать.
- `done` — строка закрыта по смыслу и больше не держит выходной критерий фазы.

## 2. Исполнительные треки

- `B0` — scope lock и защита границ фазы
- `B1` — Техкарта как центр системы
- `B2` — `execution / deviation / result` loop
- `B3` — governed orchestration
- `B4` — explainability и evidence

## 2.1. Срез реализации на 2026-04-01

- `done` по runtime-каркасу: unified create/resume workflow spine, slot-driven orchestration, trust-specialization gating, structured explainability/evidence и backend `execution_loop_summary`.
- `in_progress` по хвостам: полный lifecycle bridge `draft/review/approval/execution/revision`, enrichment result-state по outcome history, выравнивание ingress/routing и explainability-panel чтения без промежуточной интерпретации.
- эти `in_progress` строки на `2026-04-01` трактуются как residual core-quality backlog, а не как package-level blocker для уже закрытого execution-объёма `A-E`.
- `guard_active` остаётся обязательным: не расширять `web`/`self-host` объём в `Phase B`, не расширять role-perimeter до закрытия core-loop.

## 2.2. Как читать board после закрытия `ONE_BIG_PHASE`

- строки `B-2.2.2`, `B-2.2.3`, `B-2.3.3`, `B-2.4.2`, `B-2.5.2` остаются в `in_progress` как честный residual канона `Phase B`;
- эти строки не переоткрывают пакет `A-E` и не отменяют package-level verdict из [INDEX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md) и [ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md);
- `B-2.4.2` и `B-2.5.2` уже использовались как carry-over-входы для `Phase C`, но это не тождественно полному закрытию исходных backend/core-intent строк;
- пока не открыт новый отдельный core-quality пакет, эти строки нужно читать как follow-on backlog, а не как текущий daily execution entrypoint.

## 3. Execution board

| Track | ID | Blocker | Owner | Статус | Evidence | Next action |
|---|---|---|---|---|---|---|
| `B0` | `B-2.1.1` | Зафиксировать, что `Phase B` не проглатывает `Phase C` и `Phase D` | `techlead / product-governance` | `done` | [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md), [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md), [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md), [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md) | удерживать эту границу на каждом review и не принимать задачи `web` или `self-host`, если они не нужны для замыкания ядра |
| `B0` | `B-2.1.2` | Перевести `Phase B` в board-driven режим вместо расплывчатого “чинить всё подряд” | `techlead` | `done` | [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md), [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md) | обновлять status/evidence/next action по строкам board, а не размывать фазу по случайным инициативам |
| `B0` | `B-2.1.3` | Не считать secondary breadth прогрессом `Phase B` | `product-governance` | `guard_active` | [INDEX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md), [RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md), [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md) | удерживать правило `governed core > breadth`, не брать menu-growth, новые доменные shell и role-sprawl как будто это progress ядра |
| `B1` | `B-2.2.1` | Техкарта ещё не закреплена как главный управленческий объект исполнения | `backend / domain / product` | `done` | [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md), [TECH_MAP_GOVERNED_WORKFLOW.md](/root/RAI_EP/docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md), `apps/api/src/modules/tech-map/tech-map.service.ts`, `apps/api/src/shared/rai-chat/rai-tools.types.ts` | удерживать `TechMap workflow spine` как единственный runtime-путь create/resume/rebuild и не допускать ad hoc payload-ответов |
| `B1` | `B-2.2.2` | Lifecycle Техкарты не должен выпадать из основного сценария ядра | `backend / domain` | `in_progress` | [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md), [TECH_MAP_GOVERNED_WORKFLOW.md](/root/RAI_EP/docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md), `apps/api/src/modules/tech-map/tech-map.service.ts` | довести до полного lifecycle bridge `draft / review / approval / execution / revision` через один governed workflow-mode без разрывов |
| `B1` | `B-2.2.3` | Рекомендации, отклонения и revision не должны жить отдельно от Техкарты | `backend / domain / AI-governance` | `in_progress` | [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md), `apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts`, `apps/api/src/modules/tech-map/tech-map.service.ts` | замкнуть рекомендации и deviation/result follow-up в один TechMap-centered lifecycle без side-path рекомендаций |
| `B2` | `B-2.3.1` | Основной путь `контекст -> TechMap -> execution` ещё не замкнут как единый сценарий | `backend / orchestration` | `done` | [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md), [RAI_EP_MVP_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md), `apps/api/src/modules/tech-map/tech-map.service.ts`, `apps/api/src/modules/tech-map/tech-map-workflow-orchestrator.service.ts` | удерживать unified scope invariants `company / field / season / crop` в каждом create/resume/result проходе |
| `B2` | `B-2.3.2` | Отклонения ещё не оформлены как обязательный участок governed loop | `backend / domain / AI-governance` | `done` | [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md), `apps/api/src/modules/tech-map/tech-map.service.ts`, `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` | удерживать deviation-state и blocking-gaps как обязательную часть `execution_loop_summary` и explainability |
| `B2` | `B-2.3.3` | Result stage ещё не привязан к исходной Техкарте и к зафиксированным отклонениям | `backend / product` | `in_progress` | [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md), [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md), `apps/api/src/modules/tech-map/tech-map.service.ts` | добить связь `result_state` с observed outcome history для всех поддерживаемых crop/season профилей |
| `B3` | `B-2.4.1` | Текущий agent runtime ещё не доказал достаточность для замыкания core-loop без role-sprawl | `AI-governance / backend` | `done` | [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md), `apps/api/src/modules/tech-map/tech-map-workflow-orchestrator.service.ts`, `apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` | удерживать текущий role perimeter и не расширять agent-set до закрытия remaining `B1/B2/B4` хвостов |
| `B3` | `B-2.4.2` | Routing и orchestration не должны жить отдельной демонстрацией от TechMap-centered workflow | `AI-governance / backend / product` | `in_progress` | [TECH_MAP_GOVERNED_WORKFLOW.md](/root/RAI_EP/docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md), [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md), `apps/api/src/modules/tech-map/tech-map-workflow-orchestrator.service.ts`, `apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts` | выровнять final routing/semantic ingress так, чтобы execution always rooted в workflow snapshot, а не в отдельных эвристических ветках |
| `B3` | `B-2.4.3` | Нельзя расширять автономию и новые agent roles до замыкания текущего ядра | `techlead / AI-governance` | `guard_active` | [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md), [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md), [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md) | держать autonomy/breadth expansion вне очереди, пока `B1/B2/B4` не дают завершённый core-loop |
| `B4` | `B-2.5.1` | Explainability и evidence ещё не встроены в основной рабочий сценарий ядра | `backend / explainability / product` | `done` | [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md), [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md), `apps/api/src/modules/tech-map/tech-map.service.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` | удерживать explainability/evidence как обязательный backend-layer (`workflow_explainability`, `execution_loop_summary`) для всех create/resume ответов |
| `B4` | `B-2.5.2` | Ключевые шаги ядра ещё не дают единого объяснения “почему система так решила” | `backend / explainability` | `in_progress` | `apps/api/src/modules/explainability/explainability-panel.service.ts`, `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`, `apps/api/src/modules/tech-map/tech-map.service.ts` | довести explainability-panel чтение напрямую из `workflow_explainability` и `execution_loop_summary` без промежуточной интерпретации |
| `B4` | `B-2.5.3` | User-facing visual surface explainability нельзя тянуть в `Phase B`, но логика уже должна быть собрана | `product / techlead` | `guard_active` | [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md), [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md) | удержать границу: логика explainability и evidence закрывается в `B`, а её минимальная `web`-подача переходит в `C` |

## 4. Что смотреть первым

Сначала смотреть строки со статусом:

- `open`
- `in_progress`

Именно они показывают, где `Phase B` ещё не стала реальным governed core, а где уже есть основа, но loop пока не замкнут.
