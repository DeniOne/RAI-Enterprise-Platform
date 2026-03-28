---
id: DOC-ARV-AUDIT-DELTA-VS-BASELINE-20260328
layer: Archive
type: Research
status: approved
version: 1.13.0
owners: [@techlead]
last_updated: 2026-03-28
---
# DELTA VS BASELINE 2026-03-28

## 1. Ограничение Сравнения

`docs/_audit/FINAL_AUDIT_2026-03-20.md` был прежде всего documentation/governance baseline. Текущий due diligence охватывает код, gates, build/test, security, privacy, legal/compliance и deployment evidence. Поэтому часть пунктов ниже — это не деградация относительно 2026-03-20, а newly surfaced runtime evidence.

## 2. Улучшилось

| Baseline факт | Текущий факт | Evidence | Интерпретация |
|---|---|---|---|
| 2026-03-20 baseline не доказывал единый quality baseline по основному контуру | `apps/api`, `apps/web`, `apps/telegram-bot` и routing проходят актуальные build/test/gates | command evidence 2026-03-28 | репозиторий вышел из fragmented red state |
| Guard coverage и raw SQL governance были красной зоной | `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0` | `pnpm gate:invariants`, `node scripts/raw-sql-governance.cjs --enforce` | runtime hygiene заметно усилена |
| Security audit path был невоспроизводимым | есть `pnpm security:audit:ci` с JSON summary и artifact output | `scripts/security-audit-ci.cjs`, `var/security/security-audit-summary.json` | AppSec baseline стал decision-usable |
| Secret hygiene не имела локального scanner baseline | есть `pnpm gate:secrets`; tracked secrets сняты до `0` | `scripts/scan-secrets.cjs`, `var/security/secret-scan-report.json` | repo-state очищен от tracked secret debt |
| Schema validate зависел от runtime env | `pnpm gate:db:schema-validate` проходит через safe wrapper | `scripts/prisma-validate-safe.cjs`, `var/schema/prisma-validate-safe.json` | schema-integrity теперь воспроизводима |
| OSS/IP контур был только красным тезисом в аудите | есть active `OSS_LICENSE_AND_IP_REGISTER` и generated inventory | `docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md`, `var/security/license-inventory.json` | IP/license backlog стал управляемым |
| Privacy/legal контур был только архивным выводом | есть active operator/privacy register, transborder/deployment matrix, subject-rights runbook, external evidence request packet, metadata register, acceptance runbook, template generator, repo-derived prefill generator, intake command, lifecycle transition command, reproducible status gate и машинный verdict report | новые docs в `docs/05_OPERATIONS` + `scripts/legal-evidence-*.cjs` | legal backlog больше не разрозненный и переведён в criteria-driven closeout queue с owner-routing, шаблонами, prefill drafts, full lifecycle machine-check и автоматическим расчётом verdict |
| Access governance была ограничена DB-ядром | `CODEOWNERS` расширен на workflows, scripts и критичные runtime paths | `.github/CODEOWNERS` | ownership perimeter стал шире |
| SBOM/provenance не были подтверждены | добавлен `pnpm security:sbom` и provenance-ready workflow step | `scripts/generate-sbom.cjs`, `.github/workflows/security-audit.yml` | supply-chain baseline стал реальным, а не плановым |

## 3. Деградировало Или Вскрылось Как Новый Красный Факт

| Baseline факт | Текущий факт | Evidence | Интерпретация |
|---|---|---|---|
| 2026-03-20 baseline не оценивал dependency risk системно | `pnpm security:audit:ci` показал `37 high / 2 critical` | `var/security/security-audit-summary.json` | реальный AppSec debt стал измеримым |
| История key material не была формализована | `ca.key` и tracked `mg-core` env теперь оформлены как отдельный incident class | `docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md` | history/rotation debt стал явным управленческим обязательством |
| Legal/compliance ранее был общим красным выводом | теперь gap детализирован до operator, notification, residency, processor, IP | current RF review + active ops docs | краснота стала точнее и полезнее для решения |

## 4. Осталось Красным

| Проблема | Baseline 2026-03-20 | Статус 2026-03-28 | Evidence |
|---|---|---|---|
| Документацию нельзя использовать как единственный source of truth | красный | красный, но теперь лучше отделена от code/gates | old baseline + current source-of-truth policy |
| Полный legal/compliance pack по РФ | не раскрыт полноценно | красный | `RF_COMPLIANCE_REVIEW_2026-03-28.md` |
| Dependency vulnerability debt | не раскрыт полноценно | красный | `var/security/security-audit-summary.json` |
| External branch protection / access settings evidence | не раскрыт полноценно | красный, хотя для legal docs owner-routing усилен через `CODEOWNERS` | локально не подтверждается |
| Latest backup/restore execution evidence | не раскрыт полноценно | красный | runbooks есть, execution report нет |

## 5. Delta Summary

- Улучшилось: runtime quality baseline, invariant hygiene, reproducible audit/secret/schema/license/SBOM controls, active ops/compliance packet, explicit legal closeout packet, seeded metadata queue, acceptance runbook, legal verdict automation, expanded CODEOWNERS.
- Вскрылось и стало измеримым: dependency risk, workspace secret hygiene, точный legal/operator gap, history/rotation debt.
- Осталось красным: внешний legal evidence, unresolved dependency vulnerabilities, external GitHub settings evidence и отсутствие свежего DR execution report.
