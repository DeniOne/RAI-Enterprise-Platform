---
id: DOC-INS-AGT-PROFILE-006
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА MARKETER

## 1. Назначение

Документ описывает плановую role `marketer` как template-level профиль для будущего маркетингового owner-agent.

## 2. Когда применять

Использовать документ, когда:

- обсуждается запуск маркетингового агента;
- проектируется ownership для кампаний и воронки;
- нужно отделить template-role от канонического runtime-агента.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована как canonical.
- Owner domain в template: `marketing`.
- Execution adapter: `knowledge`.

## 4. Стратегический образ агента в Stage 2

Стратегически агент нужен для:

- кампаний;
- сегментации;
- read-model анализа воронки;
- рекомендаций без прямых запусков кампаний.

## 5. Фактическое состояние агента по коду

В коде подтверждено наличие:

- onboarding template в [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts);
- UX-выбора шаблона в [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx).

Уже зашито:

- `ownerDomain: marketing`
- `executionAdapterRole: knowledge`
- capability `MarketingToolsRegistry`
- advisory-only governance

Не реализовано:

- canonical runtime family;
- отдельный routing/intent owner;
- tool layer, подтверждённый в `rai-chat` runtime.

## 6. Домены ответственности

- маркетинг;
- кампании;
- сегменты;
- воронка и read-model summary.

## 7. Что агент обязан делать

- Давать marketing advisory.
- Работать через evidence и CRM read model.
- Сохранять advisory-only режим.

## 8. Что агенту запрещено делать

- Автономно запускать кампании.
- Выполнять неуправляемые writes.
- Захватывать ownership CRM или finance.

## 9. Текущий фактический функционал

- Template manifest;
- governance onboarding;
- template-level runtime defaults.

## 10. Максимально допустимый функционал

- Campaign planning;
- funnel review;
- messaging recommendations;
- lead/segment insights через governed read model.

## 11. Связи с оркестратором

- Сейчас только через future-role onboarding и adapter binding к `knowledge`.
- Как canonical agent не подключён.

## 12. Связи с другими агентами

- С `crm_agent`: возможен будущий governed handoff по лидам и контрагентам.
- С `knowledge`: текущее template-наследование по execution adapter.

## 13. Связи с доменными модулями

- `crm_read_model` connector
- будущий `MarketingToolsRegistry`

## 14. Required Context Contract

В template явно не формализован как canonical contract. Должен появиться при переходе из template в runtime family.

## 15. Intent Catalog

На уровне template не закреплён как canonical runtime catalog.

## 16. Tool surface

- `MarketingToolsRegistry` заявлен на template-уровне.

## 17. UI surface

- Пока только onboarding UX.
- Product UI для marketing work windows ещё не подтверждён.

## 18. Guardrails

- Только advisory.
- `campaign_launch_requires_human_gate`
- `no_unreviewed_writes`

## 19. Основные риски и failure modes

- Путаница между template-role и готовым агентом.
- Попытка использовать маркетинговую роль как production owner без runtime family.
- Расширение в CRM ownership без явного handoff.

## 20. Требования к тестам

- Template manifest validation.
- Governance validation.
- Будущие tests на routing, tools и UI после canonical enablement.

## 21. Критерии production-ready

- Собственный canonical runtime role.
- Focus/Intent/Context/UI contracts.
- Реальный marketing tool surface.
- Smoke-сценарии по кампаниям и воронке.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)

