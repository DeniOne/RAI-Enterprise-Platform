---
id: DOC-OPS-WORKFLOWS-EXTERNAL-LEGAL-EVIDENCE-ACCEPTANCE-RUNBOOK-20260328
layer: Operations
type: Runbook
status: approved
version: 1.2.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-WORKFLOWS-EXTERNAL-LEGAL-EVIDENCE-ACCEPTANCE-RUNBOOK-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: package.json;scripts/legal-evidence-status.cjs;scripts/legal-evidence-intake.cjs;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;.github/CODEOWNERS
---
# EXTERNAL LEGAL EVIDENCE ACCEPTANCE RUNBOOK

## CLAIM
id: CLAIM-OPS-WORKFLOWS-EXTERNAL-LEGAL-EVIDENCE-ACCEPTANCE-RUNBOOK-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение
Этот runbook задаёт единый порядок приёмки внешних legal/compliance артефактов по `ELP-20260328-01 .. 11`.

Он нужен, чтобы:
- не терять ownership между legal, governance, infra и product;
- одинаково переводить статусы `requested -> received -> reviewed -> accepted`;
- обновлять audit-вердикты только по подтверждённой evidence-цепочке.

## Канонический owner-routing

| Контур | Named owners |
|---|---|
| `legal/compliance` | `@chief_legal_officer` |
| `privacy / subject rights` | `@dpo` |
| `product/governance` | `@techlead`, `@product_lead` |
| `platform/infra` | `@backend-lead` |
| `ops/SRE` | `@backend-lead` |
| `security/AppSec` | `@techlead`, `@backend-lead` |
| `data` | `@data-architecture` |
| `board sign-off / IP authority` | `@board_of_directors` |

## Порядок приёмки
1. Найти `reference_id` в `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`.
2. Запустить `pnpm legal:evidence:intake -- --reference=... --source=/abs/path/file`.
3. Intake-команда положит внешний документ в restricted store с тем же `reference_id`, обновит restricted metadata и repo-side register.
4. Провести owner review:
   - content owner проверяет полноту и актуальность;
   - governance owner проверяет, какие docs и audit-выводы должны обновиться;
   - при споре использовать `rejected` локально вне репозитория и не поднимать статус в repo-side register.
5. После ручной проверки перевести карточку в `reviewed`.
6. Обновить связанные документы и только потом перевести карточку в `accepted`.
7. Запустить `pnpm gate:legal:evidence`, чтобы поймать drift между repo-side register и restricted metadata.

## Acceptance checks

| Тип evidence | Что обязательно проверить |
|---|---|
| Operator / РКН | реквизиты, дата, номер, scope, субъект обязанности |
| Hosting / residency | provider, region, страна, какие среды покрыты |
| Processor / DPA | role split, countries, purpose, contract reference |
| Transborder | categories of data, lawful basis, allow/deny decision, mitigation |
| Lawful basis / notices | связь с реальными product flows и текстами |
| Subject rights | канал intake, SLA, escalation, execution proof |
| Retention / archive | сроки, stop-factors, legal hold, WORM carve-outs |
| IP / chain-of-title | first-party ownership, contractor transfer, DB rights |
| OSS triage | закрытие `UNKNOWN`, notice obligations, restrictions |
| Crypto memo | applicability, perimeter, required follow-up actions |

## Когда можно поднимать verdict

| Целевой сдвиг | Что должно быть `accepted` |
|---|---|
| `Legal / Compliance: NO-GO -> CONDITIONAL GO` | `ELP-20260328-01`, `02`, `03`, `04`, `05`, `06`, `08`, `09` |
| `Legal / Compliance: CONDITIONAL GO -> GO` | все `ELP-20260328-01 .. 11` |

## Review guard
- Все правки в legal closeout docs проходят review через `CODEOWNERS`.
- Если owner-алиас изменён, сначала обновляется этот runbook, затем metadata register и только потом audit docs.

## Stop criteria
- документ без `reference_id`;
- документ без owner review;
- документ не покрывает фактический deployment contour;
- документ противоречит текущему `provider` или `data-flow` baseline;
- документ просрочен и не прошёл revalidation.

## Прямой следующий operational шаг
Начинать приёмку с `ELP-20260328-01`, `03`, `04`, `06` и переводить их в `received` по мере появления реальных внешних документов.

Эффект:
- порядок движения по legal closeout становится детерминированным;
- команда видит, какие карточки дают максимальный эффект на итоговый verdict.
