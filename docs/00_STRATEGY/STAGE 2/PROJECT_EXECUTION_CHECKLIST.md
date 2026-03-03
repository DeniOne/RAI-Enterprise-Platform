# RAI_EP — Чеклист доведения “недоделок” до дееспособного состояния (приоритетный)
Дата: 2026-03-01  
Назначение: превратить “LAW/планы/моки” в работающий тонкий срез Agent OS + Agro runtime.

## Как пользоваться этим чеклистом (важно)
- **Правило 1:** сначала закрываем P0 так, чтобы оно реально работало end-to-end.  
- **Правило 2:** “готово” = есть **доказательство**: endpoint/модуль + тест/прогон + отсутствие хардкода `companyId` из payload.  
- **Правило 3:** запрещено делать UI-полировку, пока агентный backend и Agro Draft→Commit не боевые.

## Truth-sync статус (P1.4, срез P0/P1)
- `P0.1` — `VERIFIED`: код `apps/api/src/modules/rai-chat/*`, `apps/web/lib/stores/ai-chat-store.ts`, отчёт `interagency/reports/2026-03-01_p0-1_api-rai-chat.md`; ограничение: manual web-check не зафиксирован.
- `P0.2` — `VERIFIED`: код `apps/web/lib/stores/workspace-context-store.ts`, `apps/web/components/party-assets/farms/FarmDetailsPage.tsx`, `apps/web/app/consulting/techmaps/active/page.tsx`, отчёт `interagency/reports/2026-03-01_p0-2_workspace-context-report.md`.
- `P0.3` — `VERIFIED`: код `apps/api/src/modules/agro-events/*`, отчёт `interagency/reports/2026-03-01_p0-3_agro-telegram-draft-commit.md`; тест через `jest.agro-events.config.js`, не через общий runner.
- `P0.4` — `VERIFIED`: код `apps/telegram-bot/src/telegram/telegram.update.spec.ts`, отчёт `interagency/reports/2026-03-01_p0-4_telegram-bot-draft-commit.md`.
- `P0.5` — `VERIFIED`: код `apps/api/src/modules/agro-events/agro-escalation-loop.service.ts`, отчёт `interagency/reports/2026-03-01_p0-5_agro-escalation-controller-loop.md`; ограничение: нет живого HTTP/DB smoke.
- `P1.1` — `VERIFIED`: код `apps/api/src/modules/rai-chat/tools/*`, отчёт `interagency/reports/2026-03-01_p1-1_typed-tools-registry.md`; ограничение: `pnpm --filter api test` падал `137`, факт подтверждён прямым `jest`.
- `P1.2` — `VERIFIED`: код `apps/api/src/modules/rai-chat/widgets/*`, `apps/web/components/ai-chat/AiChatWidgetsRail.tsx`, отчёт `interagency/reports/2026-03-01_p1-2_widgets-schema-renderer.md`; ограничение: без browser screenshot/manual UI capture.
- `P1.3` — `VERIFIED`: код `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`, отчёт `interagency/reports/2026-03-02_p1-3_agent-chat-memory.md`.
- `P1.4` — `VERIFIED`: truth-sync среза P0/P1 выполнен; отчёт `interagency/reports/2026-03-02_p1-4_status-truth-sync.md`.
- `P2.1` — `VERIFIED`: Commerce contracts + consulting/execution/manager; отчёт `interagency/reports/2026-03-02_p2-1_workspacecontext-expand.md`; ограничение: нет browser smoke.
- `S1.1` — `VERIFIED`: AppShell + LeftRaiChatDock, чат не размонтируется при навигации; код `apps/web/components/layouts/AppShell.tsx`, `apps/web/components/ai-chat/LeftRaiChatDock.tsx`, `apps/web/lib/stores/ai-chat-store.ts`; отчёт `interagency/reports/2026-03-02_s1-1_app-shell-persistent-rai-chat.md`; ограничение: manual smoke не выполнен.
- `S1.2` — `VERIFIED`: TopNav навигация, удаление Sidebar; отчёт `interagency/reports/2026-03-02_s1-2_topnav-navigation.md`; тесты PASS (189/189).

## P0 — Блокирующие (без этого “система как задумано” не существует)

### P0.1 Убрать мок веб-чата и завести канонический chat endpoint в `apps/api`
- [x] **Цель:** web-чат перестаёт быть игрушкой Next-роута и становится шлюзом к агентам.
- [x] **DoD:** в `apps/api` есть endpoint (канонический) принимающий `message + workspaceContext` и возвращающий `text + widgets[] (+ toolCalls/debug)`. В `apps/web` запросы идут туда, а `apps/web/app/api/ai-chat/route.ts` не является источником истины.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/rai-chat/rai-chat.controller.ts`, `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts`, `interagency/reports/2026-03-01_p0-1_api-rai-chat.md`
- **Как проверить:** `cd apps/api && npx jest --runInBand test/modules/rai-chat/rai-chat.controller.spec.ts`
- [ ] **Мини-порядок работ:**
  - [x] определить канонический путь (по спеке): `POST /api/rai/chat`
  - [x] сделать минимальную реализацию “эхо + 1 виджет” (без LLM) в `apps/api`
  - [x] переключить web-чат на этот endpoint
  - [x] добавить минимальный контрактный тест на форму ответа (схема/типизация)

### P0.2 Канонический `WorkspaceContext` (не только route)
- [x] **Цель:** агент реально “видит” рабочую область, а не угадывает по URL.
- [x] **DoD:** есть единый тип/схема `WorkspaceContext`; ключевые страницы (минимум: CRM, TechMap) публикуют `activeEntityRefs` и краткие summary; в чат уходит **только refs + summaries**, без тяжёлых данных.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/web/lib/stores/workspace-context-store.ts`, `apps/web/components/party-assets/farms/FarmDetailsPage.tsx`, `apps/web/app/consulting/techmaps/active/page.tsx`, `interagency/reports/2026-03-01_p0-2_workspace-context-report.md`
- [x] **Мини-порядок работ:**
  - [x] зафиксировать минимальный контракт (`route`, `activeEntityRefs`, `filters`, `selectedRowSummary`, `lastUserAction`)
  - [x] внедрить store/паблишер на страницах CRM/TechMap
  - [x] включить передачу контекста в каждый запрос чата

### P0.3 Реальный Agro Telegram Draft→Fix/Link→Confirm→Commit в `apps/api` (не “код-спека в docs”)
- [x] **Цель:** Telegram становится “терминалом поля” по закону Draft→Commit.
- [x] **DoD:** в `apps/api` существует боевой модуль, который:
  - создаёт `AgroEventDraft` (TTL, missingMust),
  - поддерживает `fix/link/confirm`,
  - коммитит `AgroEventCommitted` с `provenanceHash`,
  - не принимает `companyId` из payload (только из контекста),
  - имеет unit-тесты на MUST-gate.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/agro-events/*`, `apps/api/jest.agro-events.config.js`, `interagency/reports/2026-03-01_p0-3_agro-telegram-draft-commit.md`
- **Как проверить:** `cd apps/api && node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand`
- [x] **Мини-порядок работ:**
  - [x] перенести реализацию из `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` в реальный модуль `apps/api/src/modules/agro-events/*` (или иной канонический доменный модуль)
  - [x] подключить модуль в `AppModule`
  - [x] покрыть тестами: confirm без MUST → блок; link → READY; confirm → committed

### P0.4 Подключить `apps/telegram-bot` к Draft→Commit (и прекратить раздвоение телеграм-контуров)
- [x] **Цель:** один канонический телеграм-поток, который всегда пишет Draft и требует ✅.
- [x] **DoD:** бот создаёт draft при входе (text/voice/photo), возвращает пользователю короткий ответ + кнопки ✅✏️🔗 с `draftId`, и вызывает `fix/link/confirm` по нажатию.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/telegram-bot/src/telegram/telegram.update.spec.ts`, `interagency/reports/2026-03-01_p0-4_telegram-bot-draft-commit.md`
- [x] **Мини-порядок работ:**
  - [x] выбрать канонический телеграм-контур: `apps/telegram-bot` (транспорт) + API домена в `apps/api`
  - [x] оформить payload кнопок (callback data) так, чтобы всегда нести `draftId`
  - [x] добавить тест/прогон сценария: “фото+текст → draft → link → confirm → committed”

### P0.5 Верифицировать (или реально подключить) `AgroEscalation` + controller loop
- [x] **Цель:** "план/факт → severity → эскалация" не на бумаге, а в БД.
- [x] **DoD:** есть сервис, который при коммите событий создаёт `AgroEscalation` при пороге S3/S4, и это покрыто тестом.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/agro-events/agro-escalation-loop.service.ts`, `apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts`, `interagency/reports/2026-03-01_p0-5_agro-escalation-controller-loop.md`
- **Как проверить:** `cd apps/api && node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand`
- [x] **Мини-порядок работ:**
  - [x] найти текущую реализацию в `apps/api` (если есть) и связать с `AgroEventCommitted`
  - [x] если нет — реализовать минимально: metricKey=`operationDelayDays` → запись в `agro_escalations`
  - [x] тест: delay=4 → S3 → escalation создана

## P1 — Усилители (делают Agent OS полезным, но не заменяют P0)

### P1.1 Typed tools registry (реестр инструментов) + строгие схемы вызовов
- [x] **Цель:** “typed tool calls only” становится реальностью, а не лозунгом.
- [x] **DoD:** tool-call payload’ы валидируются схемами; все вызовы логируются; запрещены “any[]” в критичном контуре.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`, `interagency/reports/2026-03-01_p1-1_typed-tools-registry.md`
- **Как проверить:** `cd apps/api && npx jest --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts`

### P1.2 Виджеты справа: канонический `widgets[]` schema + renderer
- [x] **Цель:** агент выдаёт структурный UI-вывод (не только текст).
- [x] **DoD:** `widgets[]` версионируемы; минимум 2 виджета работают end-to-end (например: DeviationList, TaskBacklog) из ответа `/api/rai/chat`.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/rai-chat/widgets/rai-chat-widgets.types.ts`, `apps/web/components/ai-chat/AiChatWidgetsRail.tsx`, `apps/web/__tests__/ai-chat-widgets-rail.spec.tsx`, `interagency/reports/2026-03-01_p1-2_widgets-schema-renderer.md`
- **Как проверить:** `cd apps/api && npx jest --runInBand src/modules/rai-chat/rai-chat.service.spec.ts`; `cd apps/web && npx jest --runInBand __tests__/ai-chat-widgets-rail.spec.tsx`

### P1.3 Память в агентном чате (retrieve + append)
- [x] **Цель:** память перестаёт быть “инфрой без потребителя”.
- [x] **DoD:** при запросе чата выполняется recall (scoped по `companyId`), после ответа — append/store по политике; есть метрики/лимиты (top-K, minSimilarity).
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`, `apps/api/src/shared/memory/rai-chat-memory.config.ts`, `interagency/reports/2026-03-02_p1-3_agent-chat-memory.md`
- **Как проверить:** `cd apps/api && npx jest --runInBand src/modules/rai-chat/rai-chat.service.spec.ts`

### P1.4 “Правда о статусе” (синхронизация чеклистов/доков)
План для P2.3 создан: 2026-03-02_p2-3_ux-polish-dock-focus.md. Индекс обновлён: INDEX.md.- [x] **Цель:** прекратить самообман “COMPLETE ✅” без кода.
- [x] **DoD:** документы в `docs/07_EXECUTION/*` отражают реальную картину; где SPEC-ONLY — так и написано.
- **Статус truth-sync:** `VERIFIED` (срез P0/P1); полный проход docs/07_EXECUTION/* — backlog.
- **Доказательство:** `interagency/reports/2026-03-02_p1-4_status-truth-sync.md`

## P2 — Полировка и расширение (после P0/P1)

### P2.1 Расширение WorkspaceContext на остальные страницы
- [x] **DoD:** CRM/TechMap/Operations/Commerce дают корректные refs и summaries.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/web/app/(app)/commerce/contracts/page.tsx`, `apps/web/app/consulting/execution/manager/page.tsx`, `interagency/reports/2026-03-02_p2-1_workspacecontext-expand.md`
- **Как проверить:** `cd apps/web && npx jest --runInBand shared/contracts/commerce-contracts-page.spec.tsx shared/contracts/execution-manager-workspace-context.spec.tsx`

### P2.2 Интеграция NDVI/погоды/внешних сигналов в controller/advisory
- [x] **DoD:** signals → advisory → объяснение → user feedback → episodic memory formation.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`, `apps/api/src/modules/rai-chat/external-signals.service.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `interagency/reports/2026-03-02_p2-2_external-signals-advisory.md`
- **Как проверить:** `cd apps/api && pnpm test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts src/modules/rai-chat/external-signals.service.spec.ts`

### P2.3 UX шлифовка (Dock/Focus, клавиши, стабильность)
- [x] **DoD:** без регрессий; минимальный UX-долг; нет “тяжёлых” анимаций, влияющих на работу.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/web/lib/stores/ai-chat-store.ts`, `apps/web/components/ai-chat/AiChatPanel.tsx`, `apps/web/components/ai-chat/AiChatWidgetsRail.tsx`, `interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md`
- **Как проверить:** `cd apps/web && pnpm test -- --runInBand __tests__/ai-chat-widgets-rail.spec.tsx __tests__/ai-chat-store.spec.ts && pnpm exec tsc -p tsconfig.json --noEmit`

### S1.1 AppShell (персистентный чат)
- [x] **DoD:** чат живёт в Shell, не размонтируется при навигации; история и Dock/Focus сохраняются.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/web/components/layouts/AppShell.tsx`, `apps/web/components/ai-chat/LeftRaiChatDock.tsx`, `apps/web/lib/stores/ai-chat-store.ts`, `interagency/reports/2026-03-02_s1-1_app-shell-persistent-rai-chat.md`
- **Как проверить:** `cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit && pnpm test -- --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-chat-widgets-rail.spec.tsx`
- **Ограничение:** manual smoke не выполнен.

### S1.2 TopNav (горизонтальная навигация)
- [x] **DoD:** меню перенесено в TopNav, Sidebar удален, поддержка active route и dropdowns.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** `apps/web/components/ui/TopNav.tsx`, `apps/web/components/layouts/AppShell.tsx`, `interagency/reports/2026-03-02_s1-2_topnav-navigation.md`
- **Как проверить:** запустить `pnpm build` (tsc завершается успешно), проверить визуально наличие TopNav и отсутствие Sidebar.

### S1.3 LeftRaiChatDock (Docked/Focus)
- [x] **DoD:** Docked (360px) и Focus (560px) режимы работают; персистентность в localStorage; кнопки в хедере присутствуют.
- **Статус truth-sync:** `VERIFIED` (реализовано в рамках P2.3)
- **Доказательство:** [AiChatPanel.tsx](file:///root/RAI_EP/apps/web/components/ai-chat/AiChatPanel.tsx), [ai-chat-store.ts](file:///root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts), отчет [2026-03-02_p2-3_ux-polish-dock-focus.md](file:///root/RAI_EP/interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md)

### S2.1 WorkspaceContext Contract
- [x] **DoD:** route lifecycle обеспечивается через `setRouteAndReset`; `Yield/KPI` страница публикует контекст; чат отправляет контекст в API.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [workspace-context-store.ts](file:///root/RAI_EP/apps/web/lib/stores/workspace-context-store.ts), [yield/page.tsx](file:///root/RAI_EP/apps/web/app/consulting/yield/page.tsx), отчет [2026-03-03_s2-1_workspace-context-contract.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s2-1_workspace-context-contract.md)

### S2.2 WorkspaceContext Load Rule
- [x] **DoD:** автоматическая обрезка (truncate) строк; блокировка вложенных объектов в filters; лимит на 10 activeEntityRefs; fail-safe в store.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [workspace-context-store.ts](file:///root/RAI_EP/apps/web/lib/stores/workspace-context-store.ts), [workspace-context-load-rule.spec.ts](file:///root/RAI_EP/apps/web/__tests__/workspace-context-load-rule.spec.ts), отчет [2026-03-03_s2-2_workspace-context-load-rule.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s2-2_workspace-context-load-rule.md)

### S3.1 Chat API v1 (Formal Contract)
- [x] **DoD:** `RaiChatResponseDto` содержит `toolCalls` и `openUiToken`; сервис возвращает исполненные инстументы; тесты на контракт PASS.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [rai-chat.dto.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts), [rai-chat.service.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.ts), отчет [2026-03-03_s3-1_chat-api-v1.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s3-1_chat-api-v1.md)

### S4.1 Chat Widget Logic (Domain Bridge)
- [x] **DoD:** `RaiChatService` больше не содержит статики; выделен `RaiChatWidgetBuilder`; виджеты динамически зависят от `route` и `companyId`; тесты PASS.
- **Статус truth-sync:** `VERIFIED`
- **Доказательство:** [rai-chat-widget-builder.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts), [rai-chat.service.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.ts), отчет [2026-03-03_s4-1_chat-widget-logic.md](file:///root/RAI_EP/interagency/reports/2026-03-03_s4-1_chat-widget-logic.md)

## Рекомендуемый “тонкий срез”
, который доказывает, что система ожила
Сценарий: **Telegram фото+текст → Draft (missingMust) → 🔗 Link field → ✅ Confirm → CommittedEvent → Controller severity → (если S3) AgroEscalation → web-чат показывает виджет DeviationList**.
