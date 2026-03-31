---
id: DOC-EXE-ONE-BIG-PHASE-A2-SECURITY-EVIDENCE-CLOSEOUT-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-SECURITY-EVIDENCE-CLOSEOUT-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md;scripts/security-evidence-status.cjs;package.json
---
# PHASE A2 SECURITY EVIDENCE CLOSEOUT CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-SECURITY-EVIDENCE-CLOSEOUT-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы остаточный evidence по `A2-S-01`, `A2-S-02`, `A2-S-03` закрывался не вручную по папкам, а по одному воспроизводимому контуру.

## 1. Что именно контролируем

Под один closeout-контур входят три residual security artifact:

- `A2-S-01` — `ca.key` revocation / reissue evidence
- `A2-S-02` — Telegram token rotation evidence
- `A2-S-03` — GitHub access review evidence

Текущий restricted perimeter:

- metadata: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/metadata/`
- drafts: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/`
- templates: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/`

Machine-readable status:

- `pnpm security:evidence:status`
- `pnpm gate:security:evidence`

## 2. Что делать в правильном порядке

### Шаг 1. Проверить текущий статус

Запустить:

```bash
pnpm security:evidence:status
```

Смотреть:

- `var/security/security-evidence-status.md`
- `var/security/security-evidence-status.json`

Цель:

- не гадать, какие metadata и drafts реально существуют;
- сразу видеть, что именно отсутствует или overdue.

### Шаг 2. Дозаполнить repo-derived drafts

Для каждого артефакта открыть его draft и вписать только внешне подтверждённые поля:

- `A2-S-01` — revocation / reissue action, date, confirmer, current status
- `A2-S-02` — rotation / invalidation action, date, confirmer, current storage location
- `A2-S-03` — review date, reviewed by, branch protection status, checks, verdict

Правило:

- repo-derived draft не является accepted evidence;
- неподтверждённые поля нельзя выдумывать.

### Шаг 3. Положить restricted artifact

Когда внешний artifact реально получен:

- сохранить его в restricted perimeter;
- заменить `artifact_path: pending` на реальный путь;
- перевести metadata-status хотя бы в `received`.

### Шаг 4. Перепроверить статус

После каждого обновления metadata снова запускать:

```bash
pnpm security:evidence:status
pnpm gate:security:evidence
```

Цель:

- не оставлять drift между metadata, draft и artifact path;
- не переводить `A2` на словах.

### Шаг 5. Синхронизировать execution-layer

После реального движения обновить:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md), если изменилась сила доказательства
- [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md), если historical debt уже закрывается evidence-backed образом

## 3. Что считается реальным прогрессом

Реальный прогресс:

- у metadata есть `draft_path` и он существует;
- у `received/reviewed/accepted`-карточки есть реальный `artifact_path`;
- `pnpm gate:security:evidence` проходит;
- board меняет статус на основании evidence, а не на основании обсуждения.

Не считать прогрессом:

- новый шаблон без draft;
- новый draft без metadata linkage;
- устное подтверждение без restricted artifact;
- ручной просмотр GitHub UI без dated artifact или review memo.

## 4. Условие закрытия evidence-контура `A2`

Этот evidence-layer считается закрытым только когда:

- `A2-S-01`, `A2-S-02`, `A2-S-03` перестают быть просто `requested`;
- у каждого шага есть restricted artifact или явно зафиксированный accepted follow-up;
- `pnpm gate:security:evidence` не показывает structural drift;
- board может переводить `A-2.3.3` и `A-2.3.5` из residual blocker в доказанный closeout/follow-up.
