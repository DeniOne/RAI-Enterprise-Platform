---
id: DOC-EXE-ONE-BIG-PHASE-INDEX-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.4.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-INDEX-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-03-30
evidence_refs: docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# ONE BIG PHASE INDEX

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-INDEX-20260330
status: asserted
verified_by: manual
last_verified: 2026-03-30

Этот пакет — практическая папка исполнения текущей большой фазы. Он раскладывает [RAI_EP_MVP_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md) на подфазы с детальными чеклистами, чтобы проект можно было вести не “по ощущениям”, а по понятному порядку.

## 1. Главная цель большой фазы

Собрать правильный ближайший продукт:

- управляемое агентное ядро;
- чат;
- минимальную `web`-поверхность;
- explainability и evidence;
- жизненный цикл Техкарты;
- ограниченный `self-host / localized` MVP-pilot.

## 2. Порядок исполнения

Исполняем только сверху вниз:

1. [01_PHASE_A_STOP_BLOCKERS_AND_GATES.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md)
2. [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md)
3. [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md)
4. [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md)

## 2.1. Рабочие документы `Phase A`

- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md)
- [PHASE_A1_LEGAL_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md)
- [PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md)
- [PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md)
- [PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md)
- [PHASE_A2_SECURITY_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md)
- [PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md)
- [PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md)
- [PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)

## 3. Что считается прогрессом

Прогрессом считаются только такие изменения:

- уменьшают `legal / security / AI-governance / release`-риск;
- приближают `Tier 1 self-host / localized` pilot;
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
- Подфазы `B`, `C`, `D` не могут считаться завершёнными, если подфаза `A` остаётся красной по stop-blockers.
- Внутри подфазы можно работать параллельно, но только если это не подменяет верхний приоритет.
- Любая задача, которая не усиливает ядро MVP, уходит вниз очереди.
- Любая новая идея сначала проходит вопрос: “это нужно ближайшему MVP или это ширина?”

## 6. Как пользоваться папкой

Правильный ритм работы такой:

1. Открыть текущую подфазу.
2. Брать задачи сверху вниз.
3. Закрывать не абстрактно, а по критерию “что должно измениться”.
4. Не переходить к следующей подфазе, пока не закрыт выходной критерий текущей.

## 7. Текущий вход

Начинать нужно с:

- [01_PHASE_A_STOP_BLOCKERS_AND_GATES.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md)

Именно она определяет, можно ли вообще двигаться к реальному MVP-pilot безопасно и осмысленно.
