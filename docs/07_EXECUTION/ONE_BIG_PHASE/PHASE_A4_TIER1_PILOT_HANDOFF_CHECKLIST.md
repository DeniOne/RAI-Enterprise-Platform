---
id: DOC-EXE-ONE-BIG-PHASE-A4-TIER1-PILOT-HANDOFF-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-TIER1-PILOT-HANDOFF-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md
---
# PHASE A4 TIER1 PILOT HANDOFF CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-TIER1-PILOT-HANDOFF-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A4.4` из общей guard-фразы в конкретный handoff-чеклист для первого controlled `Tier 1 self-host / localized` pilot.

## 1. Что должно быть готово до handoff

- install packet: [PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md)
- dry-run evidence: [PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md)
- blank-worktree bootstrap evidence: [PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md)
- recovery evidence: [PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md)
- support boundary: [PHASE_A4_SUPPORT_BOUNDARY_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md)

## 2. Что нужно собрать по конкретной pilot-среде

- owner среды
- contact point для infra / ops
- кто выдаёт и хранит secrets
- кто отвечает за `PostgreSQL / Redis / MinIO`
- где хранится backup
- кто выполняет restore drill при инциденте
- кто принимает решение об upgrade window
- кто подтверждает, что среда не воспринимается как `managed service`

## 3. Что нужно подтвердить на handoff

- pilot-side понимает, что `self-host` != `managed`
- host prerequisites проверены
- Docker / network / storage готовы
- secrets выданы вне Git
- backup path существует и понятен
- escalation path известен
- known limitations зафиксированы письменно

## 4. Что нельзя пропускать

Нельзя считать handoff состоявшимся, если:

- нет named owner у среды пилота
- нет named contact для infra/support
- secrets bootstrap остаётся устным
- recovery responsibility не назначена
- customer/pilot side думает, что команда продукта управляет их средой как managed-service

## 5. Артефакт завершения

После первого реального handoff должен быть заполнен:

- [PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md)

И только после этого `A-2.5.4` может быть пересмотрена из `guard_active`.

Lifecycle этого evidence вести через:

- `pnpm phase:a4:handoff:status`
- `pnpm phase:a4:handoff:intake -- --reference=A4-H-01 --source=/abs/path/file`
- `pnpm phase:a4:handoff:transition -- --reference=A4-H-01 --status=reviewed`
- `pnpm phase:a4:handoff:transition -- --reference=A4-H-01 --status=accepted`
