# PLAN — S3.2 Typed Tool Calls only
Дата: 2026-03-03  
Статус: ACCEPTED (by TECHLEAD)  
Промпт-источник: `interagency/prompts/2026-03-03_s3-2_typed-tool-calls.md`  
Чеклист-источник: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (п. 3.2)  
Decision-ID: AG-FORENSIC-AUDIT-001

## Результат
- `RaiToolsRegistry` будет усилен как единственный типизированный шлюз вызова инструментов.
- Forensic-логирование будет включать payload каждого tool call как при успехе, так и при провале валидации/исполнения.
- Появится тестовое доказательство, что payload реально попадает в `Logger.log`/`Logger.warn`, а обход типизированного `execute(...)` не появился.

## Границы
- Входит: изменения в `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`, при необходимости минимальная правка `rai-chat.service.ts` только для подтверждения, что домен ходит через `execute(...)`.
- Входит: forensic hardening логов, audit текущего public surface реестра, тесты и `tsc` для `apps/api`.
- Не входит: изменение бизнес-логики самих инструментов `echo_message` и `workspace_snapshot`.
- Не входит: изменение `workspaceContext`, `companyId` flow, новых инструментов, новых endpoint'ов или `any` в публичных сигнатурах.

## Риски
- Есть риск утечки или роста шума в логах, если payload логировать без контроля сериализации; нужно логировать детерминированный JSON и не сломать существующий формат forensic-анализа.
- Есть риск ложного “запрета обхода”, если проверка ограничится только `rai-chat.service.ts`, но оставит иной публичный способ дернуть handler/schema напрямую.
- Есть риск сломать существующие тесты `rai-tools.registry.spec.ts`, если формат логов изменится без обновления assertions.

## План работ
- [ ] Перечитать `RaiToolsRegistry` и подтвердить текущий public surface: какие методы доступны извне и есть ли хоть один путь вызова инструмента кроме `execute(...)`.
- [ ] Обновить `logToolCall(...)`, чтобы он всегда принимал и логировал сериализованный payload:
  - на success,
  - на validation failure,
  - на handler failure.
- [ ] Убедиться, что в forensic JSON сохраняются `toolName`, `companyId`, `traceId`, `status`, `reason`, `payload`.
- [ ] Проверить, что `execute(...)` остаётся единственным публичным шлюзом исполнения инструмента с Joi-валидацией; если есть лишние публичные методы/дырки обхода, закрыть их без изменения бизнес-логики инструментов.
- [ ] Обновить `rai-tools.registry.spec.ts`:
  - тест на success-log с payload,
  - тест на validation failure log с исходным невалидным payload,
  - при необходимости тест на handler failure log с payload.
- [ ] Прогнать `jest` по `rai-tools.registry.spec.ts` и `tsc` для `apps/api`.
- [ ] Подготовить review packet: отчёт, `git status`, ключевой `git diff`, логи прогонов, статус `READY_FOR_REVIEW` в `interagency/INDEX.md`.

## DoD
- [ ] `RaiToolsRegistry` логирует payload всех tool calls при успехе и провале.
- [ ] Публичный путь вызова инструмента остаётся только через типизированный `execute(...)`.
- [ ] `rai-tools.registry.spec.ts` подтверждает forensic-логирование payload.
- [ ] `apps/api` проходит `tsc`.
- [ ] Для задачи собран review packet по канону.
