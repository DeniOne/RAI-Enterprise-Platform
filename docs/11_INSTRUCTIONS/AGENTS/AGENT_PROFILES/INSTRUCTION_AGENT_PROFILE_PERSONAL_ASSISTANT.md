---
id: DOC-INS-AGT-PROFILE-011
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА PERSONAL_ASSISTANT

## 1. Назначение

Документ описывает plan/template-role `personal_assistant`.

## 2. Когда применять

Использовать документ при проектировании личного делегированного assistant-контура.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `personal_ops`.
- Execution adapter: `knowledge`.

## 4. Стратегический образ агента в Stage 2

Роль нужна для:

- личных задач;
- agenda coordination;
- delegated summaries;
- персональной продуктивности в узких границах.

## 5. Фактическое состояние агента по коду

Подтверждён template с:

- `ProductivityToolsRegistry`
- `calendar_read_model` connector
- advisory-only governance
- adapter binding к `knowledge`

Canonical runtime role отсутствует.

## 6. Домены ответственности

- задачи;
- напоминания;
- summaries;
- персональная координация.

## 7. Что агент обязан делать

- Работать в делегированных пределах.
- Уважать персональный контекст и masking policy.
- Не совершать внешние writes без подтверждения.

## 8. Что агенту запрещено делать

- Выполнять unreviewed external writes.
- Захватывать ownership бизнес-доменов.
- Подменять CRM, finance, legal или strategy agents.

## 9. Текущий фактический функционал

- Template manifest;
- governance defaults;
- connector к календарному read model.

## 10. Максимально допустимый функционал

- calendar/task summary;
- next-step planning;
- delegated reminders;
- lightweight coordination внутри user scope.

## 11. Связи с оркестратором

- Сейчас только через onboarding template.
- В canonical runtime topology отсутствует.

## 12. Связи с другими агентами

- С `knowledge`: текущее template inheritance.
- С доменными owner-agents: только как потребитель их результатов, а не владелец.

## 13. Связи с доменными модулями

- `ProductivityToolsRegistry`
- `calendar_read_model`

## 14. Required Context Contract

Не формализован как canonical runtime contract.

## 15. Intent Catalog

Не формализован как canonical runtime catalog.

## 16. Tool surface

- `ProductivityToolsRegistry`

## 17. UI surface

- Пока только onboarding.
- Productized personal assistant windows не подтверждены.

## 18. Guardrails

- `delegated_actions_require_confirmation`
- `no_unreviewed_external_writes`
- masked sensitive data policy

## 19. Основные риски и failure modes

- Слишком широкий доступ к личным данным.
- Подмена personal assistance бизнес-ownership задачами.
- Ложное ощущение готовности из-за наличия template.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- В будущем: privacy, delegated action и confirmation tests.

## 21. Критерии production-ready

- Canonical runtime family.
- Личный context contract.
- Privacy-safe tool surface.
- Подтверждения на все внешние actions.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)
