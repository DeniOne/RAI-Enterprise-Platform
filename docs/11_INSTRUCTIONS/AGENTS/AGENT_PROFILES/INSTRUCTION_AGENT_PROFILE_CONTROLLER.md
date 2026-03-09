---
id: DOC-INS-AGT-PROFILE-010
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА CONTROLLER

## 1. Назначение

Документ описывает template-role `controller`.

## 2. Когда применять

Использовать документ при проектировании контрольного и сверочного owner-agent.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `finance`.
- Execution adapter: `monitoring`.

## 4. Стратегический образ агента в Stage 2

Роль нужна как агент контрольного контура:

- сверки;
- exceptions;
- сигналы контроля;
- управляемые эскалации.

## 5. Фактическое состояние агента по коду

В коде подтверждён template с:

- `FinanceToolsRegistry` и `RiskToolsRegistry`
- `hybrid` autonomy
- strong no-write governance
- adapter binding к `monitoring`

Canonical runtime role отсутствует.

## 6. Домены ответственности

- контроль;
- exceptions;
- сверки;
- сигналы и эскалации в финансовом контуре.

## 7. Что агент обязан делать

- Обнаруживать отклонения и exceptions.
- Возвращать evidence-backed control summary.
- Эскалировать write-требования только через governed review.

## 8. Что агенту запрещено делать

- Делать uncontrolled postings.
- Подменять `economist` или `monitoring` без ownership split.
- Самостоятельно решать критичные execution actions.

## 9. Текущий фактический функционал

- Template manifest;
- governance defaults;
- adapter binding.

## 10. Максимально допустимый функционал

- control exception review;
- reconciliation support;
- governed escalation;
- joint finance-monitoring contour без потери ownership.

## 11. Связи с оркестратором

- Сейчас только через template onboarding.
- Как canonical runtime node отсутствует.

## 12. Связи с другими агентами

- С `monitoring`: текущее template inheritance.
- С `economist`: будущий handoff по finance exceptions.
- С `strategy`: возможный future handoff по control implications.

## 13. Связи с доменными модулями

- `FinanceToolsRegistry`
- `RiskToolsRegistry`

## 14. Required Context Contract

Не формализован как canonical runtime contract.

## 15. Intent Catalog

Не формализован как canonical runtime catalog.

## 16. Tool surface

- `FinanceToolsRegistry`
- `RiskToolsRegistry`

## 17. UI surface

- Пока только onboarding.
- Control work windows ещё не подтверждены.

## 18. Guardrails

- `escalations_require_review_for_writes`
- `deny_unreviewed_postings`
- trace/evidence/validation required

## 19. Основные риски и failure modes

- Смазывание границы между monitoring и controller.
- Использование role как write-agent.
- Недостаток собственного ownership contract.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- После enablement: exception handling tests и no-write tests.

## 21. Критерии production-ready

- Canonical runtime role.
- Ясное разграничение с `monitoring` и `economist`.
- Structured exception model.
- Smoke-сценарии по сверкам и эскалациям.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)

