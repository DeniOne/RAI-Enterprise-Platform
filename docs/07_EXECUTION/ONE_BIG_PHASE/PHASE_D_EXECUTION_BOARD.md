---
id: DOC-EXE-ONE-BIG-PHASE-D-EXECUTION-BOARD-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-D-EXECUTION-BOARD-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md;docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;package.json;scripts/phase-d-status.cjs;scripts/phase-d-install-status.cjs;scripts/phase-d-dr-status.cjs;scripts/phase-d-ops-status.cjs;scripts/phase-d-pilot-status.cjs;var/ops/phase-d-status.json
---
# PHASE D EXECUTION BOARD

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-D-EXECUTION-BOARD-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот файл — живой execution-board для `Phase D`. Он фиксирует только строки `D-2.x.y`, статусы `open/in_progress/guard_active/done`, evidence и ближайшее действие.

## 1. Правила статусов

- `open` — строка ещё не сдвинута как execution-единица.
- `in_progress` — реализация начата, но exit-критерий строки не закрыт.
- `guard_active` — действует обязательное ограничение, которое нужно удерживать.
- `done` — строка закрыта по смыслу и подтверждена evidence.

## 2. Треки `Phase D`

- `D0` — phase-entry и scope lock
- `D1` — self-host installability
- `D2` — backup/restore и DR
- `D3` — operational hardening
- `D4` — controlled pilot
- `D5` — anti-breadth guardrails

## 3. Execution board

Срез фактического статуса из [phase-d-status.json](/root/RAI_EP/var/ops/phase-d-status.json):

- `D1`: `done` (`install_ready`)
- `D2`: `done` (`restore_ready`)
- `D3`: `done` (`ops_ready`)
- `D4`: `done` (`pilot_ready`)
- `D5`: `guard_active`

| Track | ID | Blocker | Owner | Статус | Evidence | Next action |
|---|---|---|---|---|---|---|
| `D0` | `D-2.1.1` | Перевести execution-entrypoint с `Phase C` на `Phase D` | `techlead` | `done` | [INDEX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md), [PHASE_C_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_EXECUTION_BOARD.md), [PHASE_D_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md) | удерживать `Phase D` как единственный активный daily execution-пакет |
| `D0` | `D-2.1.2` | Удержать scope lock против feature breadth и преждевременного `SaaS/hybrid` | `product-governance` | `guard_active` | [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md), [PHASE_D_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md) | отклонять задачи ширины до закрытия `D1-D4` |
| `D1` | `D-2.2.1` | Собрать воспроизводимый install packet для clean self-host среды | `platform / release` | `done` | [phase-d-install-dry-run.json](/root/RAI_EP/var/ops/phase-d-install-dry-run.json), [phase-d-install-dry-run.md](/root/RAI_EP/var/ops/phase-d-install-dry-run.md), [PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md) | удерживать воспроизводимость install path на повторных dry-run циклах |
| `D1` | `D-2.2.2` | Подтвердить upgrade-path без ручной импровизации | `platform / release` | `done` | [phase-d-upgrade-rehearsal-input.json](/root/RAI_EP/var/ops/phase-d-upgrade-rehearsal-input.json), [phase-d-upgrade-rehearsal.json](/root/RAI_EP/var/ops/phase-d-upgrade-rehearsal.json), [phase-d-upgrade-rehearsal.md](/root/RAI_EP/var/ops/phase-d-upgrade-rehearsal.md) | удерживать upgrade rehearsal как обязательный артефакт каждого install цикла |
| `D1` | `D-2.2.3` | Подготовить operator-owned install checklist | `platform / ops` | `done` | [phase-d-install-status.json](/root/RAI_EP/var/ops/phase-d-install-status.json), [PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md), [package.json](/root/RAI_EP/package.json) | удерживать `install_ready` перед переходом к release/pilot gate |
| `D2` | `D-2.3.1` | Провести backup/restore dry-run в отдельной среде | `ops / release` | `done` | [phase-d-restore-drill.json](/root/RAI_EP/var/ops/phase-d-restore-drill.json), [phase-d-restore-drill.md](/root/RAI_EP/var/ops/phase-d-restore-drill.md), [RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md](/root/RAI_EP/docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md) | удерживать цикл `backup -> restore -> verify` обязательным для release rehearsal |
| `D2` | `D-2.3.2` | Зафиксировать RPO/RTO и целостность данных после restore | `ops / compliance` | `done` | [phase-d-restore-drill.json](/root/RAI_EP/var/ops/phase-d-restore-drill.json), [phase-d-dr-status.json](/root/RAI_EP/var/ops/phase-d-dr-status.json), [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md) | контролировать `rpo_minutes/rto_minutes` на повторных DR прогонах |
| `D2` | `D-2.3.3` | Включить restore-drill в регулярный release-gate | `release` | `done` | [package.json](/root/RAI_EP/package.json), [phase-d-dr-status.cjs](/root/RAI_EP/scripts/phase-d-dr-status.cjs), [phase-d-dr-status.json](/root/RAI_EP/var/ops/phase-d-dr-status.json) | удерживать `gate:phase:d:restore` как обязательный pre-pilot gate |
| `D3` | `D-2.4.1` | Стабилизировать monitoring/alerting baseline для pilot | `ops` | `done` | [phase-d-ops-drill.json](/root/RAI_EP/var/ops/phase-d-ops-drill.json), [phase-d-ops-status.json](/root/RAI_EP/var/ops/phase-d-ops-status.json), [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md) | удерживать `ops_ready` как обязательный precondition для pilot acceptance |
| `D3` | `D-2.4.2` | Закрыть incident + rollback chain-of-command | `ops / governance` | `done` | [phase-d-ops-drill.json](/root/RAI_EP/var/ops/phase-d-ops-drill.json), [phase-d-ops-drill.cjs](/root/RAI_EP/scripts/phase-d-ops-drill.cjs), [PHASE_A4_SUPPORT_BOUNDARY_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md) | удерживать owner chain (`incident/rollback/support/communication`) в machine-readable отчёте |
| `D3` | `D-2.4.3` | Закрепить support boundary и on-call handoff | `ops / support` | `done` | [PHASE_A4_SUPPORT_BOUNDARY_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md), [phase-d-ops-drill.json](/root/RAI_EP/var/ops/phase-d-ops-drill.json), [phase-d-ops-status.json](/root/RAI_EP/var/ops/phase-d-ops-status.json) | не допускать release/pilot без актуального support boundary |
| `D4` | `D-2.5.1` | Зафиксировать pilot scope и entry criteria | `product-governance / ops` | `done` | [phase-d-pilot-status.json](/root/RAI_EP/var/ops/phase-d-pilot-status.json), [phase-d-pilot-status.md](/root/RAI_EP/var/ops/phase-d-pilot-status.md), [/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-04-01/metadata/INDEX.md](/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-04-01/metadata/INDEX.md) | удерживать актуальность `review_due` и owner полей в metadata |
| `D4` | `D-2.5.2` | Провести pilot handoff rehearsal | `ops / release` | `done` | [phase-d-pilot-intake.cjs](/root/RAI_EP/scripts/phase-d-pilot-intake.cjs), [phase-d-pilot-transition.cjs](/root/RAI_EP/scripts/phase-d-pilot-transition.cjs), [/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-04-01/metadata/D-H-01-tier1-self-host-pilot.md](/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-04-01/metadata/D-H-01-tier1-self-host-pilot.md) | повторять lifecycle `requested -> received -> reviewed` для новых handoff references |
| `D4` | `D-2.5.3` | Закрыть pilot acceptance gate по evidence | `ops / governance` | `done` | [phase-d-pilot-status.cjs](/root/RAI_EP/scripts/phase-d-pilot-status.cjs), [phase-d-pilot-status.json](/root/RAI_EP/var/ops/phase-d-pilot-status.json), [phase-d-status.json](/root/RAI_EP/var/ops/phase-d-status.json) | удерживать verdict `pilot_ready` и блокировать переход при downgrade handoff статусов |
| `D5` | `D-2.6.1` | Не открывать `SaaS/hybrid` до доказанного `Tier 1` | `product-governance` | `guard_active` | [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md), [PHASE_D_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md) | отклонять backlog-строки, не усиливающие `Tier 1 self-host` |
| `D5` | `D-2.6.2` | Блокировать menu/feature breadth до pilot acceptance | `product-governance` | `guard_active` | [phase-d-status.cjs](/root/RAI_EP/scripts/phase-d-status.cjs), [phase-d-status.json](/root/RAI_EP/var/ops/phase-d-status.json), [INDEX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md) | удерживать `scope_violations=0`; при нарушении блокировать `gate:phase:d:status` |

## 4. Exit-критерии фазы

`Phase D` закрывается только когда одновременно:

1. строки `D-2.2.*`, `D-2.3.*`, `D-2.4.*`, `D-2.5.*` не имеют `open/in_progress`;
2. installability подтверждена clean-install и upgrade rehearsal с evidence;
3. backup/restore и DR подтверждены практическим прогоном;
4. pilot handoff и acceptance закрыты формальным verdict;
5. guardrails `D-2.6.*` удерживаются без нарушений scope.
