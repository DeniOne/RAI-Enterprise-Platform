---
id: DOC-ARV-AUDIT-ENTERPRISE-DUE-DILIGENCE-20260328
layer: Archive
type: Research
status: approved
version: 1.14.0
owners: [@techlead]
last_updated: 2026-03-28
---
# ENTERPRISE DUE DILIGENCE 2026-03-28

## 1. Audit Baseline

- Дата initial baseline: `2026-03-28T06:55:12Z`
- Branch: `main`
- Commit baseline: `55d846221ec8374f94c7de9257caabf0427915e1`
- Excluded paths: `apps/gripil-web`, `apps/gripil-web-awwwards`
- Source of truth order: `code/tests/gates > generated manifests > docs`
- Текущая синхронизация версии `1.7.0` отражает post-baseline remediation на ту же дату и опирается на локально воспроизведённые команды, scripts и workflows.
- Canonical docs set:
  - `docs/00_CORE`
  - `docs/01_ARCHITECTURE`
  - `docs/04_AI_SYSTEM`
  - `docs/05_OPERATIONS`
  - claim-managed active layers `docs/00_STRATEGY`, `docs/02_DOMAINS`, `docs/02_PRODUCT`, `docs/03_ENGINEERING`, `docs/06_METRICS`, `docs/07_EXECUTION`, `docs/08_TESTING`, `docs/10_FRONTEND_MENU_IMPLEMENTATION`, `docs/11_INSTRUCTIONS`
- Previous baseline for delta:
  - `docs/_audit/FINAL_AUDIT_2026-03-20.md`
  - dated readiness/go-no-go артефакты из `docs/03_ENGINEERING`, `docs/07_EXECUTION`, `interagency/reports`

## 2. Executive Verdict

| Ось | Вердикт | Решающий критерий | Ключевые блокеры | Что поднимает статус |
|---|---|---|---|---|
| Security | `CONDITIONAL GO` | runtime baseline зелёный, `secret scan`, `security audit`, `SAST/SCA/SBOM` workflows добавлены | `37 high / 2 critical` dependency findings; history/rotation debt; локальные workspace secrets; remote attestation/CodeQL results ещё не зафиксированы как closed loop | закрыть критичные advisories, подтвердить rotation/revocation, получить первый CI-backed AppSec cycle |
| Legal / Compliance | `NO-GO` | active legal/privacy packet теперь есть, внешний evidence checklist, metadata register, acceptance runbook и машинный отчёт по verdict формализованы, но сами operator/legal доказательства не подтверждены | нет подтверждённого notification status в РКН; нет actual residency evidence; нет processor contracts; нет chain-of-title pack | заполнить реальные артефакты по `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`, провести их через acceptance runbook и пересчитать verdict через `pnpm legal:evidence:verdict` |
| Deployment / Operations | `CONDITIONAL GO` | build/test/gates зелёные, release/backup/DR runbooks и deployment matrix формализованы | нет последнего подтверждённого backup/restore execution report; install/upgrade packet неполный; branch protection evidence остаётся внешним | провести backup/restore drill, оформить installability packet и зафиксировать GitHub protection state |
| Product Readiness | `CONDITIONAL GO` | разработку и controlled pilot продолжать можно без restructuring | внешний legal/compliance контур не готов; security debt по зависимостям и secret hygiene не закрыт до конца | ограничить pilot self-host/localized контуром и закрыть legal/AppSec backlog |

## 3. Что Это За Система По Факту

`RAI_EP` по коду — это `pnpm`/`Turborepo` monorepo для multi-tenant платформы агроопераций, финансово-экономического контура, CRM/commerce, explainability/audit trail, telegram/web front-office и Stage 2 `agent-first governed runtime`.

На дату синхронизации это уже не prototype: у репозитория есть зелёный quality baseline по основным `build/test/gates`, воспроизводимые security/compliance scripts и активный ops/legal packet. Но до launch-grade enterprise readiness система всё ещё не дотягивает из-за unresolved dependency risk, внешнего legal evidence gap и неполного install/ops packet.

Главный диагноз: инженерный baseline заметно окреп и теперь выглядит управляемым, но enterprise decision всё ещё ограничен не архитектурой, а доказательной дисциплиной вокруг AppSec, privacy/legal и deployment ownership.

## 4. Можно Ли Продолжать / Запускать

- Продолжать разработку без restructuring: `да`
- Запускать controlled pilot: `да, условно`, только на self-host/localized path и после owner decision по legal/compliance
- Запускать внешний production c ПДн граждан РФ: `нет`
- Внедрять у enterprise-клиентов как ready-to-launch продукт: `нет`

## 5. System Readiness Score

```text
Architecture: 6.5/10
Code Integrity: 7.0/10
Backend: 7.0/10
Frontend: 6.0/10
Telegram Runtime: 6.5/10
Data / Schema Integrity: 6.8/10
AI / Agent Governance: 6.5/10
Security: 6.5/10
Legal / Compliance: 3.5/10
Deployment / Operations: 6.8/10

Overall: 6.5/10
```

## 6. Ключевой Evidence Snapshot

| Проверка | Результат | Вывод |
|---|---|---|
| `pnpm lint:docs:matrix:strict` | PASS | новый ops/compliance packet и docs matrix governance валидны |
| `pnpm lint:docs` | PASS | docs-as-code baseline остаётся зелёным после расширения `docs/05_OPERATIONS` |
| `pnpm gate:invariants` | PASS | `controllers_without_guards=0`; `raw_sql_review_required=0`; `raw_sql_unsafe=0`; `violations=0` |
| `pnpm gate:db:schema-validate` | PASS | `prisma validate` стал воспроизводимым через placeholder `DATABASE_URL`; остался только migration note по deprecated `package.json#prisma` |
| `pnpm security:audit:ci` | PASS (report mode) | reproducible audit path теперь есть; текущее состояние: `1819 deps`, `37 high`, `2 critical` |
| `pnpm gate:secrets` | PASS | `tracked_findings=0`, `tracked_critical=0`; локальные workspace warnings есть, но в Git больше не tracked |
| `pnpm security:licenses` | PASS | построен OSS inventory: `189 packages`, `33 unknown licenses` |
| `pnpm security:sbom` | PASS | генерируется `CycloneDX 1.6` SBOM в `var/security/bom.cdx.json` |
| `pnpm gate:legal:evidence` | PASS | legal register, restricted metadata store и index согласованы; `11 requested`, `0 overdue`, `0 issues` |
| `pnpm legal:evidence:verdict` | PASS | legal verdict считается детерминированно; текущий статус: `NO-GO`, blockers до `CONDITIONAL GO` рассчитываются автоматически |
| `pnpm gate:routing:primary-slices` | PASS, `4/4` suites, `86/86` tests | routing corpus и case-memory baseline зелёные |
| `pnpm --filter api test -- --runInBand` | PASS, `252/252` suites, `1313 passed`, `1 skipped` | backend regression baseline восстановлен |
| `pnpm --filter web test` | PASS, `42/42` suites, `482/482` tests | frontend regression baseline восстановлен |
| `pnpm --filter telegram-bot test` | PASS, `17/17` | telegram baseline стабилен |

## 7. Deployment Target Matrix

| Модель | Текущее состояние | Evidence | Блокеры | Итог |
|---|---|---|---|---|
| `SaaS` | `partial` | green `api/web/telegram` baseline, tenant/governance gates, reproducible security scripts | external legal/residency evidence отсутствует, branch protection external, unresolved advisories | годится только для controlled pilot |
| `Managed deployment` | `partial` | runbooks, advisory DR scripts, config-driven provider contour, deployment matrix оформлен | нет install/upgrade packet и последнего подтверждённого restore report | технически близко, но ops packet ещё не замкнут |
| `On-prem / self-hosted` | `partial` | local `.env.example`, `docker-compose`, self-host Postgres/Redis/MinIO path, safe schema validate, secret hygiene controls | нет формального installer/bootstrap pack и external support boundary | наиболее реалистичный pilot path |
| `Hybrid` | `not evidenced` | provider matrix допускает смешанный контур | нет отдельной topology и data-boundary карты | не доказано |

## 8. Топ Сильных Сторон

1. Широкий доменный охват: `agro`, `finance-economy`, `crm/commerce`, `legal`, `knowledge`, `rai-chat`.
2. Есть реальные governance gates, а не только декларации в документации.
3. `api`, `web` и `telegram-bot` проходят актуальный build/test baseline.
4. `tenant-context`, `fsm-status`, routing и invariant gate зелёные.
5. Schema-integrity baseline усилен отдельным безопасным `prisma validate` wrapper.
6. Добавлен reproducible security baseline: audit, secret scan, license inventory, SBOM.
7. Добавлены `CodeQL`, PR dependency review и provenance-ready security workflow.
8. Операционный слой получил активный compliance/deployment/privacy packet в `docs/05_OPERATIONS`, включая explicit external evidence request packet, metadata register, acceptance runbook, template generator, repo-derived prefill generator, intake command, lifecycle transition command, reproducible legal metadata gate, машинный отчёт по legal verdict и owner-oriented handoff queue.
9. `CODEOWNERS` расширен на workflows, scripts и критичные runtime paths.
10. Текущий Git больше не содержит tracked key material и tracked `.env` с секретами.

## 9. Топ Рисков

1. `pnpm security:audit:ci` подтверждает `37 high / 2 critical` dependency findings.
2. Legal/compliance по ПДн РФ остаётся `NO-GO`, потому что внешний operator/legal packet не подтверждён.
3. Локальные workspace `.env` с чувствительными значениями всё ещё существуют и требуют дисциплины rotation/use outside Git.
4. Исторический `ca.key` и удалённые tracked `.env` требуют отдельного rotation/revocation подтверждения.
5. Нет последнего подтверждённого backup/restore execution report и install/upgrade packet.
6. Branch protection, reviewers, environment secrets и access settings не выводятся из локального Git и остаются непроверенным внешним evidence.
7. `33` пакета в license inventory имеют `UNKNOWN` license status.
8. `CodeQL`, dependency review и attestation добавлены, но их первый closed-loop CI cycle ещё не зафиксирован в audit evidence.

## 10. Residual Controls Register

| Контроль | Current state | Urgency | Owner-scope | Risk covered | `0-30 days` | `30-60 days` | `60-90+ days` |
|---|---|---|---|---|---|---|---|
| `SAST` | `CodeQL workflow added; no reviewed SARIF baseline yet` | High | `security/AppSec`, `backend`, `frontend` | небезопасные паттерны и регрессии | получить первый CI report и triage | зафиксировать SLA | сделать blocking policy для confirmed high/critical |
| `SCA` | `audit + dependency review active; unresolved findings remain` | Critical | `security/AppSec`, `platform/infra` | уязвимые зависимости | закрыть top critical/high packages | ввести recurring remediation cadence | связать с release approval |
| `SBOM + provenance` | `SBOM generation active; provenance step added in workflow` | High | `platform/infra`, `security/AppSec` | supply-chain integrity | подтвердить первый CI artifact/attestation cycle | связать с release packet | хранить signed artifacts per release |
| `Secret scanning` | `scanner active, tracked findings zero, workspace warnings remain` | High | `security/AppSec`, `platform/infra` | утечка ключей и токенов | завершить rotation/revocation follow-up | ввести pre-merge review discipline | подключить central secret storage evidence |
| `IaC / container scanning` | `absent` | High | `platform/infra` | infra misconfig и image risk | выбрать scanner для `Dockerfile/helm/gateway` | ввести policy-as-code | сделать release blocking |
| `DAST / pentest readiness` | `absent` | High | `security/AppSec`, `ops/SRE` | runtime/API abuse | определить minimal surface | провести hardening | провести внешний pentest |
| `Threat modeling` | `absent` | High | `product/governance`, `security/AppSec`, `backend` | blind spots в design | собрать model по `api/web/telegram/AI` | связать controls с backlog | обновлять перед major launch |
| `Privacy impact assessment + legal artifact inventory` | `active registers created; external evidence checklist, metadata register and acceptance runbook created; external legal evidence missing` | Critical | `legal/compliance`, `product/governance` | 152-ФЗ / RKN / retention / subject rights | заполнить actual artifacts по `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER` | оформить localization/notification/transfer decisions | ввести регулярный compliance review |
| `Access review + branch protection evidence` | `CODEOWNERS expanded; GitHub settings unconfirmed` | High | `ops/SRE`, `product/governance` | insider / sabotage / weak ownership | снять settings baseline в GitHub UI | ввести quarterly review | связать с audit packet |
| `Backup / restore / DR drills` | `runbooks and scripts exist; latest execution evidence absent` | High | `ops/SRE`, `platform/infra` | unrecoverable deployment failure | провести rehearsal и зафиксировать report | стандартизовать RTO/RPO acceptance | сделать регулярные drills |
| `Contract testing + migration rollback tests` | `partial` | High | `backend`, `data` | runtime/schema drift | выбрать critical contracts | добавить rollback test pack | сделать blocking gate |
| `AI safety evals` | `partial` | High | `backend`, `security/AppSec`, `product/governance` | unsafe autonomy / prompt abuse / evidence bypass | formalize release eval suite | включить red-team regressions в CI | release gate для AI runtime |

## 11. 30 / 60 / 90 Дней

### 30 дней

- Закрыть `critical/high` dependency backlog по top advisories из `security-audit-summary.json`.
- Подтвердить rotation/revocation по `ca.key` и удалённым tracked `.env`.
- Заполнить actual artifacts по `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER` и провести их через `EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK`: operator, notification, residency, processor, lawful basis, chain-of-title.
- Провести первый backup/restore rehearsal и приложить execution evidence.

### 60 дней

- Получить первый стабильный `CodeQL + dependency review + attestation` CI cycle и зафиксировать triage.
- Оформить install/upgrade packet для `managed` и `on-prem`.
- Провести threat modeling по `api/web/telegram/AI runtime`.

### 90 дней

- Довести release discipline до launch-grade: IaC/container scanning, pentest readiness, signed release artifacts.
- Закрыть legal/compliance pack по РФ для фактически обрабатываемых категорий данных.
- Превратить AI evals, privacy checks и backup drills в release-gated baseline.

## 12. Ссылки На Поддерживающие Артефакты

- Runtime map: `docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md`
- Evidence matrix: `docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md`
- RF compliance review: `docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md`
- Privacy/data-flow map: `docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md`
- AI/agent failure scenarios: `docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md`
- Delta vs baseline: `docs/_audit/DELTA_VS_BASELINE_2026-03-28.md`
- Active ops/compliance packet:
  - `docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md`
  - `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md`
  - `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`
  - `docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md`
  - `docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md`
  - `docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md`
  - `docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md`
  - `docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md`
  - `docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md`
  - `docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md`
