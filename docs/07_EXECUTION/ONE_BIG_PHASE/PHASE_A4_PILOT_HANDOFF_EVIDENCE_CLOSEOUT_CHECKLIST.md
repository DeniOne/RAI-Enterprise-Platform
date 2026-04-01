---
id: DOC-EXE-ONE-BIG-PHASE-A4-PILOT-HANDOFF-EVIDENCE-CLOSEOUT-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-PILOT-HANDOFF-EVIDENCE-CLOSEOUT-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md;scripts/phase-a4-pilot-handoff-status.cjs;scripts/phase-a4-pilot-handoff-intake.cjs;scripts/phase-a4-pilot-handoff-transition.cjs
---
# PHASE A4 PILOT HANDOFF EVIDENCE CLOSEOUT CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-PILOT-HANDOFF-EVIDENCE-CLOSEOUT-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A4.4` из набора шаблонов в machine-readable lifecycle по первому реальному `Tier 1 self-host / localized` handoff.

## 1. Что именно отслеживается

Для `A4.4` используется один первичный reference:

- `A4-H-01` — first controlled `Tier 1 self-host / localized` pilot handoff

Restricted perimeter для этого evidence:

- metadata: `/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-03-31/metadata/`
- templates: `/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-03-31/templates/`
- drafts: `/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-03-31/drafts/`
- artifacts: `/root/RAI_EP_RESTRICTED_EVIDENCE/pilot-handoffs/2026-03-31/artifacts/`

## 2. Обязательный lifecycle

Разрешён только такой путь:

1. `requested`
2. `received`
3. `reviewed`
4. `accepted`

Нельзя:

- считать handoff закрытым по одному только repo-side template;
- переводить `A4-H-01` в `received` без реального заполненного handoff report;
- переводить `A4-H-01` в `accepted` без review фактического pilot environment.

## 3. Команды

Статус и gate:

- `pnpm phase:a4:handoff:status`
- `pnpm gate:phase:a4:handoff`

Приёмка артефакта:

- `pnpm phase:a4:handoff:intake -- --reference=A4-H-01 --source=/abs/path/file`

Переходы:

- `pnpm phase:a4:handoff:transition -- --reference=A4-H-01 --status=reviewed`
- `pnpm phase:a4:handoff:transition -- --reference=A4-H-01 --status=accepted`

## 4. Что считается сильным evidence

Сильное доказательство для `A4.4`:

- реальный handoff report по [PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md)
- принятый restricted artifact в `artifacts/A4-H-01/`
- зелёный `pnpm gate:phase:a4:handoff`

Недостаточно:

- только support boundary packet
- только checklist
- только report template
- устное подтверждение handoff-а

## 5. Что должно измениться в `Phase A`

После появления реального accepted handoff evidence:

- `A4-H-01` должен уйти в `accepted`
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) может пересматривать `A-2.5.4`
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md) перестаёт считать pilot handoff только repo-side kit

До этого момента `A-2.5.4` остаётся `guard_active`.
