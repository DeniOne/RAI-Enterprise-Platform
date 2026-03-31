---
id: DOC-EXE-ONE-BIG-PHASE-A3-FIRST-WAVE-GOVERNANCE-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-FIRST-WAVE-GOVERNANCE-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md;docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md
---
# PHASE A3 FIRST WAVE GOVERNANCE CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-FIRST-WAVE-GOVERNANCE-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы начать `A3` как конкретный рабочий пакет, а не как общую AI-policy тему.

## 1. Базовое правило `A3`

До закрытия первой волны запрещено:

- расширять автономию AI;
- добавлять high-impact execute-path;
- считать advisory-first policy достаточной заменой `tool / HITL / eval`.

## 2. Что делать первой волной

### Шаг 1. Собрать `tool-permission matrix`

Нужно:

- перечислить agent class / route class;
- для каждого класса отделить:
  - `read`
  - `advisory`
  - bounded operational tools
  - запрещённые tools

Текущий статус:

- baseline-артефакт уже создан в [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md);
- первая волна для `A3.1` теперь не начинается с нуля, а продолжается от опубликованного runtime-derived matrix.

### Шаг 2. Собрать `HITL matrix`

Нужно:

- перечислить все high-impact действия;
- для каждого указать:
  - где нужен `review`
  - где нужен `confirmation`
  - где нужен `final sign-off`

Текущий статус:

- baseline-артефакт уже создан в [PHASE_A3_HITL_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md);
- первая волна для `A3.2` теперь продолжается от опубликованного runtime-derived `PendingAction` / approval baseline.

### Шаг 3. Зафиксировать `advisory-only perimeter`

Нужно:

- отдельно описать действия, которые агент может только советовать;
- не допускать, чтобы advisory-path тихо становился execute-path.

### Шаг 4. Собрать minimal `eval-suite`

Нужно:

- покрыть как минимум:
  - `prompt injection`
  - `tool misuse`
  - `unsafe autonomy`
  - `evidence bypass`
  - `wrong-evidence / no-evidence answer`
  - `human-in-the-loop gap`

## 3. Что считать реальным прогрессом

Реальный прогресс:

- появляются отдельные execution-артефакты, а не только intent;
- `A-2.4.1..A-2.4.4` перестают быть чисто пустыми `open` строками;
- AI release gate всё меньше держится на общих policy-формулировках.

Не считать прогрессом:

- новый текст policy без matrix/eval артефактов;
- обсуждение autonomy без запретного perimeter;
- отдельные ad hoc tests без formal suite.

## 4. Условие завершения первой волны `A3`

Первая волна считается завершённой только когда:

- есть опубликованный `tool-permission matrix`;
- есть опубликованный `HITL matrix`;
- есть отдельный `advisory-only` перечень;
- есть skeleton `eval-suite`;
- в board `A-2.4.1..A-2.4.4` хотя бы переходят из чистого `open` в рабочий execution-state.
