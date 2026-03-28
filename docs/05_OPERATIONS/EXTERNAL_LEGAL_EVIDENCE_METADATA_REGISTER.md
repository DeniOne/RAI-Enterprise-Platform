---
id: DOC-OPS-EXTERNAL-LEGAL-EVIDENCE-METADATA-REGISTER-20260328
layer: Operations
type: Report
status: approved
version: 1.3.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-EXTERNAL-LEGAL-EVIDENCE-METADATA-REGISTER-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: package.json;scripts/legal-evidence-status.cjs;scripts/legal-evidence-intake.cjs;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md
---
# EXTERNAL LEGAL EVIDENCE METADATA REGISTER

## CLAIM
id: CLAIM-OPS-EXTERNAL-LEGAL-EVIDENCE-METADATA-REGISTER-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение
Этот регистр хранит только metadata по внешним legal/compliance артефактам.

Он нужен, чтобы:
- не складывать чувствительные юридические документы в Git;
- всё равно иметь в репозитории воспроизводимый tracking по `reference_id`, статусам и owner-scope;
- обновлять audit-вердикты по факту приёмки внешних документов, а не по памяти команды.

## Правило использования
- actual документы лежат только во внешнем restricted store;
- в репозитории фиксируются лишь metadata и linkage к affected docs;
- статус меняется только после ручной сверки с реальным внешним артефактом.
- машинная сверка register/index/metadata выполняется через `pnpm gate:legal:evidence`;
- первичная приёмка внешнего файла в `received` выполняется через `pnpm legal:evidence:intake -- --reference=... --source=/abs/path/file`;
- человекочитаемая сводка пишется в `var/compliance/external-legal-evidence-status.md`.

## Alias owner map

| Owner-scope | Named owners |
|---|---|
| `legal/compliance` | `@chief_legal_officer` |
| `privacy / subject rights` | `@dpo` |
| `product/governance` | `@techlead`, `@product_lead` |
| `platform/infra` | `@backend-lead` |
| `ops/SRE` | `@backend-lead` |
| `security/AppSec` | `@techlead`, `@backend-lead` |
| `data` | `@data-architecture` |
| `board sign-off / IP authority` | `@board_of_directors` |

## Текущий статус на 2026-03-28

| Показатель | Значение |
|---|---|
| Total evidence items | `11` |
| `requested` | `11` |
| `received` | `0` |
| `reviewed` | `0` |
| `accepted` | `0` |
| `expired` | `0` |

## Register

| Reference ID | Артефакт | Status | Owner-scope | Named owners | Requested at | Review due | Linked docs | Next action |
|---|---|---|---|---|---|---|---|---|
| `ELP-20260328-01` | Operator identity and role memo | `requested` | `legal/compliance`, `product/governance` | `@chief_legal_officer`, `@board_of_directors`, `@techlead` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW` | приложить signed memo и перевести карточку в `received` |
| `ELP-20260328-02` | РКН notification evidence / exemption memo | `requested` | `legal/compliance` | `@chief_legal_officer` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW` | приложить notification number/date или exemption memo |
| `ELP-20260328-03` | Hosting / residency attestation | `requested` | `platform/infra`, `legal/compliance`, `ops/SRE` | `@backend-lead`, `@techlead`, `@chief_legal_officer` | `2026-03-28` | `2026-04-04` | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `PRIVACY_DATA_FLOW_MAP` | собрать provider/account/region evidence по средам |
| `ELP-20260328-04` | Processor / subprocessor register + DPA pack | `requested` | `legal/compliance`, `platform/infra` | `@chief_legal_officer`, `@backend-lead` | `2026-03-28` | `2026-04-04` | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `RF_COMPLIANCE_REVIEW` | приложить contracts/DPA по external providers |
| `ELP-20260328-05` | Transborder decision log | `requested` | `legal/compliance`, `product/governance`, `platform/infra` | `@chief_legal_officer`, `@techlead`, `@backend-lead` | `2026-03-28` | `2026-04-04` | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `AI_AGENT_FAILURE_SCENARIOS`, `PRIVACY_DATA_FLOW_MAP` | заполнить decisions по `OpenRouter`, `Telegram`, `DaData` и иным processors |
| `ELP-20260328-06` | Lawful basis matrix + privacy notice pack | `requested` | `legal/compliance`, `product/governance` | `@chief_legal_officer`, `@product_lead`, `@techlead` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `PRIVACY_DATA_FLOW_MAP` | свести lawful basis и notices по продуктовым flows |
| `ELP-20260328-07` | Subject rights operating evidence | `requested` | `legal/compliance`, `ops/SRE`, `product/governance` | `@dpo`, `@backend-lead`, `@product_lead` | `2026-03-28` | `2026-04-11` | `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK`, `RF_COMPLIANCE_REVIEW` | приложить ingress/SLA/escalation evidence |
| `ELP-20260328-08` | Retention / deletion / archive schedule approval | `requested` | `legal/compliance`, `data`, `ops/SRE` | `@chief_legal_officer`, `@data-architecture`, `@backend-lead` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK` | подписать retention matrix и legal hold rules |
| `ELP-20260328-09` | First-party chain-of-title pack | `requested` | `legal/compliance`, `product/governance` | `@chief_legal_officer`, `@board_of_directors` | `2026-03-28` | `2026-04-04` | `OSS_LICENSE_AND_IP_REGISTER`, `RF_COMPLIANCE_REVIEW` | приложить employment/contractor/IP transfer evidence |
| `ELP-20260328-10` | OSS unknown-license triage + notice pack | `requested` | `legal/compliance`, `security/AppSec` | `@chief_legal_officer`, `@backend-lead`, `@techlead` | `2026-03-28` | `2026-04-11` | `OSS_LICENSE_AND_IP_REGISTER`, `ENTERPRISE_EVIDENCE_MATRIX` | закрыть `UNKNOWN` packages и notice obligations |
| `ELP-20260328-11` | Crypto applicability memo | `requested` | `legal/compliance`, `security/AppSec`, `platform/infra` | `@chief_legal_officer`, `@backend-lead`, `@techlead` | `2026-03-28` | `2026-04-11` | `RF_COMPLIANCE_REVIEW`, `SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY` | выпустить профильное memo по ФСТЭК/ФСБ applicability |

## Правило обновления статусов
1. `requested -> received` только после появления реального внешнего файла или заверенного доступа к нему.
2. `received -> reviewed` только после ручной сверки content owner-ом.
3. `reviewed -> accepted` только после того, как обновлены связанные docs и audit-выводы.
4. Любой артефакт с истёкшим сроком review переводится в `expired` и требует revalidation.

## Прямой следующий operational шаг
Начать приёмку с `ELP-20260328-01`, `03`, `04`, `06` по runbook `EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md`.

Эффект:
- legal/compliance closeout получает owner-routed рабочую очередь приёмки;
- обновления `RF_COMPLIANCE_REVIEW` и `ENTERPRISE_DUE_DILIGENCE` можно делать по change-controlled статусам.
