---
id: DOC-STR-STAGE-2-STAGE-3-AGENT-DELEGATION-IMPLEMENT-1FHZ
layer: Strategy
type: Roadmap
status: draft
version: 0.1.0
---
# ЧЕК-ЛИСТ: Реализация Stage 3 (Иерархическое Делегирование и Data-Worker Агенты)

Этот план описывает последовательные шаги по переходу `RAI_EP` на новую модель кросс-доменного ИИ-делегирования (Sub-Agent Tool Calling).

> Truth Reset (2026-03-18): статус `[x]` оставляется только при тройном evidence (`код + проверка + артефакт`). Снятые пункты и причины зафиксированы в `docs/00_STRATEGY/STAGE 2/CHECKLIST_EVIDENCE_LEDGER.md` и `docs/frontend-audit-2026-03-16/CHECKLIST_TRUTH_RESET_REPORT.md`.

## Целевой Архитектурный Вектор

Stage 3 должен развиваться не через рост локальных regex-туннелей и phrase-bound перехватчиков, а через controlled migration к state-aware semantic routing поверх контрактного runtime.

Основной architectural reference для этой эволюции:

- `docs/00_STRATEGY/STAGE 2/RAI_ROUTING_LEARNING_LAYER_PROBLEM_AND_PROPOSAL.md`

Обязательная интерпретация этого чек-листа:

- новые routing-фиксы считаются допустимыми только как bounded fallback, а не как новая основная ось поведения;
- разделение `read / write / navigation / analysis` должно усиливаться в contract/runtime слоях, а не растворяться в wording-эвристиках;
- любые изменения intent-routing должны двигать систему в сторону `SemanticIntent -> RouteDecision -> Capability Gating -> Deterministic Runtime Guards`, а не назад к Stage 2 phrase matching.

## Фаза 1: Обновление Документации и Канонов (Governance & Docs)

Прежде чем писать код, необходимо подчистить всю базу знаний проекта, чтобы она отражала новую парадигму.

- [x] **Обновить архитектуру взаимодействия агентов**: Внести изменения в `ALL_DOCS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md`.
  - Описать паттерн `Agent-as-a-Tool` (выдача агенту инструмента вроде `Ask_Economist`).
  - Описать переход от "Governance Handoff" к "Sub-Agent Delegation".
- [x] **Обновить карту Ownership**: Модифицировать `ALL_DOCS/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md`.
  - Указать, что вторичные домены (Secondary Owners) теперь вызываются не через обрыв контекста, а через внутренние инструменты агента-хозяина формы.
- [x] **Обновить профили Агентов-Воркеров (Data Workers)**: 
  - [x] `INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md`
  - [x] `INSTRUCTION_AGENT_PROFILE_ECONOMIST.md`
  - [x] `INSTRUCTION_AGENT_PROFILE_MONITORING.md`
  - [x] `INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md`
  - В профилях жестко прописать требование возвращать сухие факты (JSON/Structured Output), а не "лить воду", оставив текст для Оркестратора.
- [x] **Обновить профили Агентов-Презентаторов (Текстогенераторов)**:
  - [x] `INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md`
  - [x] `INSTRUCTION_AGENT_PROFILE_MARKETER.md`
  - Описать, что формат их работы разрешает генерацию объемного текста (договоры, статьи, email-письма).
  - Evidence: `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md`, `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md`, `docs/00_STRATEGY/STAGE 2/CHECKLIST_EVIDENCE_LEDGER.md`.

## Фаза 2: Инфраструктура Инструментов Делегирования (Backend Tools)

Кодовая зашивка инструментов связи между агентами "под капотом".

- [x] **Создать пул инструментов `TalkToAgent` (Tools Registry)**:
  - Написать спецификации для `Ask_Economist_Tool`, `Ask_Agronomist_Tool`, `Ask_CRM_Tool`.
  - Каждый инструмент должен принимать на вход: `requestQuery: string` (сухой вопрос), `requiredData: string[]` (что именно вернуть).
  - Evidence: `apps/api/src/modules/rai-chat/tools/delegation-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`.
- [x] **Реализовать обработчик Sub-Agent Adapter**:
  - Внедрить вызов смежных агентов внутри `AgentExecutionAdapterService`.
  - Убедиться, что вызов саб-агента не рушит текущий контекст `AgentRuntimeService` (вложенные traceId / spanId для логов и биллинга токенов).
  - Evidence: `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts`, `apps/api/src/shared/rai-chat/rai-tools.types.ts`.
- [x] **Настроить Role-based Access Control (RBAC) для инструментов связи**:
  - Дать Агроному доступ к `Ask_Economist_Tool`.
  - Настроить Governance-политики, запрещающие Агроному использовать `Ask_Legal_Tool`, если это нарушает политику безопасности данных.
  - Evidence: `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`, `apps/api/src/modules/rai-chat/agent-runtime-config.service.spec.ts`.

## Фаза 3: Обновление Промптов и Контроль Галлюцинаций (Prompting & Confidence)

- [x] **Настройка System Prompts для Data-Workers**:
  - Внести зміни в генератор промптов (внутри `AgentPromptAssemblyService`), переключив агентов в режим JSON-Only (кроме Юриста/Маркетолога).
  - Evidence: `apps/api/src/modules/rai-chat/agent-platform/agent-prompt-assembly.service.ts`, `apps/api/src/modules/rai-chat/agent-platform/agent-prompt-assembly.service.spec.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`.
- [x] **Разработка Оркестратора-Синтезатора (Response Composer)**:
  - Переписать `ResponseComposerService`, чтобы он брал массив структурированных ответов `structuredOutput` от разных агентов (по цепочке вызовов) и превращал его в красивое эссе для чата.
  - Evidence: `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts`.
- [x] **Внедрение шкалы доверия (Trust Score Pipeline)**:
  - Добавить в `SupervisorAgent` логику проверки `confidence` и `evidence`.
  - Настроить автоматический кросс-чекинг: если доменный агент выдает данные не из своего домена с низким `confidence`, Оркестратор сам, скрыто от юзера, запускает проверку через `Ask_Prof_Agent`.
  - Evidence: `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`, `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`.

## Фаза 4: Тест и Запуск (QA & Rollout)

- [x] **Поднять тестовый стенд**: написать e2e тесты на кросс-доменный запрос («Сколько селитры вылили на поле 6 Казьминского и сколько денег это стоило?»).
  - Evidence: `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`, `apps/web/__tests__/ai-chat-store.spec.ts`.
- [x] **Анализ стоимости (Token Metrics)**: снять метрики потребления. Сравнить стоимость и скорость выполнения запроса до обновы (Long Text Prompt) и после (JSON Prompting).
  - Evidence: `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` (benchmark `фиксирует before/after token-cost метрики для legacy-long-text vs stage3-json`), `docs/00_STRATEGY/STAGE 2/STAGE_3_TOKEN_METRICS_BEFORE_AFTER_2026-03-18.md`.
- [x] **UI Апдейты**:
  - На фронте добавить отображение промежуточных шагов («Агроном консультируется с Экономистом...»).
  - Настроить корректный рендер JSON структурированных аутпутов в красивые виджеты фронтенда.
  - Evidence: `apps/web/lib/stores/ai-chat-store.ts`, `apps/web/__tests__/ai-chat-store.spec.ts`, `apps/web/components/ai-chat/StructuredResultWindow.tsx`.
