---
id: DOC-STR-RAI-EP-TARGET-OPERATING-MODEL-20260328
layer: Strategy
type: Vision
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-STR-RAI-EP-TARGET-OPERATING-MODEL-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md;docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;apps/api/src/modules;apps/api/src/shared/rai-chat
---
# RAI_EP TARGET OPERATING MODEL

## CLAIM
id: CLAIM-STR-RAI-EP-TARGET-OPERATING-MODEL-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Operating model в одной фразе

`RAI_EP` работает как governed operating system управления урожаем, где человек принимает или утверждает high-impact решения, доменное ядро ведёт жизненный цикл техкарты и сезона, а AI усиливает анализ, маршрутизацию и advisory-контур, но не подменяет policy и контроль.

## Основные роли

- Собственник / руководитель: задаёт цели сезона, утверждает критичные решения, контролирует риск и экономику.
- Операционный руководитель: переводит цели в процессы, следит за исполнением и отклонениями.
- Агроном / предметный эксперт: формирует и проверяет агрономическую гипотезу, валидирует рекомендации и отклонения.
- Финансово-экономическая роль: связывает план сезона с бюджетом, лимитами, фактом и рентабельностью.
- Front-office / CRM / контрагентный контур: связывает коммуникации, обязательства и коммерческие события с операционной системой.
- Контроль / комплаенс / аудит: следит за правами, explainability, evidence trail, retention, legal и release discipline.
- AI / агентный контур: помогает с анализом, маршрутизацией, explainability и advisory в пределах policy и HITL.

## Основной цикл работы системы

1. Формируется замысел сезона.
2. Создаётся или обновляется техкарта.
3. Техкарта проходит review, approval и publication.
4. Начинается исполнение сезона.
5. Система получает события, факты и отклонения.
6. Доменный и AI-контур формируют сигналы, предупреждения и предложения действий.
7. High-impact действия проходят policy и human gate.
8. Все значимые решения сохраняют audit и explainability след.
9. План, факт и отклонения используются для корректировки следующего цикла.

## Граница ответственности человека и AI

### Человек обязан оставаться в контуре там, где есть

- необратимое действие;
- юридический или финансовый риск;
- существенное изменение техкарты;
- внешняя коммуникация с последствиями;
- решение без достаточного evidence coverage.

### AI уместен там, где нужно

- быстро собрать и структурировать контекст;
- подсветить отклонения и риски;
- предложить варианты действий;
- объяснить, на чём основана рекомендация;
- подготовить draft, summary, alert или route decision.

## Operating contract

Система обязана:
- ставить техкарту в центр управления;
- связывать план, исполнение, отклонения и рекомендации;
- не пропускать high-impact действия мимо policy;
- не выдавать совет как факт без evidence;
- не терять audit trail;
- не позволять UI или агентам размывать доменное ядро.

## KPI operating model

### Управленческие
- доля сезонных решений, проходящих через систему;
- время от отклонения до реакции;
- доля high-impact действий с подтверждённым human approval.

### Доменные
- полнота техкарты;
- связность `план / факт / отклонение`;
- доля операций, связанных с техкартой и сезоном.

### AI / governance
- evidence coverage;
- uncertainty correctness;
- incident rate;
- доля blocked unsafe actions.

### Enterprise
- release readiness;
- installability readiness;
- privacy/legal readiness;
- DR/backup evidence freshness.

## Что operating model не допускает

- автономного AI без ограничений;
- ситуации, где UI диктует бизнес-логику;
- разрыва между техкартой и реальным исполнением;
- enterprise release без security/legal/ops discipline;
- размножения агентных ролей без общей policy framework.
