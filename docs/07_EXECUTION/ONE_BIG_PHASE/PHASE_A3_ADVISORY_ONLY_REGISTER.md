---
id: DOC-EXE-ONE-BIG-PHASE-A3-ADVISORY-ONLY-REGISTER-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-ADVISORY-ONLY-REGISTER-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_TOOL_PERMISSION_MATRIX.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_HITL_MATRIX.md;docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md;apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts;apps/api/src/modules/rai-chat/pending-actions.controller.ts
---
# PHASE A3 ADVISORY-ONLY REGISTER

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-ADVISORY-ONLY-REGISTER-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует, какие high-impact действия в `Tier 1` агентам разрешено только рекомендовать, а не исполнять от своего имени. Это governance-граница, а не маркетинговое описание “осторожного AI”.

## 1. Базовое правило

Если действие:

- меняет юридически, финансово или операционно значимое состояние;
- не имеет полного runtime allowlist + `HITL` closeout;
- зависит от внешнего legal/IP/governance решения;
- или не подтверждено достаточным evidence,

то для `Tier 1` оно считается `advisory-only`.

## 2. Advisory-only register

| Класс действия | Что агенту разрешено | Что агенту запрещено | Почему это advisory-only сейчас |
|---|---|---|---|
| `Legal / privacy / RKN / transborder decisions` | собрать контекст, сформировать memo, перечислить missing evidence | принимать юридическое решение, утверждать статус уведомления, подтверждать transborder legality | эти решения зависят от внешних документов и owner sign-off, которых нет в runtime |
| `IP / chain-of-title / licensing decisions` | подготовить triage, собрать register, описать риски | утверждать права на код/БД, окончательно трактовать лицензионную совместимость | `A5` требует внешнего legal evidence и manual review |
| `Commerce critical posting` | подготовить summary, показать последствия, собрать evidence для review | самостоятельно `post_invoice`, `confirm_payment`, `allocate_payment` как business decision | в runtime это `CRITICAL` path с `two-person approval`; для `Tier 1` это не свободный execute-mode |
| `External legally or financially significant communication` | подготовить draft текста и checklist подтверждения | отправлять финальное сообщение от имени компании без человека | policy прямо запрещает такое без отдельного human gate |
| `Pilot go-live / release go-no-go` | собрать gate summary, перечислить blockers, предложить решение | объявлять продукт pilot-ready или production-ready | это управленческое решение зависит от legal/security/installability/IP closeout |
| `Security perimeter changes` | собрать список required checks, описать gaps | самостоятельно менять branch protection, access model, deploy keys или environments | эти изменения подтверждаются внешним governance evidence вне repo |
| `Self-host operational acceptance` | подготовить install checklist, dry-run report template, recovery summary | утверждать, что installability/recovery доказаны без execution evidence | `A4` ещё требует реальных drill-артефактов |
| `Expert roles without explicit tool policy` | давать рекомендации и review feedback | исполнять новые governed tool flows | `chief_agronomist` и `data_scientist` пока без explicit tool policy и остаются advisory-only |
| `Insufficient-evidence answers` | обозначить неопределённость, попросить уточнение, показать источники | выдавать уверенный ответ как подтверждённый факт | evidence-first policy запрещает unsupported answer |

## 3. Что это меняет в `Tier 1`

Для `Tier 1 self-host / localized MVP pilot` advisory-only perimeter означает:

- агент может ускорять анализ и подготовку решения;
- агент не становится final authority для high-impact действий;
- любые попытки расширить execute-path выше этого perimeter считаются autonomy expansion и запрещены до закрытия `A3`.

## 4. Что этот register уже решает

Он уже снимает двусмысленность по трём вопросам:

1. Где агент может быть только советником, даже если вокруг уже есть tooling.
2. Какие business-решения нельзя путать с техническим `tool execution`.
3. Почему `Tier 1` — это governed advisory/productive core, а не autonomous control plane.

## 5. Что register ещё не закрывает

Этот register сам по себе ещё не закрывает:

- formal red-team/eval evidence;
- tenant-specific override policy;
- UX-контракт по тому, как advisory-only ограничения показываются в `web/chat`;
- внешние legal/IP решения.

Поэтому `A3.3` можно переводить в рабочий execution-state, но не в `done` для всего `A3`.
