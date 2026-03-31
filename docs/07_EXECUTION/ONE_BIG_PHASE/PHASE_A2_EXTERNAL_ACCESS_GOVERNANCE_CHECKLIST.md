---
id: DOC-EXE-ONE-BIG-PHASE-A2-EXTERNAL-ACCESS-GOVERNANCE-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-EXTERNAL-ACCESS-GOVERNANCE-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;.github/CODEOWNERS;.github/workflows/security-audit.yml
---
# PHASE A2 EXTERNAL ACCESS GOVERNANCE CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-EXTERNAL-ACCESS-GOVERNANCE-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы закрыть тот кусок `A2`, который не читается из локального Git: branch protection, required reviewers, admin bypass, deploy keys, environment secrets и фактический review-perimeter в GitHub UI.

Связанный micro-checklist:

- [PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md)

## 1. Почему это отдельный шаг

Локальный repo уже подтверждает:

- `CODEOWNERS` существует;
- security workflows есть;
- critical paths размечены review-guard'ами.

Но локальный repo не доказывает:

- включён ли branch protection на `main`;
- сколько reviewers реально требуется;
- может ли admin bypass обойти review;
- какие deploy keys активны;
- какие secrets заданы в environments.

Значит этот блок нельзя считать закрытым без внешнего evidence.

## 2. Что сделать

### Шаг 1. Снять внешний snapshot access perimeter

Нужно руками в GitHub UI или через админский export зафиксировать:

- branch protection для `main`
- required reviewers
- status checks
- restrictions on force-push / delete
- admin bypass policy

### Шаг 2. Проверить coverage owner-review

Нужно подтвердить:

- что `CODEOWNERS` реально участвует в PR review;
- что security-critical paths не проходят merge без owner-review;
- что workflows, `scripts`, `apps/api/src/shared/**`, `apps/api/src/modules/rai-chat/**`, `apps/web/app/**`, `apps/telegram-bot/src/**`, `docs/05_OPERATIONS/**` защищены не только на бумаге.

### Шаг 3. Проверить deploy keys и machine access

Нужно собрать перечень:

- активных deploy keys;
- GitHub App / bot access, если используется;
- кто и зачем имеет machine-level access к репозиторию и environments.

### Шаг 4. Проверить environment secrets perimeter

Нужно зафиксировать:

- какие environments существуют;
- есть ли production-like secrets;
- кто имеет право их читать и менять;
- есть ли ручное approval-требование для deployment path.

### Шаг 5. Выпустить внешний evidence artifact

Итогом должен стать restricted artifact, где есть:

- дата проверки;
- кто проверял;
- что именно проверено;
- скриншоты, exports или signed memo;
- итог: perimeter подтверждён или нет.

## 3. Что считается сильным доказательством

Сильное доказательство:

- restricted access review memo;
- UI snapshots или export по branch protection и environment access;
- явная фиксация admin bypass policy;
- подтверждение, что owner-review и critical checks реально обязательны.

## 4. Что не считать закрытием

Не считать закрытием:

- наличие `CODEOWNERS` в Git само по себе;
- policy-документ без внешней проверки;
- устное “в GitHub вроде всё включено”;
- старый screenshot без даты и владельца проверки.

## 5. Exit condition

Этот checklist считается закрытым только когда:

- есть внешний restricted artifact по access-governance;
- branch protection и review perimeter подтверждены;
- deploy keys и environment access описаны и отревьюены;
- board может перестать считать access-governance open external blocker для `A2`.
