---
id: DOC-INS-AGT-PROFILE-008
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА FINANCE_ADVISOR

## 1. Назначение

Документ описывает template-role `finance_advisor`.

## 2. Когда применять

Использовать документ при проектировании специализированного финансового advisory поверх `economist`.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `finance`.
- Execution adapter: `economist`.

## 4. Стратегический образ агента в Stage 2

Роль нужна как управляемый финансовый advisory-контур поверх детерминированных метрик и сценариев.

## 5. Фактическое состояние агента по коду

Подтверждён template с:

- `ownerDomain: finance`
- strong-model routing
- `FinanceToolsRegistry`
- advisory-only governance
- explicit no-payment / no-booking writes

Как canonical runtime role не реализован.

## 6. Домены ответственности

- финансовые рекомендации;
- метрики;
- budgets;
- сценарные финансовые выводы.

## 7. Что агент обязан делать

- Опираться на deterministic finance evidence.
- Возвращать рекомендации, а не транзакции.
- Работать в advisory-only режиме.

## 8. Что агенту запрещено делать

- Платёжные и учётные writes.
- Подменять `economist` owner-agent без formalized runtime split.
- Выходить в CRM или legal.

## 9. Текущий фактический функционал

- Template manifest;
- governance policy;
- adapter binding к `economist`.

## 10. Максимально допустимый функционал

- управляемый финансовый advisory;
- portfolio and budget commentary;
- management-ready summaries поверх `economist` outputs.

## 11. Связи с оркестратором

- Сейчас только через future-role onboarding.
- В каноническом runtime как отдельная family отсутствует.

## 12. Связи с другими агентами

- С `economist`: текущее adapter inheritance.
- С `controller`: будущая связка по control exceptions.

## 13. Связи с доменными модулями

- `FinanceToolsRegistry`
- будущий finance domain adapter

## 14. Required Context Contract

Ещё не оформлен как canonical contract.

## 15. Intent Catalog

Ещё не выделен как самостоятельный canonical catalog, так как template опирается на `economist`.

## 16. Tool surface

- `FinanceToolsRegistry`

## 17. UI surface

- Пока только onboarding.
- Full finance advisor windows не подтверждены.

## 18. Guardrails

- Только advisory.
- `financial_actions_disallowed`
- `no_payment_or_booking_writes`

## 19. Основные риски и failure modes

- Путаница между `finance_advisor` и `economist`.
- Скрытая попытка сделать runtime-дубль экономиста без ownership split.
- Использование советника как transaction actor.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- В будущем: routing, evidence, no-write regression.

## 21. Критерии production-ready

- Отдельный role contract.
- Ясное разграничение с `economist`.
- No-write governance.
- Deterministic evidence path.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)

