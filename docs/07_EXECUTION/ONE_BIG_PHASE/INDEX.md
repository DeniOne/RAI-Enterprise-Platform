---
id: DOC-EXE-ONE-BIG-PHASE-INDEX-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.61.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-INDEX-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md;docs/07_EXECUTION/ONE_BIG_PHASE/POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md
---
# ONE BIG PHASE INDEX

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-INDEX-20260330
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот пакет — практическая папка исполнения текущей большой фазы. Он раскладывает [RAI_EP_MVP_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md) на подфазы с детальными чеклистами, чтобы проект можно было вести не “по ощущениям”, а по понятному порядку.

## 1. Главная цель большой фазы

Собрать правильный ближайший продукт:

- управляемое агентное ядро;
- чат;
- минимальную `web`-поверхность;
- explainability и evidence;
- жизненный цикл Техкарты;
- ограниченный `self-host / localized` MVP-pilot.
- контролируемый `Tier 2 managed deployment` contour без преждевременного `SaaS/hybrid` rollout.

## 2. Порядок исполнения

Исполняем только сверху вниз:

1. [01_PHASE_A_STOP_BLOCKERS_AND_GATES.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md)
2. [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md)
3. [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md)
4. [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md)
5. [05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md)

## 2.0. Активная точка входа после парковки `Phase A`

`Phase A` не отменена и не закрыта, но осознанно припаркована как checkpoint в состоянии `repo_side_exhausted_external_only`. После закрытия `Phase D` (`phase_d_ready`) управленческий execution-фокус перенесён на `Phase E`.

Это означает:

- внешний closeout-хвост `A1/A2/A4/A5` сохранён как точка возврата;
- `Phase D` фиксируется как закрытый `Tier 1` baseline;
- `Phase C` сохраняется как закрытый execution-baseline для web/access и explainability;
- `Phase E` закрыта в `phase_e_ready_tier2` (`pnpm gate:phase:e:status` — green);
- пакет `ONE_BIG_PHASE` закрыт по текущему объёму `A-E`;
- следующий execution-цикл открывается отдельным решением и новым фазовым пакетом.

## 2.1. Рабочие документы `Phase A`

- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md)
- [PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md)
- [PHASE_A_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_STATUS_GATE.md)
- [PHASE_A_EXTERNAL_BLOCKERS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_BLOCKERS_PACKET.md)
- [PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md)
- [PHASE_A_EXTERNAL_OWNER_OUTREACH_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_OUTREACH_PACKET.md)
- [PHASE_A_EXTERNAL_OUTREACH_LEDGER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OUTREACH_LEDGER.md)
- [PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md)
- [PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md)
- [PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md)
- [PHASE_A_CLOSEOUT_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CLOSEOUT_STATUS_GATE.md)
- [PHASE_A0_TRIAGE_EXECUTION_RULES.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_TRIAGE_EXECUTION_RULES.md)
- [PHASE_A0_DAILY_TRIAGE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_DAILY_TRIAGE_CHECKLIST.md)
- [PHASE_A1_LEGAL_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md)
- [PHASE_A1_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md)
- [PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md)
- [PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md)
- [PHASE_A1_FIRST_WAVE_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_STATUS_GATE.md)
- [PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md)
- [PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md)
- [PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md)
- [PHASE_A1_OWNER_QUEUE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_OWNER_QUEUE_PACKET.md)
- [PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md)
- [PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md)
- [PHASE_A1_ELP_04_PROCESSOR_DPA_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_04_PROCESSOR_DPA_CHECKLIST.md)
- [PHASE_A1_ELP_06_LAWFUL_BASIS_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_06_LAWFUL_BASIS_CHECKLIST.md)
- [PHASE_A1_ELP_02_RKN_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_02_RKN_CHECKLIST.md)
- [PHASE_A1_ELP_05_TRANSBORDER_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_05_TRANSBORDER_CHECKLIST.md)
- [PHASE_A1_ELP_08_RETENTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_08_RETENTION_CHECKLIST.md)
- [PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md)
- [PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md)
- [PHASE_A2_SECURITY_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md)
- [PHASE_A2_TIER1_TOOLCHAIN_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_TIER1_TOOLCHAIN_DECISION.md)
- [PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md)
- [PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md)
- [PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_EVIDENCE_CLOSEOUT_CHECKLIST.md)
- [PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md)
- [PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md)
- [PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S3_GITHUB_ACCESS_REVIEW_CHECKLIST.md)
- [PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_FIRST_WAVE_GOVERNANCE_CHECKLIST.md)
- [PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md)
- [PHASE_A3_TOOL_PERMISSION_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md)
- [PHASE_A3_HITL_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md)
- [PHASE_A3_ADVISORY_ONLY_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_ADVISORY_ONLY_REGISTER.md)
- [PHASE_A3_RELEASE_EVAL_SUITE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_SUITE.md)
- [PHASE_A3_RELEASE_EVAL_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_REPORT_2026-03-31.md)
- [PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RUNTIME_DRILL_REPORT_2026-03-31.md)
- [PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_FIRST_WAVE_INSTALLABILITY_CHECKLIST.md)
- [PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md)
- [PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SELF_HOST_INSTALL_UPGRADE_PACKET.md)
- [PHASE_A4_INSTALL_DRY_RUN_REPORT_TEMPLATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_TEMPLATE.md)
- [PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALL_DRY_RUN_REPORT_2026-03-31.md)
- [PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BLANK_WORKTREE_BOOTSTRAP_REPORT_2026-03-31.md)
- [PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_TEMPLATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_TEMPLATE.md)
- [PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_BACKUP_RESTORE_EXECUTION_REPORT_2026-03-31.md)
- [PHASE_A4_SUPPORT_BOUNDARY_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_SUPPORT_BOUNDARY_PACKET.md)
- [PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_PILOT_HANDOFF_EVIDENCE_CLOSEOUT_CHECKLIST.md)
- [PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_CHECKLIST.md)
- [PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_TIER1_PILOT_HANDOFF_REPORT_TEMPLATE.md)
- [PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md)
- [PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md)
- [PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md)
- [PHASE_A5_CHAIN_OF_TITLE_COLLECTION_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_COLLECTION_PACKET.md)
- [PHASE_A5_CHAIN_OF_TITLE_HANDOFF_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_HANDOFF_PACKET.md)
- [PHASE_A5_CHAIN_OF_TITLE_OWNER_PACKETS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_OWNER_PACKETS.md)
- [PHASE_A5_CHAIN_OF_TITLE_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_REQUEST_PACKET.md)
- [PHASE_A5_CHAIN_OF_TITLE_DELIVERY_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_DELIVERY_PACKET.md)
- [PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md)
- [PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md)
- [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md)
- [PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md)
- [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md)
- [PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md)
- [PHASE_A5_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_STATUS_GATE.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)

## 2.2. Рабочие документы `Phase B`

- [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md)
- [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md)

## 2.3. Рабочие документы `Phase C`

- [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md)
- [PHASE_C_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_IMPLEMENTATION_PLAN.md)
- [PHASE_C_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_EXECUTION_BOARD.md)
- [PHASE_C_NEW_CHAT_MEMO.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_C_NEW_CHAT_MEMO.md)

## 2.4. Рабочие документы `Phase D`

- [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md)
- [PHASE_D_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_IMPLEMENTATION_PLAN.md)
- [PHASE_D_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_EXECUTION_BOARD.md)

## 2.5. Рабочие документы `Phase E`

- [05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md)
- [PHASE_E_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_IMPLEMENTATION_PLAN.md)
- [PHASE_E_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_EXECUTION_BOARD.md)

## 2.6. Сверка с audit baseline

- [ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md)

## 2.7. Post-closeout residual workpack

- [POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md)
- `pnpm security:post-big-phase:status`
- `pnpm gate:security:post-big-phase`
- `pnpm security:post-big-phase:prepare`
- `pnpm security:post-big-phase:bundle`
- `pnpm security:post-big-phase:index`
- `pnpm security:post-big-phase:run-card`
- `pnpm security:post-big-phase:pr-template`
- `pnpm security:post-big-phase:reconcile -- --pr-number=...`
- `pnpm gate:security:post-big-phase:reconcile -- --pr-number=...`
- `pnpm security:reviewed-evidence:reconcile -- --pr-number=...`
- `pnpm gate:security:reviewed-evidence:reconcile -- --pr-number=...`
- [post-big-phase-internal-residual-status.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-status.json)
- [post-big-phase-internal-residual-reconcile.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-reconcile.json)
- [post-big-phase-internal-residual-bundle/README.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-bundle/README.md)

Текущее состояние residual workpack:

- `R1=done`
- `R2=done`
- `R3=in_progress`
- общий verdict: `post_big_phase_internal_residual_open`

## 3. Что считается прогрессом

Прогрессом считаются только такие изменения:

- уменьшают `legal / security / AI-governance / release`-риск;
- приближают `Tier 1 self-host / localized` pilot;
- усиливают доказуемость `Tier 2 managed deployment` и release governance;
- делают Техкарту, чат и agent runtime более связанными;
- делают `web` более пригодным для реальной работы, а не просто более широким;
- усиливают installability, восстановление и управляемость.

## 4. Что не считается прогрессом

Следующие вещи нельзя считать движением вперёд, пока не закрыты подфазы выше:

- расширение меню;
- новые доменные экраны;
- рост `CRM / front-office`;
- новые агенты;
- рост автономии AI;
- новые интеграции;
- движение в сторону `SaaS / hybrid`;
- визуальная полировка вместо закрытия gate.

## 5. Правила исполнения

- `code/tests/gates` важнее документов.
- Подфазы `B`, `C`, `D`, `E` исполняются при parked-статусе `Phase A`; возврат в `A` включается только при новом repo-side blocker или при возобновлении внешнего closeout.
- Внутри подфазы можно работать параллельно, но только если это не подменяет верхний приоритет.
- Любая задача, которая не усиливает ядро MVP, уходит вниз очереди.
- Любая новая идея сначала проходит вопрос: “это нужно ближайшему MVP или это ширина?”

## 6. Как пользоваться папкой

Правильный ритм работы такой:

1. Открыть текущую подфазу.
2. Брать задачи сверху вниз.
3. Закрывать не абстрактно, а по критерию “что должно измениться”.
4. Не переходить к следующей подфазе, пока не закрыт выходной критерий текущей.
5. Исключение допустимо только при явной checkpoint/memo-фиксации управленческого переноса фокуса.

## 7. Текущий вход

`ONE_BIG_PHASE` закрыта по текущему объёму. Для фиксации и удержания статуса использовать:

- [05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md)
- [PHASE_E_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_IMPLEMENTATION_PLAN.md)
- [PHASE_E_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_EXECUTION_BOARD.md)
- [ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/ONE_BIG_PHASE_AUDIT_RECONCILIATION_2026-04-01.md)
- `var/ops/phase-e-status.json`

Для старта следующей большой фазы сначала фиксируется отдельный execution-entrypoint и новый board-пакет.

Возврат к `Phase A` включается точечно через [PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md), когда снова есть смысл добивать внешний closeout.

Для отдельного внутреннего residual cleanup без переоткрытия `A-E` использовать [POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/POST_BIG_PHASE_INTERNAL_RESIDUAL_APPSEC_HYGIENE_WORKPACK_2026-04-01.md).

Для широкого накопленного execution `PR` по `Phase B/C/D/E + closeout + residual` использовать:

- `pnpm execution:one-big-phase:wide-pr-prep`
- `pnpm execution:one-big-phase:wide-pr-run-card`
- [one-big-phase-wide-pr-prep.md](/root/RAI_EP/var/execution/one-big-phase-wide-pr-prep.md)
- [one-big-phase-wide-pr-run-card.md](/root/RAI_EP/var/execution/one-big-phase-wide-pr-run-card.md)
- [one-big-phase-wide-pr-commands.template.sh](/root/RAI_EP/var/execution/one-big-phase-wide-pr-commands.template.sh)

Текущий machine-readable вход для этого cleanup:

- `pnpm security:post-big-phase:status`
- `pnpm gate:security:post-big-phase`
- `pnpm security:post-big-phase:prepare`
- `pnpm security:post-big-phase:bundle`
- `pnpm security:post-big-phase:index`
- `pnpm security:post-big-phase:run-card`
- `pnpm security:post-big-phase:pr-template`
- `pnpm security:post-big-phase:reconcile -- --pr-number=...`
- `pnpm gate:security:post-big-phase:reconcile -- --pr-number=...`
- `pnpm security:reviewed-evidence:reconcile -- --pr-number=...`
- `pnpm gate:security:reviewed-evidence:reconcile -- --pr-number=...`
- [post-big-phase-internal-residual-status.json](/root/RAI_EP/var/security/post-big-phase-internal-residual-status.json)
- [post-big-phase-internal-residual-bundle/README.md](/root/RAI_EP/var/security/post-big-phase-internal-residual-bundle/README.md)
