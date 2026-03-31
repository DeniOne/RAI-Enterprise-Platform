---
id: DOC-EXE-ONE-BIG-PHASE-A-EVIDENCE-MATRIX-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EVIDENCE-MATRIX-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md
---
# PHASE A EVIDENCE MATRIX

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EVIDENCE-MATRIX-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот файл нужен, чтобы не перепутать:

- заметку;
- runbook;
- внутренний gate;
- внешний принятый документ;
- реальное доказательство закрытия риска.

## 1. Правило доказательств для `Phase A`

Считать blocker закрытым можно только если есть подходящее доказательство для его класса риска:

- `docs` и плановые заметки полезны для направления, но сами по себе не закрывают риск;
- внутренний `gate` или `report` может закрывать только внутренний технический риск;
- legal, operator, residency, chain-of-title и similar вопросы требуют внешнего accepted evidence;
- runbook без execution evidence не закрывает installability или recovery риск.

## 2. Матрица доказательств

| Track | Ось риска | Что нужно закрыть | Какое доказательство считается сильным | Что уже есть внутри репозитория | Что ещё нужно снаружи | Текущее состояние |
|---|---|---|---|---|---|---|
| `A1` | `Legal / operator identity` | подтвердить, кто оператор и на каком основании | accepted `ELP-20260328-01` | [COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md), request/metadata packet | внешний signed/operator artifact | `не подтверждено внешне` |
| `A1` | `Legal / РКН` | подтвердить notification status или exemption | accepted `ELP-20260328-02` | legal lifecycle tooling, compliance register | уведомление РКН или formal exemption memo | `не подтверждено внешне` |
| `A1` | `Legal / residency` | доказать, где реально живут данные и perimeter хостинга | accepted `ELP-20260328-03` + hosting evidence | [HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md](/root/RAI_EP/docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md) | provider/account/hosting evidence | `частично описано` |
| `A1` | `Legal / processors` | доказать внешний perimeter обработки и `DPA` | accepted `ELP-20260328-04` | request packet, metadata register | processor list, `DPA`, contract evidence | `не подтверждено внешне` |
| `A1` | `Legal / transborder` | зафиксировать, что и на каком основании уходит за пределы РФ | accepted `ELP-20260328-05` | RF review, hosting/transborder matrix | formal transborder decision log | `частично описано` |
| `A1` | `Legal / lawful basis` | закрыть основания обработки и privacy notices | accepted `ELP-20260328-06` | compliance register, privacy runbook | approved lawful basis matrix и actual notices | `частично описано` |
| `A1` | `Legal / retention` | закрыть сроки хранения и удаление | accepted `ELP-20260328-08` | [WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md](/root/RAI_EP/docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md) | approved external/internal policy evidence | `частично описано` |
| `A5` | `IP / chain-of-title` | доказать права на код, БД и know-how | accepted `ELP-20260328-09` | [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md), RF review | signed IP artifacts и chain-of-title pack | `не подтверждено внешне` |
| `A2` | `Security / dependency risk` | опустить критичные и высокие зависимости до управляемого уровня | зелёный remediation-report по critical/high debt + успешные build после dependency refresh | `pnpm security:audit:ci` -> `critical=0`, `high=30`; `pnpm --filter api build`; `pnpm --filter web build` | внешнее evidence не требуется, нужен технический результат | `первая remediation-волна подтверждена` |
| `A2` | `Security / secret hygiene` | удержать `tracked` leakage на нуле и закрыть historical debt | зелёный secret gate + incident closeout evidence | `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`; [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md) | возможно external rotation/proof для historical incident | `tracked закрыто, workspace debt остаётся` |
| `A2` | `Security / unsafe paths` | не допускать новых unsafe обходов | зелёные invariants/gates | `pnpm gate:invariants`, due diligence | внешнее evidence не требуется | `внутренне подтверждено` |
| `A3` | `AI / tool permissions` | определить, что агенту можно запускать | approved tool matrix + runtime enforcement | [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md) | внешнее evidence не требуется | `не подтверждено исполнением` |
| `A3` | `AI / HITL` | определить, где обязательно участие человека | approved HITL matrix + runtime path | AI policy, AI failure scenarios | внешнее evidence не требуется | `не подтверждено исполнением` |
| `A3` | `AI / safety evals` | ввести формальный eval suite для risky-сценариев | eval suite + результаты прогонов | AI failure scenarios, synthesis | внешнее evidence не требуется | `не подтверждено исполнением` |
| `A4` | `Installability / self-host` | доказать путь установки и обновления | install/upgrade packet + dry-run evidence | release criteria, due diligence, deployment matrix | внешнее evidence не требуется | `частично описано` |
| `A4` | `Recovery / backup-restore` | доказать, что систему можно восстановить | выполненный drill + execution report | [WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md](/root/RAI_EP/docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md) | внешнее evidence не требуется | `runbook есть, исполнения нет` |

## 3. Что не считать доказательством закрытия

Не считать закрытием риска такие вещи:

- просто наличие markdown-файла;
- наличие шаблона без `accepted`-артефакта;
- наличие runbook без реального execution-report;
- наличие policy без runtime enforcement;
- наличие красивой summary-таблицы без gate, drill или внешнего evidence.

## 4. Как пользоваться матрицей

Правильный порядок работы такой:

1. Найти blocker в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md).
2. Проверить в этой матрице, какое доказательство действительно требуется.
3. Не помечать blocker как закрытый, пока не появилось именно это доказательство.

Это защищает `Phase A` от самообмана, когда в проекте уже много описаний, но ещё мало настоящих подтверждений.
