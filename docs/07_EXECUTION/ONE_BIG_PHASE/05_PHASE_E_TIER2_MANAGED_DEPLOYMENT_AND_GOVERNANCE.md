---
id: DOC-EXE-ONE-BIG-PHASE-E-TIER2-MANAGED-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-E-TIER2-MANAGED-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_EXECUTION_BOARD.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md
---
# PHASE E — Tier 2 Managed Deployment And Governance

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-E-TIER2-MANAGED-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Это подфаза перехода от доказанного `Tier 1 self-host` к `Tier 2 managed deployment` с обязательным governance-evidence и управляемым operational-контуром.

Фактический статус на 2026-04-01: `Phase E` закрыта с verdict `phase_e_ready_tier2` (см. `var/ops/phase-e-status.json` и `pnpm gate:phase:e:status`).

Для конкретного implementation-пакета использовать также [PHASE_E_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_IMPLEMENTATION_PLAN.md).

Для статусов строк и exit-критериев использовать также [PHASE_E_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_EXECUTION_BOARD.md).

## 1. Цель подфазы

Перевести систему из состояния `Tier 1 ready` в состояние `Tier 2 managed and governable`, где deployment, доступы, инциденты, transborder-решения и pilot-отчётность подтверждены evidence, а не только runbook-описаниями.

## 2. Чеклист

### 2.1. Закрыть release governance evidence

- [x] Подтвердить `branch protection` и release approval chain внешними evidence-артефактами.
- [x] Подтвердить `access governance` и owner-review для production-контуров.
- [x] Зафиксировать exception-register и правила эскалации релизных отклонений.

### 2.2. Усилить managed operations contour

- [x] Зафиксировать monitoring/SLO baseline для managed deployment.
- [x] Подтвердить incident/rollback/support цепочки на регулярном drill-цикле.
- [x] Подтвердить release rollback readiness без ручной импровизации.

### 2.3. Закрыть legal/transborder operational пакет

- [x] Закрыть `ELP-05` для реально используемых внешних провайдеров.
- [x] Синхронизировать residency/processor perimeter с фактическим deployment-контуром.
- [x] Довести legal verdict для managed contour до не-блокирующего состояния.

### 2.4. Провести controlled managed pilot wave

- [x] Зафиксировать pilot cohort, критерии и наблюдаемую метрику успеха.
- [x] Провести managed pilot wave с формальным отчётом и verdict.
- [x] Зафиксировать post-pilot решение `go/hold` без расширения продуктовой ширины.

### 2.5. Удержать anti-breadth guardrails

- [x] Не открывать `SaaS / hybrid external production` до закрытия governance и transborder evidence.
- [x] Не расширять menu/agent/integration breadth под видом подготовки `Tier 2`.

## 3. Что должно измениться по итогам подфазы

- `Tier 2 managed deployment` становится доказуемым operational-контуром;
- release/access governance перестают быть неформальными предположениями;
- transborder/legal perimeter фиксируется в исполняемом evidence-пакете;
- pilot-управление переходит от ad hoc-решений к формальному verdict-циклу.

## 4. Подфаза считается завершённой, когда

- строки `E-2.2.*`, `E-2.3.*`, `E-2.4.*`, `E-2.5.*` не имеют `open/in_progress`;
- есть подтверждённые evidence по branch protection и access governance;
- managed operations contour подтверждён drill-отчётами и rollback readiness;
- transborder/legal пакет для фактических провайдеров закрыт;
- managed pilot имеет формальный итоговый verdict;
- guardrails `E-2.6.*` удержаны без scope-нарушений.

## 5. Что запрещено до завершения подфазы

- объявлять внешний production-ready `SaaS/hybrid` запуск;
- расширять автономию AI вне текущего governance baseline;
- подменять governance evidence расширением UI или интеграционной шириной.
