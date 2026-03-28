---
id: DOC-ARV-AUDIT-ENTERPRISE-DUE-DILIGENCE-20260328
layer: Archive
type: Research
status: approved
version: 1.3.0
owners: [@techlead]
last_updated: 2026-03-28
---
# ENTERPRISE DUE DILIGENCE 2026-03-28

## 1. Audit Baseline

- Дата baseline: `2026-03-28T06:55:12Z`
- Branch: `main`
- Commit: `55d846221ec8374f94c7de9257caabf0427915e1`
- Excluded paths: `apps/gripil-web`, `apps/gripil-web-awwwards`
- Source of truth order: `code/tests/gates > generated manifests > docs`
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
| Security | `CONDITIONAL GO` | Критичные runtime regressions и invariant violations закрыты, но security baseline ещё неполный | `ca.key` больше не tracked в текущем repo state, но нужен review Git history и rotation/revocation; нет подтверждённых `SAST/SCA/SBOM/secret scanning` | зафиксировать history cleanup и rotation по key incident, включить supply-chain controls и повторить verification |
| Legal / Compliance | `NO-GO` | Нет подтверждённого operator artifact pack для ПДн и РФ compliance | нет доказанного уведомления РКН; нет подтверждённой локализации/трансграничного реестра; нет privacy impact inventory; нет OSS license inventory | собрать legal/compliance packet, формализовать data map, локализацию, notification и license audit |
| Deployment / Operations | `CONDITIONAL GO` | Основной quality baseline по `api/web/telegram`, routing и DB scope стал зелёным | `pnpm audit` не дал воспроизводимого результата в timebox; нет полного DR/backup/rollback evidence | формализовать DR/backup/rollout evidence, стабилизировать security audit path и повторить release baseline |
| Product Readiness | `CONDITIONAL GO` | Платформа пригодна для продолжения разработки и контролируемого pilot, но не для внешнего launch | quality baseline уже зелёный, но legal/compliance pack отсутствует, supply-chain/security controls неполные | продолжать разработку без полного restructuring, использовать только controlled pilot после legal gating и закрытия residual security gaps |

## 3. Что Это За Система По Факту

`RAI_EP` по коду — это `pnpm`/`Turborepo` monorepo для multi-tenant платформы агроопераций, финансово-экономического контура, CRM/commerce, explainability/audit trail и Stage 2 `agent-first governed runtime`.

По фактической зрелости это не prototype, но и не production-ready система. Наиболее честная стадия на дату аудита: `pre-production / production-like in slices`. В репозитории есть реальные рабочие контуры, зелёный quality baseline по основным `build/test/gates` и частично зрелая governance-инфраструктура, но отсутствует enterprise launch-grade evidence по security, legal/compliance и supply-chain.

Главный диагноз: архитектурный замысел и доменное покрытие сильнее, чем текущая эксплуатационная дисциплина. Система выглядит широкой и содержательной, а release baseline по коду заметно улучшен, но security hygiene, operator evidence и legal/compliance evidence пока не дотягивают до enterprise rollout.

## 4. Можно Ли Продолжать / Запускать

- Продолжать разработку без restructuring: `да`, но с жёстким remediation-first приоритетом на quality/security/compliance
- Запускать pilot: `условно`, только во внутреннем или design-partner контуре после legal/compliance gating и фиксации history cleanup / rotation по key incident
- Запускать production: `нет`
- Внедрять у enterprise-клиентов: `нет`

## 5. System Readiness Score

```text
Architecture: 6.5/10
Code Integrity: 6.5/10
Backend: 7.0/10
Frontend: 6.0/10
Telegram Runtime: 6.5/10
Data / Schema Integrity: 6.0/10
AI / Agent Governance: 6.5/10
Security: 5.5/10
Legal / Compliance: 2.5/10
Deployment / Operations: 6.0/10

Overall: 6.0/10
```

## 6. Ключевой Evidence Snapshot

| Проверка | Результат | Вывод |
|---|---|---|
| `pnpm lint:docs:matrix:strict` | PASS | новый audit-пакет и docs matrix governance валидны |
| `pnpm lint:docs` | PASS | docs-as-code baseline зелёный после фиксации `_audit` prompt и `Runbook` type |
| `pnpm gate:invariants` | PASS, `exit 0` | `verify-invariants: OK`; `controllers_without_guards=0`; `raw_sql_review_required=0`; `raw_sql_unsafe=0`; `violations=0`; `all_invariant_checks_passed` |
| `pnpm lint:tenant-context` | PASS, `tenant_context_suspects=0` | tenant isolation lint-контур жив |
| `pnpm lint:fsm-status-updates` | PASS, `fsm_status_update_suspects=0` | FSM update governance lint жив |
| `pnpm gate:db:ownership` | PASS (warn mode) | ownership manifest существует и не сигналит нарушений |
| `pnpm gate:db:forbidden-relations` | PASS (warn mode) | грубых forbidden relation violations не найдено |
| `pnpm gate:db:scope` | PASS | scope-manifest синхронизирован с `TechMapReviewSnapshot`, `TechMapApprovalSnapshot`, `TechMapPublicationLock` |
| `pnpm gate:db:phase0` | WARN | `82` слабых single-field index pattern и `9` heavy include zones |
| `pnpm gate:db:phase3` | PASS | fragments/composed schema синтаксически согласуются |
| `pnpm gate:routing:primary-slices` | PASS, `4/4` suites, `86/86` tests | routing corpus и case-memory baseline восстановлены |
| `pnpm --filter api build` | PASS | backend собирается |
| `pnpm --filter telegram-bot build` | PASS | telegram runtime собирается |
| `pnpm --filter web build` | PASS | production build, TypeScript и static page generation (`132/132`) завершаются успешно |
| `pnpm --filter telegram-bot test` | PASS, `17/17` | telegram baseline стабилен |
| `pnpm --filter web test` | PASS, `42/42` suites, `482/482` tests | frontend regression baseline восстановлен |
| `pnpm --filter api test -- --runInBand` | PASS, `252/252` suites, `1313 passed`, `1 skipped` | backend regression baseline восстановлен в сериализованном прогоне |
| `pnpm --filter @rai/agro-orchestrator check-types` | PASS | хотя бы один явный package-level typecheck зелёный |
| `pnpm --filter @rai/prisma-client exec prisma validate --schema schema.prisma` | FAIL | schema validate зависит от `DATABASE_URL`; плюс deprecated `package.json#prisma` |
| `timeout 30s pnpm audit --audit-level=high` | timebox exhausted | security audit workflow есть, но локально не дал воспроизводимого результата в заданном окне |

## 7. Deployment Target Matrix

| Модель | Текущее состояние | Evidence | Блокеры | Итог |
|---|---|---|---|---|
| `SaaS` | `partial` | multi-tenant контур, tenant lint, RLS-подобные паттерны, green `web/api/telegram` baseline, routing gate PASS, DB scope manifest синхронизирован | privacy/legal pack отсутствует, supply-chain gaps | годится только для controlled pilot, не для внешнего launch |
| `Managed deployment` | `partial` | `docker-compose`, `infra/postgres/Dockerfile`, monitoring rules, зелёные build/test/routing checks | нет полного release/backup/DR evidence, `pnpm audit` нестабилен, нет operator packet | ограниченно готово, но не доказано для enterprise ops |
| `On-prem / self-hosted` | `partial` | `infra/helm`, gateway configs, local infra artifacts, рабочий quality baseline по основному контуру | нет доказанной installability/upgrade path, нужен history cleanup и rotation evidence после `ca.key`, нет operator runbook pack | технически близко, но доказательств для безопасного внедрения недостаточно |
| `Hybrid` | `not evidenced` | в стратегии и AI-архитектуре слово `hybrid` есть, но это про agent autonomy, не про deployment maturity | нет отдельной hybrid deployment topology/evidence | не доказано |

## 8. Топ Сильных Сторон

1. Широкий доменный охват: `agro`, `finance-economy`, `crm/commerce`, `legal`, `knowledge`, `rai-chat`.
2. Есть реальные governance gates, а не только декларации в документации.
3. `api`, `web` и `telegram-bot` проходят актуальный build/test baseline.
4. `tenant-context`, `fsm-status` и routing gate зелёные.
5. В AI-контуре уже присутствуют truthfulness/evidence, incident ops, PII masking и explainability traces.
6. Есть WORM / Level F / audit-notarization intent и подтверждённые implementation следы в коде и memory-bank.
7. Документация разделена по active/canon/archive слоям и пригодна для recovery intent.
8. CODEOWNERS уже применён хотя бы к DB-ядру.
9. Есть отдельные live smoke и governance-related reports в `interagency/reports`.
10. Telegram runtime выглядит наиболее стабильным из пользовательских контуров.

## 9. Топ Рисков

1. Исторический key-incident вокруг `infra/gateway/certs/ca.key` требует review Git history и rotation/revocation, хотя файл уже не tracked в текущем state.
2. Нет доказанного legal/compliance пакета для ПДн РФ.
3. Нет подтверждённого OSS license inventory и supply-chain evidence (`SBOM`, provenance, attestations).
4. Нет подтверждённого `SAST/SCA/secret scanning` baseline.
5. Локальный `pnpm audit` не даёт стабильного воспроизводимого результата в приемлемом окне.
6. Нет полного backup/restore/DR drill evidence.
7. CODEOWNERS и branch protection evidence ограничены частью критичного контура.
8. `pnpm --filter @rai/prisma-client exec prisma validate --schema schema.prisma` остаётся env-зависимым и не формирует устойчивый schema-integrity baseline.
9. Нет подтверждённого installability/upgrade packet для on-prem / managed rollout.
10. Controlled pilot возможен только после закрытия legal/security gating, что пока не подтверждено evidence.

## 10. Missing Controls Register

| Контроль | Urgency | Owner-scope | Risk covered | `0-30 days` | `30-60 days` | `60-90+ days` |
|---|---|---|---|---|---|---|
| `SAST` | Critical | `security/AppSec`, `backend`, `frontend` | небезопасные паттерны и регрессии в коде | подключить baseline scanner в CI | завести severity triage и SLA | сделать blocking policy для high/critical |
| `SCA` | Critical | `security/AppSec`, `platform/infra` | уязвимые зависимости | стабилизировать локальный/CI audit path | добавить remediation workflow | сделать регулярный dependency review |
| `SBOM + provenance` | High | `platform/infra`, `security/AppSec` | supply-chain integrity | генерировать CycloneDX SBOM на build | добавить artifact attestations | связать с release approval |
| `Secret scanning` | Critical | `security/AppSec`, `platform/infra` | утечка ключей и токенов | удалить tracked key material, включить scanner | добавить pre-merge enforcement | завести rotation discipline |
| `IaC / container scanning` | High | `platform/infra` | infra misconfig и image risk | сканировать `Dockerfile`, `helm`, gateway configs | добавить policy-as-code | включить release blocking для critical findings |
| `DAST / pentest readiness` | High | `security/AppSec`, `ops/SRE` | runtime/API abuse | определить минимальный DAST surface | провести pre-pentest hardening | провести внешний pentest |
| `Threat modeling` | High | `product/governance`, `security/AppSec`, `backend` | blind spots в design | сделать модель threat scenarios для `api/web/telegram/AI` | привязать к backlog и controls | обновлять перед major launch |
| `Privacy impact assessment + legal artifact inventory` | Critical | `legal/compliance`, `product/governance` | 152-ФЗ / RKN / retention / subject rights | собрать data inventory и operator artifact list | оформить локализацию/notification/transfer decisions | ввести регулярный compliance review |
| `Access review + branch protection evidence` | High | `ops/SRE`, `product/governance` | insider / sabotage / weak ownership | расширить `CODEOWNERS` на critical runtime | зафиксировать protected branches и approval policy | проводить периодические access reviews |
| `Backup / restore / DR drills` | High | `ops/SRE`, `platform/infra` | unrecoverable deployment failure | описать actual backup/restore path | провести rehearsal и задокументировать RTO/RPO | сделать регулярные drills |
| `Contract testing + migration rollback tests` | High | `backend`, `data` | runtime/schema drift | выбрать critical API and DB contracts | добавить rollback tests для Prisma/migrations | сделать blocking gate |
| `AI safety evals` | Critical | `backend`, `security/AppSec`, `product/governance` | unsafe autonomy / prompt abuse / evidence bypass | формализовать eval set для routing, truthfulness, privacy, tool abuse | включить red-team regressions в CI | сделать release gate для AI runtime |

## 11. 30 / 60 / 90 Дней

### 30 дней

- Зафиксировать cleanup `ca.key` на уровне commit, провести review истории и rotation/revocation связанного key material, затем включить `secret scanning`.
- Сформировать operator/legal baseline: data inventory, privacy map, notification/localization decision log.
- Нормализовать AppSec baseline: `SAST`, `SCA`, `SBOM`, audit reproducibility.
- Стабилизировать `prisma validate` / schema-integrity path вне env-dependent режима.

### 60 дней

- Ввести contract/migration rollback tests и runtime release packet.
- Расширить `CODEOWNERS` и branch protection evidence на весь критичный контур.
- Провести threat modeling по `api/web/telegram/AI runtime`.

### 90 дней

- Довести release discipline до launch-grade: reproducible builds, provenance, DR drills, pentest readiness.
- Закрыть legal/compliance pack по РФ для фактически обрабатываемых категорий данных.
- Превратить AI evals, routing regressions и privacy checks в release-gated baseline.

## 12. Ссылки На Поддерживающие Артефакты

- Runtime map: `docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md`
- Evidence matrix: `docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md`
- RF compliance review: `docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md`
- Privacy/data-flow map: `docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md`
- AI/agent failure scenarios: `docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md`
- Delta vs baseline: `docs/_audit/DELTA_VS_BASELINE_2026-03-28.md`
