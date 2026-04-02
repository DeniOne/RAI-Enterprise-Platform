---
id: DOC-EXE-POST-BIG-PHASE-INTERNAL-RESIDUAL-APPSEC-HYGIENE-WORKPACK-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.20.0
owners: ["@techlead"]
last_updated: 2026-04-02
claim_id: CLAIM-EXE-POST-BIG-PHASE-INTERNAL-RESIDUAL-APPSEC-HYGIENE-WORKPACK-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-02
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md;var/security/security-audit-summary.json;var/security/secret-scan-report.json;var/security/workspace-secret-hygiene-inventory.json;var/security/workspace-secret-hygiene-remediation-packet.json;var/security/security-reviewed-evidence-input.json;var/security/security-reviewed-evidence-status.json;var/security/security-reviewed-evidence-packet.json;var/security/security-reviewed-evidence-reconcile.json;var/security/post-big-phase-internal-residual-status.json;var/security/post-big-phase-internal-residual-reconcile.json;var/security/post-big-phase-internal-residual-bundle/MANIFEST.json;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;scripts/workspace-secret-hygiene-inventory.cjs;scripts/workspace-secret-hygiene-remediation-packet.cjs;scripts/post-big-phase-internal-residual-status.cjs;scripts/post-big-phase-internal-residual-reconcile.cjs;scripts/post-big-phase-internal-residual-bundle.cjs;scripts/security-reviewed-evidence-intake.cjs;scripts/security-reviewed-evidence-pr-lookup.cjs;scripts/security-reviewed-evidence-reconcile.cjs;scripts/security-reviewed-evidence-status.cjs;scripts/security-reviewed-evidence-packet.cjs;.github/workflows/codeql-analysis.yml;.github/workflows/security-audit.yml;.github/workflows/dependency-review.yml
---
# POST BIG PHASE INTERNAL RESIDUAL APPSEC HYGIENE WORKPACK 2026-04-01

## CLAIM
id: CLAIM-EXE-POST-BIG-PHASE-INTERNAL-RESIDUAL-APPSEC-HYGIENE-WORKPACK-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот документ открывает и удерживает короткий follow-on workpack после закрытия `ONE_BIG_PHASE`.

Текущий machine-readable verdict пакета:

- [post-big-phase-internal-residual-status.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-status.json) фиксирует `status=done`, `R1=done`, `R2=done`, `R3=done`.
- [post-big-phase-internal-residual-reconcile.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-reconcile.json) фиксирует `status=done`, `verdict=post_big_phase_internal_residual_reconcile_complete`.
- [post-big-phase-internal-residual-run-card.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-run-card.json) и [post-big-phase-internal-residual-run-card.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-run-card.md) служат компактной операторской карточкой поверх reconcile-отчёта.
- [post-big-phase-internal-residual-pr-template.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-pr-template.json) и [post-big-phase-internal-residual-pr-template.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-pr-template.md) служат готовым шаблоном для первого security-relevant `PR`.
- [post-big-phase-internal-residual-handoff-index.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-handoff-index.json) и [post-big-phase-internal-residual-handoff-index.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-handoff-index.md) служат верхним оглавлением всего handoff-пакета.
- [post-big-phase-internal-residual-commands.template.sh](/root/RAI_EP/var/security/post-big-phase-internal-residual-commands.template.sh) служит готовым shell-template для первого reviewer-backed `PR` цикла.
- [post-big-phase-internal-residual-bundle/MANIFEST.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-bundle/MANIFEST.json) и [post-big-phase-internal-residual-bundle/README.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-bundle/README.md) служат handoff-bundle для передачи всего пакета одним каталогом.
- `pnpm security:post-big-phase:prepare` остаётся полным handoff-entrypoint для следующих security-critical циклов: он умеет выпускать packet-level reconcile-report, compact operator `run card`, локальный `PR template`, верхний `handoff index`, shell-template с командами и bundle-каталог, но текущий baseline уже закрыт.
- `pnpm security:post-big-phase:run-card` и `pnpm security:post-big-phase:pr-template` сохранены как совместимые alias на тот же handoff-entrypoint.
- `pnpm security:post-big-phase:index` сохранён как alias для быстрого выпуска полного handoff-набора с верхним индексом.
- `pnpm security:post-big-phase:bundle` сохранён как alias для быстрого перевыпуска полного handoff-набора с итоговым bundle-каталогом.
- если restricted handoff root в текущей среде read-only, `prepare` обязан переиспользовать уже существующие restricted artifacts и помечать это как `readonly_existing_artifacts`, а не падать.

Ключевое правило:

- это не новая `Phase`;
- это не переоткрытие пакета `A-E`;
- это не замена parked внешних хвостов `Phase A`;
- это отдельный контур для внутреннего residual `AppSec / hygiene`, который остался внутри репозитория после закрытия большого execution-объёма.

## 1. Что именно этот пакет держит

В scope входят только три residual-трека:

1. `dependency high-tail`:
   - baseline из [security-audit-summary.json](/root/RAI_EP/var/security/security-audit-summary.json);
   - текущее состояние после override-remediation: `0 high / 0 critical`.
2. `workspace-local secret hygiene`:
   - baseline из [secret-scan-report.json](/root/RAI_EP/var/security/secret-scan-report.json);
   - текущее состояние: tracked leakage = `0`, local `critical` content findings = `0`, остался только warning-only filename residue у untracked local `.env`.
   - repo-safe inventory выпускается в [workspace-secret-hygiene-inventory.json](/root/RAI_EP/var/security/workspace-secret-hygiene-inventory.json) и [workspace-secret-hygiene-inventory.md](/root/RAI_EP/var/security/workspace-secret-hygiene-inventory.md).
   - remediation-пакет выпускается в [workspace-secret-hygiene-remediation-packet.json](/root/RAI_EP/var/security/workspace-secret-hygiene-remediation-packet.json) и [workspace-secret-hygiene-remediation-packet.md](/root/RAI_EP/var/security/workspace-secret-hygiene-remediation-packet.md).
3. `reviewed CI evidence loop` для `CodeQL / dependency review / provenance`:
   - workflow baseline активен по [SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md](/root/RAI_EP/docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md);
   - repo-side input-контракт живёт в [security-reviewed-evidence-input.json](/root/RAI_EP/var/security/security-reviewed-evidence-input.json);
   - machine-readable status выпускается в [security-reviewed-evidence-status.json](/root/RAI_EP/var/security/security-reviewed-evidence-status.json) и [security-reviewed-evidence-status.md](/root/RAI_EP/var/security/security-reviewed-evidence-status.md);
   - handoff packet выпускается в [security-reviewed-evidence-packet.json](/root/RAI_EP/var/security/security-reviewed-evidence-packet.json) и [security-reviewed-evidence-packet.md](/root/RAI_EP/var/security/security-reviewed-evidence-packet.md);
   - текущее состояние: `status=done`, `verdict=reviewed_ci_evidence_loop_ready`; `CodeQL`, `Security Baseline`, `dependencyReview` и reviewer/provenance refs привязаны к merged `PR #2` и current `main` head.

## 2. Что этот пакет не держит

Ниже перечислено то, что здесь запрещено смешивать:

1. parked внешние хвосты `Phase A`:
   - `ELP-20260328-07`
   - `ELP-20260328-10`
   - `ELP-20260328-11`
   - `A2-S-01`
   - `A2-S-02`
   - `A4-H-01`
2. переоткрытие `Phase B/C/D/E` как будто они снова активны.
3. новые продуктовые фичи, рост `web/menu`, новые agent roles, `SaaS/hybrid` breadth.
4. выдумывание следующей большой фазы без отдельного управленческого решения.

## 3. Источник operational truth

Для этого пакета действует жёсткий порядок:

1. generated manifests:
   - [security-audit-summary.json](/root/RAI_EP/var/security/security-audit-summary.json)
   - [secret-scan-report.json](/root/RAI_EP/var/security/secret-scan-report.json)
2. CI/workflow baseline:
   - `.github/workflows/codeql-analysis.yml`
   - `.github/workflows/security-audit.yml`
   - `.github/workflows/dependency-review.yml`
3. policy/context:
   - [SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md](/root/RAI_EP/docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md)
   - [ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md)

Если narrative расходится с generated manifests, правится narrative, а не наоборот.

## 4. Треки исполнения

### 4.1. `R0` scope lock

Цель:

- удерживать, что residual cleanup не становится новой “широкой фазой”.

Что считается закрытием:

- все работы пакета остаются внутри треков `R1-R3`;
- `ONE_BIG_PHASE` сохраняет verdict “закрыта по текущему объёму `A-E`”;
- parked external tail `Phase A` не смешивается с внутренним residual backlog.

### 4.2. `R1` dependency high-tail

Текущее состояние:

- `security-audit-summary` показывает `0 high / 0 critical`;
- предыдущий high-tail был снят через targeted override-remediation для `minimatch@9.0.3` и `picomatch@4.0.1/4.0.2`;
- в residual остаются только `moderate/low` advisory-классы, но high/critical больше не держат workpack.

Обязательные действия:

1. заморозить baseline advisory set на уровне текущего generated summary;
2. разложить high findings на:
   - устранимые быстрым upgrade/pin;
   - требующие toolchain decision;
   - допускающие временный compensating note только при отсутствии runtime-impact;
3. провести remediation до повторного прогона audit;
4. повторить `security audit` до состояния `high=0` и `critical=0`.

Текущее закрытие трека:

- targeted overrides добавлены в `package.json` и `pnpm-lock.yaml`;
- `pnpm security:audit:ci` подтверждает `high=0`, `critical=0`;
- трек `R1` считается закрытым по текущему scope.

Exit-критерий трека:

- [security-audit-summary.json](/root/RAI_EP/var/security/security-audit-summary.json) показывает `critical=0` и `high=0`.

### 4.3. `R2` workspace-local secret hygiene

Текущее состояние:

- tracked findings отсутствуют;
- локальные workspace-only файлы удерживаются только как warning-only residue:
  - `.env`
  - `apps/web/.env.local`
  - `mg-core/backend/.env`
  - `mg-core/backend/src/mg-chat/.env`

Обязательные действия:

1. инвентаризировать все локальные secret-bearing файлы;
   - рабочая команда: `pnpm security:workspace-hygiene:inventory`
   - remediation packet: `pnpm security:workspace-hygiene:packet`
2. убрать реальные секреты из локальных рабочих копий через:
   - перенос в внешний secret store или restricted handoff;
   - замену на sanitized placeholders там, где нужен только template;
3. убедиться, что локальные `.env` больше не содержат `critical` content findings;
4. повторно прогнать secret scan и зафиксировать новый baseline.

Exit-критерий трека:

- в [secret-scan-report.json](/root/RAI_EP/var/security/secret-scan-report.json) отсутствуют `workspaceLocalFindings` с `severity=critical`.
- [workspace-secret-hygiene-inventory.json](/root/RAI_EP/var/security/workspace-secret-hygiene-inventory.json) имеет `status=done` и verdict из допустимого множества:
  - `workspace_secret_hygiene_clear`
  - `workspace_local_warning_only`
- remediation packet подтверждает template-path и per-file action plan без missing-template issues.

Warning-only пояснение:

- filename-level presence локальных `.env` сама по себе не считается blocker, если tracked leakage = `0`, local `critical` content findings = `0`, а файлы удерживаются как untracked local/template overrides.

### 4.4. `R3` reviewed CI evidence loop

Текущее состояние:

- workflows `CodeQL`, `security-audit`, `dependency-review` активны;
- repo-side reviewed evidence contract, intake, PR lookup, status и handoff packet уже добавлены:
  - `pnpm security:reviewed-evidence:intake`
  - `pnpm security:reviewed-evidence:pr-lookup -- --pr-number=...`
  - `pnpm security:reviewed-evidence:reconcile -- --pr-number=...`
  - `pnpm security:reviewed-evidence:status`
  - `pnpm security:reviewed-evidence:packet`
  - `pnpm gate:security:reviewed-evidence`
  - `pnpm gate:security:reviewed-evidence:reconcile -- --pr-number=...`
  - [security-reviewed-evidence-input.json](/root/RAI_EP/var/security/security-reviewed-evidence-input.json)
  - [security-reviewed-evidence-status.json](/root/RAI_EP/var/security/security-reviewed-evidence-status.json)
  - [security-reviewed-evidence-packet.json](/root/RAI_EP/var/security/security-reviewed-evidence-packet.json)
  - [security-reviewed-evidence-reconcile.json](/root/RAI_EP/var/security/security-reviewed-evidence-reconcile.json)
- текущий generated status фиксирует `done`, потому что:
  - `CodeQL` и `Security Baseline` verified на current `main` head;
  - `dependencyReview` привязан к merged `PR #2` и successful pull_request run;
  - reviewer refs и provenance refs внесены в repo-side input-контракт;
  - packet-level residual verdict пересчитан в `post_big_phase_internal_residual_closed`.
- restricted handoff packet сохраняется как reusable artefact для следующих security-critical циклов, но больше не является blocker текущего residual workpack.

Обязательные действия:

1. удерживать repo-side контракт reviewed evidence loop в актуальном состоянии при каждом следующем security-critical merge;
2. обновлять `prNumber/runId/reviewerRefs` через `pnpm security:reviewed-evidence:pr-lookup` и `pnpm security:reviewed-evidence:intake`;
3. подтверждать fresh `CodeQL / Security Baseline / dependencyReview` refs через `pnpm security:reviewed-evidence:status`;
4. пересчитывать пакетный verdict через `pnpm security:post-big-phase:reconcile -- --pr-number=...`;
5. не допускать возврата generated manifests в `in_progress` без реального runtime или governance regression.

Ускоренный путь после появления первого реального `PR`:

1. запустить `pnpm security:post-big-phase:reconcile -- --pr-number=...`;
2. дать верхнеуровневому reconcile-скрипту автоматически собрать `R3 reconcile -> packet status`;
3. затем закрепить результат через `pnpm gate:security:post-big-phase:reconcile -- --pr-number=...`.

Локальный `R3` entrypoint сохраняется как более узкий отладочный путь:

1. `pnpm security:reviewed-evidence:reconcile -- --pr-number=...`
2. `pnpm gate:security:reviewed-evidence:reconcile -- --pr-number=...`

Подготовительный путь до появления первого `PR`:

1. запустить `pnpm security:post-big-phase:prepare`;
2. получить [post-big-phase-internal-residual-reconcile.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-reconcile.json) со статусом ожидания внешнего reviewer-backed цикла, встроенной ссылкой на handoff packet и готовым `actionBundle`;
3. одновременно получить [post-big-phase-internal-residual-run-card.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-run-card.md) как компактную operator-ready карточку;
4. использовать `nextAction`, `requestedReviewers`, `packetPath`, `missingItems`, `reconcileCommandTemplate`, `gateCommandTemplate` и `operatorChecklist` из этих артефактов как канонический handoff в момент, когда появится реальный `PR`.

Операторский быстрый путь:

1. запустить `pnpm security:post-big-phase:run-card`;
2. открыть [post-big-phase-internal-residual-run-card.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-run-card.md);
3. выполнить команды и checklist из этой карточки без чтения полного reconcile-отчёта.

PR-handoff путь:

1. запустить `pnpm security:post-big-phase:pr-template`;
2. открыть [post-big-phase-internal-residual-pr-template.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-pr-template.md);
3. использовать `title_template`, `branch_hint`, `requested_reviewers` и готовый `PR Body Template` при создании первого security-relevant `PR`.

Полный handoff-entrypoint по умолчанию:

1. запустить `pnpm security:post-big-phase:prepare`;
2. получить сразу три артефакта:
   - reconcile report
   - compact run card
   - PR template
   - handoff index
   - command template
   - bundle directory
3. использовать [post-big-phase-internal-residual-handoff-index.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-handoff-index.md) как верхнюю точку входа, а [post-big-phase-internal-residual-commands.template.sh](/root/RAI_EP/var/security/post-big-phase-internal-residual-commands.template.sh) — как copy-paste основу для выполнения цикла после подстановки `PR_NUMBER`.
4. при передаче пакета целиком использовать [post-big-phase-internal-residual-bundle/README.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-bundle/README.md) как верхнюю точку входа bundle-каталога, а [post-big-phase-internal-residual-bundle/MANIFEST.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-bundle/MANIFEST.json) — как machine-readable список вложений.

Exit-критерий трека:

- [security-reviewed-evidence-status.json](/root/RAI_EP/var/security/security-reviewed-evidence-status.json) существует и имеет `status=done`, `verdict=reviewed_ci_evidence_loop_ready`;
- `CodeQL`, `Security Baseline`, `dependencyReview`, `provenance` привязаны к проверяемым refs;
- `pnpm gate:security:reviewed-evidence` проходит в enforce-режиме.

## 5. Порядок исполнения внутри пакета

Исполняем в таком порядке:

1. `R2` — убрать `critical` local secret content findings как самый прямой hygiene-риск.
2. `R1` — обнулить `high` dependency tail и довести audit до чистого baseline.
3. `R3` — замкнуть reviewed CI evidence loop как governance-доказательство, а не только технический workflow baseline.
4. `R0` удерживается постоянно и проверяется на каждом review.

## 6. Итоговый критерий закрытия workpack

Пакет считается закрытым, когда одновременно выполнены все условия:

1. `security-audit-summary.counts.high = 0`
2. `security-audit-summary.counts.critical = 0`
3. в `secret-scan-report.workspaceLocalFindings` нет `critical` content findings
4. reviewed evidence loop для `CodeQL / dependency review / provenance` существует как machine-readable контур
   - и его generated status доведён до `reviewed_ci_evidence_loop_ready`
5. `ONE_BIG_PHASE` по-прежнему читается как закрытая по `A-E`, а parked external tail `Phase A` остаётся отдельным контуром возврата

## 7. Как читать этот пакет вместе с big phase

Правильная формулировка после его открытия такая:

- `ONE_BIG_PHASE` закрыта;
- parked внешние хвосты `Phase A` оставлены отдельно;
- внутренний residual `AppSec / hygiene` вынесен в отдельный короткий workpack;
- следующая настоящая большая фаза всё ещё требует отдельного решения и нового board-пакета.
