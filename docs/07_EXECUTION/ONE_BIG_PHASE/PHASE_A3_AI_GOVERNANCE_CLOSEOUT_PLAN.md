---
id: DOC-EXE-ONE-BIG-PHASE-A3-AI-GOVERNANCE-CLOSEOUT-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-AI-GOVERNANCE-CLOSEOUT-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md;docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md
---
# PHASE A3 AI GOVERNANCE CLOSEOUT PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-AI-GOVERNANCE-CLOSEOUT-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A3` из общей строки “закрыть AI governance” в прямой execution-пакет по четырём обязательным контурам:

- `tool-permission matrix`
- `HITL matrix`
- `advisory-only` перечень
- formal `eval-suite`

Для первого рабочего прохода использовать также [PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md).

## 1. Текущее состояние `A3`

На текущий момент подтверждено:

- policy-контур AI уже существует;
- advisory-first модель для `RAI_EP` уже зафиксирована;
- опубликован runtime-derived [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md) как default governed tool-perimeter для `Tier 1`;
- release criteria прямо требуют `tool matrix`, `HITL matrix`, formal safety evals и incident discipline;
- audit фиксирует, что AI/agent baseline уже operationally значим, но release-state остаётся условным именно из-за неполной формализации safety controls.

Одновременно остаются реальные незакрытые вопросы:

- `tool-permission matrix` уже появился, но ещё не замкнут в полный release-closeout вместе с `HITL`, `advisory-only` и `eval-suite`;
- нет universal `HITL matrix` для high-impact flows;
- нет закреплённого `advisory-only` перечня как execution-артефакта;
- нет formal release-gated `eval-suite` поверх risky runtime-сценариев.

## 2. Что именно нужно закрыть

### `A3.1` Tool-permission matrix

Сделать:

- удерживать published matrix как canonical baseline по route class и agent class;
- явно отделить `read/advisory` инструменты от bounded operational tools;
- не допускать tool expansion без policy-обоснования.

Текущий execution-артефакт:

- [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md)

Сильное доказательство:

- отдельный утверждённый matrix-документ или эквивалентный execution-артефакт;
- runtime/route policy ссылается на этот matrix как на источник дозволенного поведения.

### `A3.2` HITL matrix

Сделать:

- определить все high-impact действия, которые требуют участия человека;
- описать, где нужен `review`, где нужен `confirmation`, а где нужен `final sign-off`;
- не оставлять такие правила разрозненными по разным slices.

Сильное доказательство:

- единый `HITL matrix`;
- risky flows не могут считаться release-ready вне этого контура.

### `A3.3` Advisory-only perimeter

Сделать:

- собрать перечень действий, где агент может только советовать;
- не допускать, чтобы advisory flow “тихо” превращался в execute-path;
- связать advisory-only perimeter с product/runtime semantics.

Сильное доказательство:

- отдельный перечень advisory-only действий;
- нет двусмысленности, где AI может исполнить, а где только рекомендовать.

### `A3.4` Formal AI safety eval suite

Сделать:

- собрать минимальный набор release-gated eval-сценариев;
- покрыть как минимум:
  - `prompt injection`
  - `tool misuse`
  - `unsafe autonomy`
  - `evidence bypass`
  - `wrong-evidence / no-evidence answer`
  - `human-in-the-loop gap`
- сделать eval-suite не исследованием, а повторяемым release-контуром.

Сильное доказательство:

- формальный `eval-suite` и результаты прогонов;
- release readiness AI нельзя больше трактовать “на глаз”.

## 3. Режим исполнения `A3`

Работать в таком порядке:

1. Сначала собрать `tool-permission matrix`.
2. Затем собрать `HITL matrix`.
3. Затем зафиксировать `advisory-only` perimeter.
4. Затем собрать formal `eval-suite`.

Нельзя:

- начинать с autonomy expansion;
- считать policy-файл достаточным доказательством closeout;
- считать отдельные test-сценарии заменой release-gated eval-suite.

## 4. Что обновлять в execution-пакете

После каждого движения по `A3` обновлять:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- при необходимости [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)
- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md), если изменилась форма исполнения трека

Board должен меняться так:

- `open` -> `in_progress`, когда появился реальный артефакт или оформленный контур исполнения;
- `guard_active` остаётся guard-статусом только для запрета autonomy expansion;
- `done` допустим только после появления формального release-артефакта, а не после усиления формулировки в policy.

## 5. Проверки `A3`

Обязательные проверяемые артефакты:

- отдельный `tool-permission matrix`
- отдельный `HITL matrix`
- отдельный `advisory-only` перечень
- formal `eval-suite`
- результаты прогонов по risky runtime-сценариям

Смотреть нужно не просто на наличие текста, а на то:

- можно ли по артефакту принять решение без догадок;
- покрыты ли high-impact flows;
- можно ли использовать этот набор как release gate, а не как заметку.

## 6. Условие выхода для `A3`

Трек `A3` считается закрытым только когда одновременно выполняются условия:

- строки `A-2.4.1..A-2.4.4` уходят из `open`;
- существует отдельный `tool-permission matrix`;
- существует отдельный `HITL matrix`;
- существует отдельный `advisory-only` perimeter;
- существует formal `eval-suite` с результатами прогонов;
- autonomy expansion остаётся запрещённой до тех пор, пока этот safety perimeter не стал рабочим release-контуром.
