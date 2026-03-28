---
id: DOC-OPS-EXTERNAL-LEGAL-EVIDENCE-METADATA-REGISTER-20260328
layer: Operations
type: Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-EXTERNAL-LEGAL-EVIDENCE-METADATA-REGISTER-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md
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

| Reference ID | Артефакт | Status | Owner-scope | Requested at | Review due | Linked docs | Next action |
|---|---|---|---|---|---|---|---|
| `ELP-20260328-01` | Operator identity and role memo | `requested` | `legal/compliance`, `product/governance` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW` | назначить named owner и приложить signed memo |
| `ELP-20260328-02` | РКН notification evidence / exemption memo | `requested` | `legal/compliance` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW` | приложить notification number/date или exemption memo |
| `ELP-20260328-03` | Hosting / residency attestation | `requested` | `platform/infra`, `legal/compliance`, `ops/SRE` | `2026-03-28` | `2026-04-04` | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `PRIVACY_DATA_FLOW_MAP` | собрать provider/account/region evidence по средам |
| `ELP-20260328-04` | Processor / subprocessor register + DPA pack | `requested` | `legal/compliance`, `platform/infra` | `2026-03-28` | `2026-04-04` | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `RF_COMPLIANCE_REVIEW` | приложить contracts/DPA по external providers |
| `ELP-20260328-05` | Transborder decision log | `requested` | `legal/compliance`, `product/governance`, `platform/infra` | `2026-03-28` | `2026-04-04` | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `AI_AGENT_FAILURE_SCENARIOS`, `PRIVACY_DATA_FLOW_MAP` | заполнить decisions по `OpenRouter`, `Telegram`, `DaData` и иным processors |
| `ELP-20260328-06` | Lawful basis matrix + privacy notice pack | `requested` | `legal/compliance`, `product/governance` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `PRIVACY_DATA_FLOW_MAP` | свести lawful basis и notices по продуктовым flows |
| `ELP-20260328-07` | Subject rights operating evidence | `requested` | `legal/compliance`, `ops/SRE`, `product/governance` | `2026-03-28` | `2026-04-11` | `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK`, `RF_COMPLIANCE_REVIEW` | приложить ingress/SLA/escalation evidence |
| `ELP-20260328-08` | Retention / deletion / archive schedule approval | `requested` | `legal/compliance`, `data`, `ops/SRE` | `2026-03-28` | `2026-04-04` | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK` | подписать retention matrix и legal hold rules |
| `ELP-20260328-09` | First-party chain-of-title pack | `requested` | `legal/compliance`, `product/governance` | `2026-03-28` | `2026-04-04` | `OSS_LICENSE_AND_IP_REGISTER`, `RF_COMPLIANCE_REVIEW` | приложить employment/contractor/IP transfer evidence |
| `ELP-20260328-10` | OSS unknown-license triage + notice pack | `requested` | `legal/compliance`, `security/AppSec` | `2026-03-28` | `2026-04-11` | `OSS_LICENSE_AND_IP_REGISTER`, `ENTERPRISE_EVIDENCE_MATRIX` | закрыть `UNKNOWN` packages и notice obligations |
| `ELP-20260328-11` | Crypto applicability memo | `requested` | `legal/compliance`, `security/AppSec`, `platform/infra` | `2026-03-28` | `2026-04-11` | `RF_COMPLIANCE_REVIEW`, `SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY` | выпустить профильное memo по ФСТЭК/ФСБ applicability |

## Правило обновления статусов
1. `requested -> received` только после появления реального внешнего файла или заверенного доступа к нему.
2. `received -> reviewed` только после ручной сверки content owner-ом.
3. `reviewed -> accepted` только после того, как обновлены связанные docs и audit-выводы.
4. Любой артефакт с истёкшим сроком review переводится в `expired` и требует revalidation.

## Прямой следующий operational шаг
Заполнить named owners и положить реальные внешние документы в restricted store под уже созданные `reference_id`.

Эффект:
- legal/compliance closeout получает не только список желаний, но и рабочую очередь приёмки;
- обновления `RF_COMPLIANCE_REVIEW` и `ENTERPRISE_DUE_DILIGENCE` можно делать по change-controlled статусам.
