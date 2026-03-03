# PLAN — Phase B: SupervisorAgent -> API Integration
Дата: 2026-03-03
Статус: active

## Результат
- В `apps/api` появляется минимальная интеграция `SupervisorAgent` как orchestration layer для `RAI Chat`.
- `RaiChatService` перестает быть точкой прямой сборки ответа и делегирует orchestration в `SupervisorAgent`.
- Контур остается типизированным, tenant-safe и совместимым с уже внедренными widgets/toolCalls/memory.

## Основание
- `docs/00_STRATEGY/STAGE 2/SPEC_AGENT_FIRST_RAI_EP.md` -> `2.1 SupervisorAgent (Orchestrator)`
- `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` -> незакрытый пункт `Подключить SupervisorAgent к API`

## Границы
- Входит: минимальный runtime-layer `SupervisorAgent` внутри API-контура `rai-chat`.
- Входит: orchestration поверх существующих typed tools, widgets и memory adapter.
- Входит: тесты на wiring и сохранение текущего контракта `POST /api/rai/chat`.
- Не входит: полноценная мультиагентная система с отдельными `A_RAI-agronom` / `A_RAI-controller`.
- Не входит: quorum/tech council, сложный routing по ролям и risk classes beyond MVP.

## Минимальный MVP SupervisorAgent
- `SupervisorAgent` принимает:
  - `message`
  - `workspaceContext`
  - `companyId`
  - `traceId`
  - `userId?`
- `SupervisorAgent` делает:
  - orchestration recall/tool execution/widget building
  - формирование финального `RaiChatResponseDto`
  - сохранение совместимости с текущими `suggestedActions`, `toolCalls`, `widgets`, `traceId`, `threadId`
- `SupervisorAgent` не делает на этом шаге:
  - sub-agent routing в несколько runtime-агентов
  - автономные governance-escalation workflows

## Риски
- Легко сделать “переименование без архитектуры”, если просто обернуть текущий код без явного orchestration contract.
- Возможен регресс API-контракта `rai-chat`, если логика ответа расползется между сервисами.
- Возможен конфликт с принципом `Service = IO / Orchestrator = Brain`, если responsibility split не будет явно закреплен.

## План работ
- [ ] Проверить admission и зафиксировать отдельный prompt для реализации `SupervisorAgent`.
- [ ] Выделить orchestration contract: вход, выход, actor context, memory/tool/widget dependencies.
- [ ] Создать `SupervisorAgent`/`supervisor-agent.service.ts` в модуле `rai-chat`.
- [ ] Перенести orchestration-логику из `RaiChatService` в `SupervisorAgent`, оставив `RaiChatService` тонким application facade или адаптером endpoint-level.
- [ ] Сохранить current typed flow: `retrieve -> tool calls -> external signals -> widgets -> appendInteraction`.
- [ ] Сохранить tenant isolation: `companyId` только из trusted context, `userId` только из auth context.
- [ ] Обновить unit tests для `RaiChatService` и добавить tests для `SupervisorAgent`.
- [ ] После реализации сделать truth-sync и закрыть последний хвост `Phase B`.

## Критерии приемки
- [ ] `SupervisorAgent` существует как отдельный orchestration слой в API.
- [ ] `POST /api/rai/chat` использует `SupervisorAgent` в runtime.
- [ ] Контракт ответа не сломан: `text`, `widgets`, `toolCalls`, `traceId`, `threadId`, `suggestedActions`.
- [ ] Тесты `rai-chat` проходят.
- [ ] После truth-sync `Phase B` может быть закрыта полностью.

## Артефакты на ревью
- `interagency/prompts/2026-03-03_s2-c_supervisor-agent-api-integration.md`
- `interagency/plans/2026-03-03_s2-c_supervisor-agent-api-integration.md`
