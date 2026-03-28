---
id: DOC-ARV-AUDIT-ENTERPRISE-EVIDENCE-MATRIX-20260328
layer: Archive
type: Research
status: approved
version: 1.2.0
owners: [@techlead]
last_updated: 2026-03-28
---
# ENTERPRISE EVIDENCE MATRIX 2026-03-28

## 1. Локальный Repo Evidence

| Класс | Источник | Наблюдение | Использование |
|---|---|---|---|
| code | `apps/api/src/main.ts` | API реально стартует на `4000`, Swagger только вне `production` | runtime map, deployment readiness |
| code | `apps/telegram-bot/src/main.ts` | telegram runtime слушает `4002` | runtime map |
| code | `apps/web/package.json` | `next build`, `jest --runInBand`, `next lint` | frontend readiness |
| code | `.github/workflows/invariant-gates.yml` | CI уже запускает `gate:invariants`, DB gates, routing gate, docs lint | ops/governance maturity |
| code | `.github/workflows/security-audit.yml` | `pnpm audit --audit-level=high`, пока non-blocking | supply-chain baseline |
| code | `.github/CODEOWNERS` | ownership ограничен DB/architecture contour | governance gap |
| code | `infra/gateway/certs/ca.key` | файл удалён из рабочего дерева и снят с текущего индекса; остаётся history/rotation debt | historical key-incident, нужен review Git history, commit cleanup и rotation review |
| docs | `README.md` | active runtime описан как `apps/api + apps/web + apps/telegram-bot + packages/* + infra/*` | scope validation |
| docs | `docs/_audit/FINAL_AUDIT_2026-03-20.md` | baseline был documentation/governance-focused | delta baseline |
| docs | `interagency/INDEX.md` | зафиксированы code-backed reports по incident ops, PII masking, governance counters | AI/governance evidence |
| memory-bank | `memory-bank/activeContext.md` | WORM fail-closed и object lock bootstrap зафиксированы как логические изменения | audit/ops evidence |

## 2. Command Evidence

| Команда | Результат | Ключевой вывод |
|---|---|---|
| `pnpm lint:docs:matrix:strict` | initial FAIL (`2` errors) -> final PASS | выявил defects в `_audit` prompt и `GRIPIL_WEB_DEPLOYMENT_GUIDE.md`; после фиксации matrix governance зелёный |
| `pnpm lint:docs` | PASS | docs-as-code baseline зелёный |
| `pnpm lint:tenant-context` | PASS | multi-tenant lint-контур жив |
| `pnpm lint:fsm-status-updates` | PASS | FSM-governance lint жив |
| `pnpm gate:invariants` | PASS, `exit 0` | final state: `verify-invariants: OK`, `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0`, `all_invariant_checks_passed` |
| `node scripts/raw-sql-governance.cjs --enforce` | PASS | `raw_sql_review_required=0`, `raw_sql_unsafe=0`; governance больше не считает test-mocks реальными bypass path |
| `pnpm gate:db:scope` | FAIL (warn findings) | missing scope-manifest entries for `TechMap*Snapshot/Lock` |
| `pnpm gate:db:ownership` | PASS | ownership manifest не сигналит нарушений |
| `pnpm gate:db:forbidden-relations` | PASS | нет явных forbidden-relation drift |
| `pnpm gate:db:phase0` | WARN | `82` weak `@@index([companyId])` pattern, `9` heavy include zones |
| `pnpm gate:db:phase3` | PASS | composed schema согласуется с fragments |
| `pnpm gate:db:projections` | PASS | projection register существует |
| `pnpm gate:db:enum-register` | PASS | enum register существует |
| `pnpm gate:db:index-evidence` | PASS | index evidence register существует |
| `pnpm gate:db:growth-kpi` | artifact generated | growth KPI path существует, но команда пишет tracked docs artifact |
| `pnpm gate:routing:primary-slices` | PASS (`4/4` suites, `86/86` tests) | routing corpus и case-memory baseline зелёные |
| `pnpm --filter api build` | PASS | backend build baseline жив |
| `pnpm --filter telegram-bot build` | PASS | telegram build baseline жив |
| `pnpm --filter web build` | PASS | Next.js production build, TypeScript и static generation (`132/132`) завершаются успешно |
| `pnpm --filter telegram-bot test` | PASS (`17/17`) | telegram runtime quality baseline положительный |
| `pnpm --filter web test` | PASS (`42/42` suites, `482/482` tests) | frontend regression baseline восстановлен |
| `pnpm --filter api test -- --runInBand` | PASS (`252/252` suites, `1313 passed`, `1 skipped`) | backend regression baseline восстановлен в сериализованном прогоне |
| `pnpm --filter @rai/agro-orchestrator check-types` | PASS | минимум один package-level explicit typecheck зелёный |
| `pnpm --filter @rai/prisma-client exec prisma validate --schema schema.prisma` | FAIL | schema validation завязана на runtime env `DATABASE_URL` |
| `timeout 30s pnpm audit --audit-level=high` | timebox exhausted | security audit path требует отдельной operational stabilization |

## 3. Внешние Официальные Baselines

| Источник | URL | Для чего использован |
|---|---|---|
| NIST SSDF | <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf> | secure SDLC baseline |
| OWASP Top 10 for LLM Applications | <https://owasp.org/www-project-top-10-for-large-language-model-applications/> | AI/LLM threat baseline |
| SLSA | <https://slsa.dev/> | supply-chain maturity baseline |
| CycloneDX SBOM | <https://cyclonedx.org/capabilities/sbom/> | SBOM requirement baseline |
| CIS Controls v8 | <https://www.cisecurity.org/controls/v8> | operational security baseline |
| Next.js deployment docs | <https://nextjs.org/docs/app/getting-started/deployment> | frontend deployment baseline |
| NestJS authentication docs | <https://docs.nestjs.com/security/authentication> | backend auth/security baseline |
| Prisma migrate production docs | <https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production> | schema/migration baseline |
| PostgreSQL row security docs | <https://www.postgresql.org/docs/current/ddl-rowsecurity.html> | tenant isolation and DB security reference |
| 152-ФЗ amendments 08.08.2024 | <https://publication.pravo.gov.ru/document/0001202408080031> | актуализация требований по ПДн |
| 152-ФЗ amendments 28.02.2025 | <https://publication.pravo.gov.ru/document/0001202502280034> | актуализация требований по ПДн и связанным обязанностям |
| Роскомнадзор portal по ПДн | <https://pd.rkn.gov.ru/> | notification/localization/operator context |
| РКН official portal | <https://rkn.gov.ru/> | regulator baseline |
| ФСТЭК official portal | <https://fstec.ru/> | technical protection baseline |
| ФСБ / лицензирование криптосредств | <https://clsz.fsb.ru/> | crypto applicability check |
| Реестр российского ПО | <https://reestr.digital.gov.ru/> | Russian software registry applicability |
| Роспатент | <https://rospatent.gov.ru/> | program/database registration applicability |

## 4. Предыдущий Baseline Для Delta

| Источник | Класс baseline | Ограничение |
|---|---|---|
| `docs/_audit/FINAL_AUDIT_2026-03-20.md` | documentation/governance | не покрывает полный runtime, security и legal readiness |
| `docs/03_ENGINEERING/ADVISORY_GO_NO_GO_DECISION_RECORD.md` | slice-specific go/no-go | не является общесистемным verdict для всего репозитория |
| `interagency/reports/*` | implementation reports | полезны как точечный evidence, но не заменяют unified due diligence |
