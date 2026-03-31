---
id: DOC-EXE-ONE-BIG-PHASE-A-EXECUTION-BOARD-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.8.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXECUTION-BOARD-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md
---
# PHASE A EXECUTION BOARD

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXECUTION-BOARD-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот файл — живой execution-board для `Phase A`. Он нужен, чтобы смотреть не на общий план, а на фактическое движение стоп-блокеров.

## 1. Правила статусов

- `open` — задача ещё не сдвинута по существу.
- `in_progress` — есть внутреннее движение, но blocker не снят.
- `guard_active` — есть активное правило или gate, но это ещё не доказательство полного закрытия.
- `waiting_external` — без внешнего evidence задача дальше не двинется.
- `done` — blocker закрыт доказуемо.

## 2. Исполнительные треки

- `A0` — triage и защита от распыления
- `A1` — `legal / privacy / operator / residency`
- `A2` — `security / AppSec / secret hygiene`
- `A3` — `AI governance: tool / HITL / eval`
- `A4` — `installability / self-host / backup-restore`
- `A5` — `IP / OSS / chain-of-title`

## 3. Execution board

| Track | ID | Blocker | Owner | Статус | Evidence | Next action |
|---|---|---|---|---|---|---|
| `A0` | `A-2.1.1` | Зафиксировать, что breadth-задачи не идут в верх очереди | `techlead / product-governance` | `in_progress` | [01_PHASE_A_STOP_BLOCKERS_AND_GATES.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md), [RAI_EP_MVP_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md) | переводить все новые инициативы через правило “ядро или ширина” и не пускать breadth в верх очереди |
| `A0` | `A-2.1.2` | Не брать задачи, которые не двигают `legal / security / AI governance / self-host` | `techlead` | `in_progress` | [ONE_BIG_PHASE/INDEX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md) | привязать каждую новую рабочую единицу к подфазе и blocker-коду |
| `A0` | `A-2.1.3` | Проверять каждую новую задачу на “blocker или ширина” | `product-governance` | `open` | [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md) | завести жёсткий triage-ритм по новым задачам и отбрасывать всё, что не усиливает ядро |
| `A1` | `A-2.2.1` | Пройти приоритетную восьмёрку `ELP-01/02/03/04/05/06/08/09` | `legal / compliance` | `waiting_external` | [EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md), [RF_COMPLIANCE_REVIEW_2026-03-28.md](/root/RAI_EP/docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md) | начать intake с `ELP-01`, `03`, `04`, `06`, затем идти по priority-board |
| `A1` | `A-2.2.2` | Для каждого `ELP-*` получить owner-driven статус с реальным внешним документом | `legal / compliance` | `waiting_external` | [EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md](/root/RAI_EP/docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md), [WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md](/root/RAI_EP/docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md) | перевести приоритетные карточки из `requested` в `received` через intake реальных документов |
| `A1` | `A-2.2.3` | Довести ключевые legal-артефакты до `accepted` | `chief_legal_officer / dpo / board` | `waiting_external` | [EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md) | пройти review и acceptance по `ELP-01`, `03`, `04`, `06`, потом `02`, `05`, `08`, `09` |
| `A1` | `A-2.2.4` | Пересчитывать legal-verdict после каждого принятого артефакта | `legal / compliance + techlead` | `in_progress` | `pnpm legal:evidence:verdict`, [COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md) | прогонять verdict после каждого `accepted` и синхронизировать статус `A1` |
| `A1` | `A-2.2.5` | Не подменять внешние доказательства внутренними заметками | `legal / compliance` | `guard_active` | [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md) | для каждого legal-claim проверять, есть ли внешний accepted artifact, а не только `docs` |
| `A2` | `A-2.3.1` | Разобрать критичные и высокие зависимости security baseline | `security / AppSec + backend / platform` | `done` | `pnpm security:audit:ci` -> `critical: 2 -> 0`, `high: 37 -> 30 -> 5`; remaining `high` ограничены `@typescript-eslint/typescript-estree -> minimatch@9.0.3` и `@angular-devkit/core -> picomatch@4.0.1/4.0.2`; [PHASE_A2_TIER1_TOOLCHAIN_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_TIER1_TOOLCHAIN_DECISION.md); `pnpm --filter api build`; `pnpm --filter web build` | держать residual toolchain-tail как follow-up для `Tier 2+`, а внутри `A2` перейти к historical key/rotation debt и external access-governance evidence |
| `A2` | `A-2.3.2` | Не выпускать `Tier 1`, пока security-risk не снижен | `techlead / AppSec` | `guard_active` | [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md) | держать release-stop rule активным на каждом execution-review |
| `A2` | `A-2.3.3` | Проверить, что tracked secret leakage не вернулся | `security / platform` | `guard_active` | `pnpm gate:secrets`, `pnpm gate:security:evidence`, [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md), [PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md), [PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md), [PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md), [PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md) | держать `tracked_findings=0`, вести `A2-S-01/02` через `security:evidence` status/gate и перевести historical incident из open debt в закрытый evidence-backed follow-up |
| `A2` | `A-2.3.4` | Не допускать появления новых unsafe путей | `backend / platform` | `guard_active` | `pnpm gate:invariants`, [ENTERPRISE_DUE_DILIGENCE_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md) | держать invariants зелёными и не пропускать обходы ради скорости |
| `A2` | `A-2.3.5` | Подтвердить внешний access-governance perimeter | `techlead / security / repo-admin` | `waiting_external` | `pnpm gate:security:evidence`, [SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md](/root/RAI_EP/docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md), [PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md), [PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md), [PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md) | снять restricted evidence по branch protection, required review, deploy keys и environment access, прогнать `security:evidence` gate и только после этого считать `A2` закрытой полностью |
| `A3` | `A-2.4.1` | Собрать универсальную матрицу разрешённых инструментов | `AI governance / backend` | `in_progress` | [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md), [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts), [agent-runtime-config.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-runtime-config.service.ts), [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts) | использовать published matrix как baseline, затем собрать `HITL matrix` и убрать остаточную двусмысленность по high-impact execute-path |
| `A3` | `A-2.4.2` | Собрать универсальную матрицу обязательного участия человека | `AI governance / product` | `in_progress` | [PHASE_A3_HITL_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md), [pending-action.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/pending-action.service.ts), [pending-actions.controller.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/pending-actions.controller.ts), [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts) | использовать published matrix как baseline, затем зафиксировать `advisory-only` perimeter и не оставлять двусмысленность по write/critical approval chain |
| `A3` | `A-2.4.3` | Определить действия, которые агент может только советовать | `AI governance / product` | `open` | [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md) | выделить advisory-only actions и не давать им стать execute-path |
| `A3` | `A-2.4.4` | Довести формальный набор safety/eval-проверок | `AI governance / testing` | `open` | [AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md](/root/RAI_EP/docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md) | собрать минимальный eval-suite для risky runtime-сценариев |
| `A3` | `A-2.4.5` | Не расширять автономию AI до закрытия трёх контуров | `techlead / AI governance` | `guard_active` | [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md) | не брать задачи на autonomy expansion до появления tool/HITL/eval evidence |
| `A4` | `A-2.5.1` | Собрать install/upgrade packet для `self-host` | `platform / ops` | `open` | [HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md](/root/RAI_EP/docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md), [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md) | собрать детерминированный install path и список обязательных параметров среды |
| `A4` | `A-2.5.2` | Провести подтверждённый `backup / restore` сценарий | `ops / SRE` | `open` | [WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md](/root/RAI_EP/docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md) | выполнить drill и сохранить execution evidence, а не только runbook |
| `A4` | `A-2.5.3` | Проверить, что install/restore повторяется без скрытых знаний | `platform / ops` | `open` | [ENTERPRISE_DUE_DILIGENCE_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md) | прогнать установку по документу с чистого листа и зафиксировать пробелы |
| `A4` | `A-2.5.4` | Не считать продукт pilot-ready без installability | `techlead / ops` | `guard_active` | [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md) | держать `Tier 1` закрытым, пока install/restore не доказаны |
| `A5` | `A-2.6.1` | Разобрать `unknown licenses` | `legal / compliance + backend / platform` | `open` | [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md), `pnpm security:licenses` | оттриажить неизвестные лицензии и убрать спорные зависимости |
| `A5` | `A-2.6.2` | Закрыть цепочку прав на код, БД и know-how | `legal / board` | `waiting_external` | [RF_COMPLIANCE_REVIEW_2026-03-28.md](/root/RAI_EP/docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md), `ELP-20260328-09` | принять внешние IP-артефакты и связать их с register |
| `A5` | `A-2.6.3` | Не двигаться к внешнему pilot при спорных правах | `board / legal / techlead` | `guard_active` | [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md) | держать этот запрет активным до закрытия `ELP-09` и triage лицензий |

## 4. Что смотреть первым

Сначала смотреть строки со статусом:

- `waiting_external`
- `open`

Именно они показывают, где `Phase A` реально упирается в незакрытые дыры, а не в уже существующие правила и runbook-артефакты.
