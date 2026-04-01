---
id: DOC-EXE-ONE-BIG-PHASE-A3-RELEASE-EVAL-REPORT-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-RELEASE-EVAL-REPORT-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a3-release-evals.cjs;package.json;var/ops/phase-a3-release-eval-manifest-2026-03-31.json;var/ops/phase-a3-release-eval-summary-2026-03-31.json;var/ops/phase-a3-release-eval-summary-2026-03-31.md;apps/api/src/modules/rai-chat/rai-chat.service.spec.ts;apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts;apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts;apps/api/scripts/ops/advisory-oncall-drill.mjs;apps/api/scripts/ops/advisory-stage-progression.mjs;apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs
---
# PHASE A3 RELEASE EVAL REPORT 2026-03-31

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-RELEASE-EVAL-REPORT-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот отчёт фиксирует первый unified release gate для `A3.4`. Он собирает `jest`-suite и advisory runtime-drill в одну повторяемую команду:

- `pnpm phase:a3:evals`
- `pnpm gate:phase:a3:evals`

## 1. Что было реально выполнено

В эту дату unified runner выполнил:

- `rai_chat_service_spec`
- `supervisor_agent_spec`
- `runtime_spine_spec`
- `advisory_oncall_drill`
- `advisory_stage_progression_drill`
- `advisory_dr_rollback_drill`

Machine-readable артефакты собраны в:

- [phase-a3-release-eval-manifest-2026-03-31.json](/root/RAI_EP/var/ops/phase-a3-release-eval-manifest-2026-03-31.json)
- [phase-a3-release-eval-summary-2026-03-31.json](/root/RAI_EP/var/ops/phase-a3-release-eval-summary-2026-03-31.json)
- [phase-a3-release-eval-summary-2026-03-31.md](/root/RAI_EP/var/ops/phase-a3-release-eval-summary-2026-03-31.md)
- `var/ops/phase-a3-release-evals-2026-03-31/*`

## 2. Итог unified gate

- `gate_status = PASS`
- `commands_passed = 6 / 6`
- `clusters_passed = 8 / 8`
- `tests_passed = 40 / 40`

Разбивка по `jest`:

- `rai_chat_service_spec` -> `7 / 7`
- `supervisor_agent_spec` -> `29 / 29`
- `runtime_spine_spec` -> `4 / 4`

Разбивка по drills:

- `advisory_oncall_drill` -> `PASS`
- `advisory_stage_progression_drill` -> `PASS`
- `advisory_dr_rollback_drill` -> `PASS`

## 3. Что именно теперь покрыто

Unified evaluator собирает и проверяет такие derived clusters:

| Cluster | Статус | На чём основан |
|---|---|---|
| `prompt_injection` | `PASS` | `rai_chat_service_spec` как `Tier 1` proxy для malicious metadata/context abuse, denylist и fail-open retrieval path |
| `tool_misuse` | `PASS` | `supervisor_agent_spec` + `runtime_spine_spec` |
| `unsafe_autonomy` | `PASS` | `supervisor_agent_spec` + `runtime_spine_spec` + `advisory_stage_progression_drill` |
| `evidence_bypass` | `PASS` | `supervisor_agent_spec` + `runtime_spine_spec` |
| `wrong_or_no_evidence_answer` | `PASS` | `rai_chat_service_spec` + `supervisor_agent_spec` + `runtime_spine_spec` |
| `human_in_the_loop_gap` | `PASS` | `supervisor_agent_spec` + `runtime_spine_spec` |
| `direct_crm_exception_boundary` | `PASS` | `supervisor_agent_spec` |
| `quarantine_and_tool_first` | `PASS` | `runtime_spine_spec` + `advisory_oncall_drill` + `advisory_dr_rollback_drill` |

## 4. Что этот gate уже доказывает

- `A3.4` больше не держится на skeleton-doc и отдельных ручных прогонах.
- Tool/HITL/advisory perimeter теперь связан с повторяемым `PASS/FAIL` runner.
- Regression в release-критичном AI runtime больше не должна ловиться “на глаз”.

## 5. Что этот gate ещё не обещает

Этот gate не нужно путать с полным `Tier 2/Tier 3` red-team perimeter.

Он ещё не доказывает:

- полный adversarial corpus по `prompt injection` за пределами текущего `Tier 1` proxy-кластера;
- tenant-specific governance overrides;
- UX-level confirmation flow для всех будущих web-сценариев;
- autonomy expansion выше текущего governed perimeter.

То есть `A3.4` для `Tier 1 self-host / localized MVP pilot` теперь закрыт repo-side, но более широкий AI safety program на этом не заканчивается.

## 6. Decision impact

Этот отчёт позволяет:

- считать `A-2.4.4` закрытой repo-side для `Tier 1`;
- перевести `A3` из состояния “есть документы и drills” в состояние “есть machine-readable release gate”;
- держать autonomy expansion отдельным guard-решением, а не смешивать его с baseline-governance closeout.
