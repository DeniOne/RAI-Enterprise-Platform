---
id: DOC-ARV-AUDIT-ENTERPRISE-EVIDENCE-MATRIX-20260328
layer: Archive
type: Research
status: approved
version: 1.13.0
owners: [@techlead]
last_updated: 2026-03-28
---
# ENTERPRISE EVIDENCE MATRIX 2026-03-28

## 1. Локальный Repo Evidence

| Класс | Источник | Наблюдение | Использование |
|---|---|---|---|
| code | `apps/api/src/main.ts` | API реально стартует на `4000`, Swagger только вне `production` | runtime map, deployment readiness |
| code | `apps/telegram-bot/src/main.ts` | telegram runtime слушает `4002` | runtime map |
| code | `.github/workflows/invariant-gates.yml` | CI уже запускает invariant/db/routing/docs gates | engineering governance |
| code | `.github/workflows/security-audit.yml` | security baseline теперь включает audit, secrets, schema validate, licenses, SBOM, artifact upload, provenance step | supply-chain and ops baseline |
| code | `.github/workflows/codeql-analysis.yml` | `CodeQL` добавлен как SAST baseline | AppSec baseline |
| code | `.github/workflows/dependency-review.yml` | PR dependency review добавлен | SCA / PR governance |
| code | `.github/CODEOWNERS` | ownership расширен на workflows, scripts, runtime shared paths и `docs/05_OPERATIONS` | access review / governance |
| code | `scripts/security-audit-ci.cjs` | reproducible `pnpm audit` wrapper c artifact output | SCA evidence |
| code | `scripts/scan-secrets.cjs` | tracked/local secret hygiene разделены; tracked fail, workspace warn | secret scanning evidence |
| code | `scripts/prisma-validate-safe.cjs` | schema validate стал воспроизводимым с placeholder `DATABASE_URL` | schema-integrity evidence |
| code | `scripts/generate-license-inventory.cjs` | строит inventory по `pnpm ls --json` | OSS/IP evidence |
| code | `scripts/generate-sbom.cjs` | генерирует `CycloneDX` SBOM для монорепо | SBOM evidence |
| code | `scripts/legal-evidence-status.cjs` | сверяет legal metadata register, restricted metadata files и status/index drift | legal evidence tracking |
| code | `scripts/legal-evidence-intake.cjs` | принимает внешний legal artifact в restricted store и синхронизирует `received`-статус | legal evidence intake |
| code | `scripts/legal-evidence-transition.cjs` | переводит legal evidence lifecycle в `reviewed` / `accepted` / `expired` с sync register/index | legal evidence lifecycle |
| code | `scripts/legal-evidence-template.cjs` | генерирует шаблоны внешних legal evidence documents по `reference_id` | legal evidence templates |
| code | `scripts/legal-evidence-prefill.cjs` | генерирует repo-derived working drafts по `ELP-*` без смены evidence status | legal owner handoff acceleration |
| code | `scripts/legal-evidence-verdict.cjs` | считает текущий `Legal / Compliance` verdict и blockers до следующего статуса на основе status report и register | legal verdict automation |
| docs | `docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md` | активный privacy/operator register создан | legal/privacy packet |
| docs | `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md` | внешний evidence checklist формализован с owner-scope и acceptance criteria | legal closeout packet |
| docs | `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md` | repo-side metadata register seeded: `11` external artifacts в статусе `requested` | legal tracking baseline |
| docs | `docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md` | named owners, status lifecycle и verdict-upgrade rules formalized | legal acceptance workflow |
| docs | `docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md` | provider inventory + deployment matrix созданы | deployment/legal packet |
| code | `.github/CODEOWNERS` | legal closeout docs получили explicit review guard с legal/privacy aliases | governance evidence |
| docs | `docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md` | активный OSS/IP register создан | legal/IP packet |
| docs | `docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md` | active security/access policy создана | security governance |
| docs | `docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md` | history/key material incident зафиксирован как отдельный ops artifact | incident evidence |
| docs | `docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md` | subject-rights/retention workflow formalized | privacy ops evidence |
| docs | `docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md` | release/backup/restore/DR packet formalized | deployment ops evidence |

## 2. Command Evidence

| Команда | Результат | Ключевой вывод |
|---|---|---|
| `pnpm lint:docs:matrix:strict` | PASS | новые ops/compliance docs и registry entries валидны |
| `pnpm lint:docs` | PASS | docs-as-code baseline зелёный |
| `pnpm gate:invariants` | PASS | `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0` |
| `pnpm gate:db:scope` | PASS | scope-manifest покрывает `TechMapReviewSnapshot`, `TechMapApprovalSnapshot`, `TechMapPublicationLock` |
| `pnpm gate:routing:primary-slices` | PASS (`4/4` suites, `86/86` tests) | routing corpus и case-memory baseline зелёные |
| `pnpm --filter api test -- --runInBand` | PASS (`252/252`, `1313 passed`, `1 skipped`) | backend regression baseline восстановлен |
| `pnpm --filter web test` | PASS (`42/42`, `482/482`) | frontend regression baseline восстановлен |
| `pnpm --filter telegram-bot test` | PASS (`17/17`) | telegram runtime quality baseline положительный |
| `pnpm gate:db:schema-validate` | PASS | `Prisma schema is valid`; env-dependence снята placeholder wrapper-ом |
| `pnpm security:audit:ci` | PASS (report mode) | итог: `1819 deps`, `5 low`, `26 moderate`, `37 high`, `2 critical` |
| `pnpm gate:secrets` | PASS | `tracked_findings=0`, `tracked_critical=0`, `workspace_local_findings=8` |
| `pnpm security:licenses` | PASS | `189 packages`, `33 unknown licenses` |
| `pnpm security:sbom` | PASS | `CycloneDX 1.6` SBOM generated в `var/security/bom.cdx.json` |
| `pnpm gate:legal:evidence` | PASS | legal metadata register и restricted store согласованы; `11 requested`, `0 overdue`, `0 issues` |
| `pnpm legal:evidence:verdict` | PASS | legal verdict считается кодом; текущий результат `NO-GO`, blockers до `CONDITIONAL GO` перечислены в generated report |
| `git rm --cached mg-core/backend/.env mg-core/backend/src/mg-chat/.env` | DONE | tracked secret env removed from index; remain workspace-only |

## 3. Generated Local Artifacts

| Артефакт | Статус | Значение |
|---|---|---|
| `var/security/security-audit-summary.json` | generated | reproducible dependency risk baseline |
| `var/security/secret-scan-report.json` | generated | tracked vs workspace secret hygiene split |
| `var/security/license-inventory.json` | generated | OSS license inventory |
| `var/security/license-inventory.md` | generated | human-readable license summary |
| `var/security/bom.cdx.json` | generated | `CycloneDX 1.6` SBOM |
| `var/schema/prisma-validate-safe.json` | generated | schema validate report |
| `var/compliance/external-legal-evidence-status.json` | generated | machine-readable legal evidence status |
| `var/compliance/external-legal-evidence-status.md` | generated | human-readable legal evidence status |
| `var/compliance/external-legal-evidence-verdict.json` | generated | machine-readable legal verdict and blockers |
| `var/compliance/external-legal-evidence-verdict.md` | generated | human-readable legal verdict and blockers |

## 4. Внешние Официальные Baselines

| Источник | URL | Для чего использован |
|---|---|---|
| NIST SSDF | <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf> | secure SDLC baseline |
| OWASP Top 10 for LLM Applications | <https://owasp.org/www-project-top-10-for-large-language-model-applications/> | AI/LLM threat baseline |
| SLSA | <https://slsa.dev/> | supply-chain maturity baseline |
| CycloneDX SBOM | <https://cyclonedx.org/capabilities/sbom/> | SBOM baseline |
| CIS Controls v8 | <https://www.cisecurity.org/controls/v8> | operational security baseline |
| 152-ФЗ amendments 08.08.2024 | <https://publication.pravo.gov.ru/document/0001202408080031> | актуализация требований по ПДн |
| 152-ФЗ amendments 28.02.2025 | <https://publication.pravo.gov.ru/document/0001202502280034> | актуализация требований по ПДн и связанным обязанностям |
| Роскомнадзор portal по ПДн | <https://pd.rkn.gov.ru/> | notification/localization/operator context |
| РКН official portal | <https://rkn.gov.ru/> | regulator baseline |
| ФСТЭК official portal | <https://fstec.ru/> | technical protection baseline |
| ФСБ / лицензирование криптосредств | <https://clsz.fsb.ru/> | crypto applicability check |
| Реестр российского ПО | <https://reestr.digital.gov.ru/> | Russian software registry applicability |
| Роспатент | <https://rospatent.gov.ru/> | program/database registration applicability |

## 5. Предыдущий Baseline Для Delta

| Источник | Класс baseline | Ограничение |
|---|---|---|
| `docs/_audit/FINAL_AUDIT_2026-03-20.md` | documentation/governance | не покрывает полный runtime, security и legal readiness |
| `docs/03_ENGINEERING/ADVISORY_GO_NO_GO_DECISION_RECORD.md` | slice-specific go/no-go | не является общесистемным verdict для всего репозитория |
| `interagency/reports/*` | implementation reports | полезны как точечный evidence, но не заменяют unified due diligence |
