---
id: DOC-EXE-ONE-BIG-PHASE-A-EVIDENCE-MATRIX-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.10.0
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
| `A2` | `Security / dependency risk` | опустить критичные и высокие зависимости до управляемого уровня | зелёный remediation-report по critical/high debt + успешные build после dependency refresh | `pnpm security:audit:ci` -> `critical=0`, `high=5`; runtime-impact advisories больше не воспроизводятся; остаток high ограничен `@typescript-eslint/typescript-estree -> minimatch@9.0.3` и `@angular-devkit/core -> picomatch@4.0.1/4.0.2`; [PHASE_A2_TIER1_TOOLCHAIN_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_TIER1_TOOLCHAIN_DECISION.md); `pnpm --filter api build`; `pnpm --filter web build` | внешнее evidence не требуется, нужен технический результат и формальное release-решение по toolchain-tail | `для Tier 1 признано допустимым, follow-up для Tier 2+ остаётся` |
| `A2` | `Security / secret hygiene` | удержать `tracked` leakage на нуле и закрыть historical debt | зелёный secret gate + `security:evidence` status/gate + incident closeout evidence | `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`; `pnpm security:evidence:status`; [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md) | external rotation / revocation artifact по `A2-S-01/02` | `tracked закрыто, historical debt структурирован и ждёт внешнего evidence` |
| `A2` | `Security / unsafe paths` | не допускать новых unsafe обходов | зелёные invariants/gates | `pnpm gate:invariants`, due diligence | внешнее evidence не требуется | `внутренне подтверждено` |
| `A2` | `Security / access governance outside repo` | доказать branch protection, owner-review, deploy keys и environment access | restricted access review artifact + `security:evidence` status/gate | [SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md](/root/RAI_EP/docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md), `.github/CODEOWNERS`, security workflows, `pnpm security:evidence:status` | внешний restricted evidence packet по GitHub UI/perimeter | `repo-side perimeter подтверждён частично, GitHub UI evidence отсутствует` |
| `A3` | `AI / tool permissions` | определить, что агенту можно запускать | approved tool matrix + runtime enforcement | [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md), [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md), [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts), [agent-runtime-config.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-runtime-config.service.ts), [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts) | внешнее evidence не требуется | `execution-артефакт создан, но release-closeout A3 ещё не завершён` |
| `A3` | `AI / HITL` | определить, где обязательно участие человека | approved HITL matrix + runtime path | [PHASE_A3_HITL_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md), [pending-action.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/security/pending-action.service.ts), [pending-actions.controller.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/pending-actions.controller.ts), [rai-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts), [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md) | внешнее evidence не требуется | `execution-артефакт создан, но release-closeout A3 ещё не завершён` |
| `A3` | `AI / advisory-only perimeter` | определить, где агент может только рекомендовать | отдельный advisory-only register + связь с runtime/policy semantics | [PHASE_A3_ADVISORY_ONLY_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_ADVISORY_ONLY_REGISTER.md), [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md), [PHASE_A3_HITL_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md) | внешнее evidence не требуется | `execution-артефакт создан, но UX/runtime closeout ещё не завершён` |
| `A3` | `AI / safety evals` | ввести формальный eval suite для risky-сценариев | eval suite + результаты прогонов | [PHASE_A3_RELEASE_EVAL_SUITE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_SUITE.md), [PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md), [AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md](/root/RAI_EP/docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md) | внешнее evidence не требуется | `runtime-drill evidence уже есть, но unified evaluator и release gate ещё не собраны` |
| `A4` | `Installability / self-host` | доказать путь установки и обновления | install/upgrade packet + dry-run evidence | [PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md), [PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md), release criteria, deployment matrix | внешнее evidence не требуется | `локальный dry-run подтверждён, но blank-host installability ещё частично не доказана` |
| `A4` | `Recovery / backup-restore` | доказать, что систему можно восстановить | выполненный drill + execution report | [WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md](/root/RAI_EP/docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md), [PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md) | внешнее evidence не требуется | `внутренне подтверждено execution evidence` |
| `A4` | `Operational support boundary` | определить границу ответственности для self-host pilot | support boundary packet + pilot handoff consistency | [PHASE_A4_SUPPORT_BOUNDARY_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md), [HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md](/root/RAI_EP/docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md) | внешнее evidence не требуется, но нужен реальный pilot handoff | `execution-артефакт создан, pilot handoff ещё не подтверждён` |
| `A5` | `OSS / unknown license triage` | разобрать `UNKNOWN` perimeter и зафиксировать replacement/acceptance decisions | triage register + updated OSS register + manual legal classification | [PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md), [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md), `var/security/license-inventory.json` | внешнее evidence не требуется, нужен manual legal decision | `first-party ambiguity снята, UNKNOWN сузился до optional/toolchain хвоста, final classification ещё не завершена` |
| `A5` | `OSS / notice obligations` | собрать обязательный notice/attribution perimeter для distribution/procurement path | final notice packet, привязанный к inventory и licensing decisions | [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md), [PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md) | внешнее evidence не требуется, но нужен final legal sign-off | `working packet создан, final legal bundle ещё не собран` |
| `A5` | `IP / chain-of-title` | доказать права на код, БД и know-how | accepted `ELP-20260328-09` | [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md), RF review | signed IP artifacts и chain-of-title pack | `не подтверждено внешне` |
| `A5` | `IP / first-party licensing strategy` | зафиксировать правовой режим first-party кода до external pilot | approved first-party licensing strategy + связь с chain-of-title | [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md), [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md) | внешнее evidence не требуется для baseline, но нужен `ELP-20260328-09` для полного closeout | `conservative baseline зафиксирован, full legal closeout ещё не завершён` |

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
