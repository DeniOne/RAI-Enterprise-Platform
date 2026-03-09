---
id: DOC-INS-AGT-PROFILE-000
type: InstructionIndex
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ПРОФИЛИ АГЕНТОВ — УКАЗАТЕЛЬ

## 1. Назначение

Этот файл собирает подробные профили всех канонических и плановых агентных ролей платформы.

## 2. Когда применять

Использовать указатель, когда нужно:

- быстро открыть профиль конкретного агента;
- сравнить канонические и плановые роли;
- найти подробное описание ownership, guardrails и допустимого функционала.

## 3. Предварительные условия

Перед использованием полезно открыть:

- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
- [INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md)

## 4. Пошаговый алгоритм

1. Сначала открыть общий каталог агентов и определить, является ли роль канонической, плановой или относится к доменному разрыву.
2. Затем открыть подробный профиль нужного агента из списка ниже.
3. При проектировании новых связей сверять профиль агента с архитектурным документом и картой доменных разрывов.

## 5. Что должно получиться на выходе

На выходе должен быть выбран конкретный профиль агента как source of truth для его зоны ответственности, связей и ограничений.

## 6. Критические ошибки и запреты

- Запрещено путать profile template-role и profile канонического runtime-агента.
- Запрещено использовать профиль как доказательство готовности runtime family, если в нём явно указан template-only статус.

## 7. Проверка готовности

Указатель считается готовым, если:

- перечислены все канонические агенты;
- перечислены все plan/template roles;
- есть ссылки на ключевые корневые документы пакета.

## 8. Связанные файлы и точки кода

- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
- [INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md)

## 9. Канонические агенты

- [INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md)
- [INSTRUCTION_AGENT_PROFILE_ECONOMIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_ECONOMIST.md)
- [INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md)
- [INSTRUCTION_AGENT_PROFILE_MONITORING.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MONITORING.md)
- [INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md)

## 10. Плановые роли

- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
- [INSTRUCTION_AGENT_PROFILE_MARKETER.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md)
- [INSTRUCTION_AGENT_PROFILE_STRATEGIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_STRATEGIST.md)
- [INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md)
- [INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md)
- [INSTRUCTION_AGENT_PROFILE_CONTROLLER.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTROLLER.md)
- [INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md)
