---
id: DOC-OPS-EXTERNAL-LEGAL-EVIDENCE-REQUEST-PACKET-20260328
layer: Operations
type: Report
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-EXTERNAL-LEGAL-EVIDENCE-REQUEST-PACKET-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;apps/api/src/modules/rai-chat/agent-platform/openrouter-gateway.service.ts;apps/api/src/modules/commerce/services/providers/dadata.provider.ts;apps/telegram-bot/src/app.module.ts
---
# EXTERNAL LEGAL EVIDENCE REQUEST PACKET

## CLAIM
id: CLAIM-OPS-EXTERNAL-LEGAL-EVIDENCE-REQUEST-PACKET-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение
Этот документ превращает оставшийся `Legal / Compliance = NO-GO` из абстрактного вывода в управляемый пакет внешних доказательств.

Он не утверждает, что юридические артефакты уже собраны. Он фиксирует:
- какой внешний evidence нужен;
- кто владеет сбором;
- где этот evidence обычно берётся;
- по каким критериям он считается достаточным;
- какие audit- и operational-решения он разблокирует.

Текущий repo-side tracking для этих позиций ведётся в `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`.

## Правило хранения доказательств
Юридические, договорные и чувствительные артефакты не нужно складывать в открытый Git-репозиторий.

Практическое правило:
- сами документы хранить во внешнем restricted evidence store;
- в репозитории фиксировать только metadata-карточку: `reference_id`, `owner`, `scope`, `status`, `issued_at`, `review_due`, `notes`;
- любые публичные claim в docs обновлять только после сверки по фактическому внешнему артефакту.

## Decision Rule

| Сдвиг статуса | Минимально обязательные позиции |
|---|---|
| `NO-GO -> CONDITIONAL GO` | 1, 2, 3, 4, 5, 6, 8, 9 complete; 7 и 10 как минимум назначены и имеют owner/SLA |
| `CONDITIONAL GO -> GO` | все позиции 1-11 complete и привязаны к фактической deployment topology |

## Required External Evidence Register

| # | Артефакт | Urgency | Owner-scope | Где получать | Acceptance criteria | Если отсутствует | Mapping |
|---|---|---|---|---|---|---|---|
| 1 | Operator identity and role memo | Critical | `legal/compliance`, `product/governance` | учредительные данные, внутреннее решение, договорная схема | указан оператор по каждому deployment contour, реквизиты, контакты, operator/processor split, дата и owner | legal verdict остаётся `NO-GO`; невозможно корректно интерпретировать 152-ФЗ obligations | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW` |
| 2 | РКН notification evidence или reasoned exemption memo | Critical | `legal/compliance` | `pd.rkn.gov.ru`, внутренний legal archive, signed memo | есть номер/дата уведомления или мотивированное заключение, почему обязанность не наступает | нельзя снять красный блок по notification status | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW` |
| 3 | Hosting / residency attestation по фактическим средам | Critical | `platform/infra`, `legal/compliance`, `ops/SRE` | hosting provider account, invoices, contracts, topology records | для `prod/pilot/staging` указаны country, provider, region, storage tiers и путь первичного хранения ПДн граждан РФ | локализация и residency остаются недоказанными | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `PRIVACY_DATA_FLOW_MAP` |
| 4 | Processor / subprocessor register + DPA pack | Critical | `legal/compliance`, `platform/infra` | provider contracts, DPAs, terms archives | покрыты `OpenRouter`, `Telegram`, `DaData`, hosting/storage и иные внешние processors; есть role, country, purpose, contract reference | transfer/processors chain остаётся недоказанной | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `RF_COMPLIANCE_REVIEW` |
| 5 | Transborder decision log | Critical | `legal/compliance`, `product/governance`, `platform/infra` | legal memo, provider register, architecture review | по каждому external provider указаны countries, categories of data, lawful basis, allowed/prohibited use, mitigation и owner decision | AI/telegram/provider контуры остаются в повышенном legal-risk perimeter | `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`, `AI_AGENT_FAILURE_SCENARIOS`, `PRIVACY_DATA_FLOW_MAP` |
| 6 | Lawful basis matrix + privacy notice / consent wording pack | Critical | `legal/compliance`, `product/governance` | privacy notice drafts, UX texts, contract templates, internal policies | цели, категории данных, subjects, basis, notices, consents и exceptions сведены в одну матрицу и связаны с реальными product flows | нельзя доказать lawful basis и transparency obligations | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `PRIVACY_DATA_FLOW_MAP` |
| 7 | Subject rights operating evidence | High | `legal/compliance`, `ops/SRE`, `product/governance` | service desk process, internal SLA, runbook confirmation | есть ingress channel, SLA, owner, escalation path и минимум один шаблон обработки запроса на доступ/удаление/ограничение | права субъектов остаются только описанными, но не operationalized | `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK`, `RF_COMPLIANCE_REVIEW` |
| 8 | Retention / deletion / archive schedule approval | Critical | `legal/compliance`, `data`, `ops/SRE` | records retention policy, data governance approvals | для основных data classes заданы сроки, триггеры удаления, архивирование, legal hold и WORM carve-outs | retention остаётся частичной и невалидированной | `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK` |
| 9 | First-party chain-of-title pack по ПО и БД | Critical | `legal/compliance`, `product/governance` | employment agreements, contractor assignments, IP transfer docs | подтверждены права на first-party code, database rights, contractor contributions и право коммерческого использования | enterprise procurement и реестр российского ПО остаются недоступными | `OSS_LICENSE_AND_IP_REGISTER`, `RF_COMPLIANCE_REVIEW` |
| 10 | OSS unknown-license triage + notice obligations pack | High | `legal/compliance`, `security/AppSec` | legal review по `var/security/license-inventory.json` | `UNKNOWN` licenses разобраны, notice obligations и запреты задокументированы | OSS/IP risk остаётся открытым и может блокировать продажи/дистрибуцию | `OSS_LICENSE_AND_IP_REGISTER`, `ENTERPRISE_EVIDENCE_MATRIX` |
| 11 | Crypto applicability memo по ФСТЭК/ФСБ периметру | Medium | `legal/compliance`, `security/AppSec`, `platform/infra` | профильное legal/security заключение | определено, требует ли текущий crypto contour отдельного licensing/compliance action | crypto regulatory contour остаётся в зоне неопределённости | `RF_COMPLIANCE_REVIEW`, `SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY` |

## Packet Metadata Template

| Поле | Что фиксировать |
|---|---|
| `reference_id` | уникальный ID внешнего артефакта |
| `artifact_name` | человекочитаемое название |
| `owner` | ответственный owner |
| `scope` | какие среды, субъекты, providers и deployment contours покрыты |
| `status` | `requested`, `received`, `reviewed`, `accepted`, `expired` |
| `issued_at` | дата выпуска документа |
| `review_due` | когда нужна повторная проверка |
| `linked_docs` | какие репозиторные документы обновляются после приёмки |
| `notes` | ограничения, исключения, follow-up |

## Порядок сбора
1. Сначала закрыть позиции 1-6 и 8, потому что без них legal verdict не поднимается даже до `CONDITIONAL GO`.
2. Затем закрыть позиции 9-10, чтобы снять procurement/IP blockers и подготовить пакет для enterprise due diligence.
3. После этого добрать 7 и 11 как operational completion layer, чтобы legal/process/security контуры были не только оформлены, но и замкнуты по исполнению.

## Прямой следующий operational шаг
Заполнить named owners в `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md` и прикрепить реальные внешние документы к уже созданным `reference_id` в restricted store.

Эффект:
- legal backlog перестаёт быть списком общих пожеланий;
- каждому красному блоку уже есть `reference_id`, acceptance criteria и путь до закрытия;
- `RF_COMPLIANCE_REVIEW` и enterprise due diligence можно обновлять по фактам, а не по предположениям.
