# Progress Report - Prisma, Agro Domain & RAI Chat Integration

## Status: Refactoring Tenant Isolation & Fixing Type Resolution

### Completed:
1.  **Schema Refactoring**:
    *   Renamed `tenantId` to `companyId` in `AgroEventDraft` and `AgroEventCommitted` for 10/10 tenant isolation compliance.
    *   Updated models to include relations to the `Company` model.
2.  **Prisma Client Regeneration**:
    *   Regenerated Prisma Client after schema changes.
    *   Confirmed `agroEventCommitted` exists in `generated-client/index.d.ts`.
3.  **PrismaService Modernization**:
    *   Implemented a **Transparent Proxy** in `PrismaService` constructor to automatically route all model delegates through the isolated `tenantClient`.
    *   Removed 70+ manual model getters.
    *   Updated `tenantScopedModels` to include Agro Event models.
4.  **Automation & Contracts**:
    *   Added `db:client` and `postinstall` scripts to root `package.json`.
    *   Created `docs/01_ARCHITECTURE/PRISMA_CLIENT_CONTRACT.md`.
5.  **IDE Fixes**:
    *   Created root `tsconfig.json` to resolve `@nestjs/common` and package paths for files in `docs/` and other non-app directories.
    *   Added path mapping for `@nestjs/*` to `apps/api/node_modules`.

6.  **RAI Chat Integration (P0.1)** ✅:
    *   Реализован эндпоинт `POST /api/rai/chat` в API с изоляцией тенентов.
    *   Веб-чат переключен на бэкенд, моки в Next.js заменены прокси.
    *   Unit-тесты пройдены (4/4).

7.  **Agro Draft→Commit (P0.3)** ✅:
    *   Добавлен боевой модуль `apps/api/src/modules/agro-events/*` с операциями draft/fix/link/confirm/commit.
    *   Tenant isolation: `companyId` берётся из security context, не из payload.
    *   Проверка MUST-gate: `apps/api/jest.agro-events.config.js` → PASS (4/4).

8.  **Telegram Bot → Agro API (P0.4)** ✅:
    *   Бот подключён к `/api/agro-events/*`: intake text/photo/voice → draft, кнопки ✅✏️🔗, callback `ag:<action>:<draftId>`, вызовы fix/link/confirm.
    *   Unit + smoke-скрипт пройдены. Ревью APPROVED. Живой e2e не прогнан — приёмка с риском.

9.  **AgroEscalation + controller loop (P0.5)** ✅:
    *   `AgroEscalationLoopService` подключён после commit в `agro-events`; пороги S3 (delayDays≥4), S4 (delayDays≥7); идемпотентность по eventId+metricKey.
    *   Unit 7/7, tenant из committed. Ревью APPROVED. Живой интеграционный прогон не прогнан.

10. **Typed tools registry (P1.1)** ✅:
    *   `RaiToolsRegistry` (joi, register/execute), 2 инструмента (echo_message, workspace_snapshot), типизированные DTO (toolCalls, suggestedActions, widgets[].payload Record<string, unknown>).
    *   Unit 4/4 (jest direct; pnpm test 137). Ревью APPROVED.

11. **WorkspaceContext (P0.2)** ✅:
    *   Канонический контракт `workspace-context.ts` (Zod) + store + паблишеры (FarmDetailsPage, TechMap active). AiChatStore передаёт context в POST /api/rai/chat; API- ## 2026-03-03 (Session Start)
- [x] Чтение текущего состояния проекта (INDEX.md, Checklist)
- [x] Ревью готовых отчетов (S4.1) [APPROVED]
- [x] Финализация S4.1 (INDEX, Report, MB) [DONE]
- [x] Ревью и финализация S5.1 (Memory Adapter) [DONE]
- [ ] Определение следующего шага по Stage 2 Plan [PENDING]
[x] Подготовить план создания промта `implementation_plan.md`
- [x] Создать файл промта `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md`
- [x] Обновить `interagency/INDEX.md`
- [ ] Реализация и отчет S4.1 [ ]
- [ ] Уведомить пользователя
ская типизированная схема `widgets[]` v1.0 (API/Web). `RaiChatService` возвращает `DeviationList` и `TaskBacklog` виджеты. Ревью APPROVED (2026-03-02).

13. **Interagency Synchronization** ✅:
    *   Изучены и приняты к исполнению `ORCHESTRATOR PROMPT` и `STARTER PROMPT`.
    *   Установлен жесткий приоритет `interagency/` ворклоу.

14. **Agent Chat Memory (P1.3)** ✅:
    *   Решение AG-CHAT-MEMORY-001 ПРИНЯТО.
    *   Реализованы retrieve + append в RAI Chat; лимиты/timeout/fail-open, denylist секретов.
    *   Unit-тесты пройдены (5/5), изоляция проверена.

15. **Status Truth Sync (P1.4)** ✅:
    *   Решение AG-STATUS-TRUTH-001 ПРИНЯТО.
    *   Truth-sync для PROJECT_EXECUTION_CHECKLIST, FULL_PROJECT_WBS, TECHNICAL_DEVELOPMENT_PLAN.
    *   Evidence/команды проверки для P0/P1; полный проход docs/07_EXECUTION/* — backlog.
    *   Ревью APPROVED (2026-03-02).

16. **WorkspaceContext Expand (P2.1)** ✅:
    *   Решение AG-WORKSPACE-CONTEXT-EXPAND-001 ПРИНЯТО.
    *   Commerce contracts + consulting/execution/manager публикуют contract/operation refs, summaries, filters.
    *   Web-spec PASS; tenant isolation сохранён. Ревью APPROVED (2026-03-02).

17. **External Signals Advisory (P2.2)** ✅:
    *   Решение AG-EXTERNAL-SIGNALS-001 ПРИНЯТО.
    *   Реализован тонкий срез `signals -> advisory -> feedback -> memory append` в RAI Chat; explainability, feedback, episodic memory.
    *   Unit 8/8 PASS; tenant isolation сохранён. Ревью APPROVED (2026-03-02).

18. **AppShell (S1.1)** ✅:
    *   Решение AG-APP-SHELL-001 ПРИНЯТО.
    *   AppShell + LeftRaiChatDock, чат не размонтируется при навигации; история и Dock/Focus сохраняются.
    *   tsc + unit PASS; manual smoke не выполнен. Ревью APPROVED (2026-03-02).

20. **TopNav Navigation (S1.2)** ✅:
    *   Решение AG-S1-2-TOPNAV-001 ПРИНЯТО.
    *   Внедрена горизонтальная навигация (TopNav), удален Sidebar.
    *   Реализована доменная группировка меню (Урожай, CRM, Финансы, Коммерция, Настройки).
    *   Интегрирован визуальный отклик в RAI Output (авто-скролл и подсветка виджетов из мини-инбокса).
    *   Тесты Кодекса PASS (189/189). Ревью APPROVED (2026-03-03).
21. **TopNav / Role Switch Hotfix (S1.3)** ✅:
    *   Внеплановые UI-правки проведены через отдельный canonical hotfix-контур.
    *   `TopNav`: иконки вынесены в головное меню, убран дублирующий заголовок в dropdown, длинные названия нормализованы под двухстрочный перенос.
    *   `GovernanceBar`: роль оставлена только в верхней control panel, dropdown ролей переведён на устойчивое open-state без hover-gap.
    *   Верификация: `apps/web` tsc PASS, manual check PASS. Ревью APPROVED (2026-03-03).

    *   Верификация: web-spec PASS (5 suites / 11 tests), `apps/web` tsc PASS, `apps/api` controller spec PASS. Ревью APPROVED (2026-03-03).

22. **WorkspaceContext Load Rule (S2.2)** ✅:
    *   Внедрен "gatekeeper" слой в `useWorkspaceContextStore`.
    *   Реализована автоматическая обрезка (truncate) строк: title (160), subtitle (240), lastUserAction (200).
    *   Введен лимит на 10 `activeEntityRefs`, избыток отсекается.
    *   `filters` защищены от вложенных объектов (fail-safe + console.warn в dev).
    *   Верификация: юнит-тесты PASS (3/3), `apps/web` tsc PASS. Ревью APPROVED (2026-03-03).

19. **Software Factory Reinforcement** ✅:
    *   Ре-верифицированы и приняты `STARTER PROMPT` (DOC-ARH-GEN-175) и `REVIEW & FINALIZE PROMPT` (DOC-ARH-GEN-176).
    *   TECHLEAD готов к работе по канону.

### Pending / Current Issues:
*   IDE still showing red files in the screenshot despite TS Server restart.
    *   Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
    *   Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
    *   Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

23. **Chat API v1 Protocol (S3.1)** ✅:
    *   Формализован контракт `POST /api/rai/chat` (V1).
    *   `RaiChatResponseDto` расширен полями `toolCalls` (типизированный список выполненных инструментов) и `openUiToken`.
    *   Реализован возврат фактически исполненных инструментов из `RaiChatService`.
    *   Верификация: сервисные тесты PASS (проверка контракта, traceId, threadId), `apps/api` tsc PASS. Ревью APPROVED (2026-03-03).

24. **Typed Tool Calls / Forensic (S3.2)** ✅:
    *   Усилен «Закон типизированных вызовов» (LAW).
    *   Внедрено принудительное Forensic-логирование пэйлоадов всех инструментов в `RaiToolsRegistry`.
    *   Гарантировано использование `execute()` как единственного шлюза к домену.
    *   Верификация: юнит-тесты PASS (проверка логов при успехе/валидации/ошибке), `apps/api` tsc PASS. Ревью APPROVED (2026-03-03).

25. **Chat Widget Logic / Domain Bridge (S4.1)** [x]:
    *   План принят (ACCEPTED). Предстоит разделение логики- [x] S4.1 Реализация динамической логики виджетов
- [x] Ревью и финализация S4.1
.

### Pending / Current Issues:
*   IDE still showing red files in the screenshot despite TS Server restart.
*   Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
*   Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
*   Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

### Next Steps:
1.  Полный truth-sync проход по docs/07_EXECUTION/* (backlog).
145: 2.  Перейти к **3.2 Typed Tool Calls only (LAW)** — инспекция и типизация всех инструментов.
146: 
147: 26. **Software Factory Adoption Reinforcement (2026-03-03)** ✅:
148:     *   Повторно принят `ORCHESTRATOR PROMPT` (DOC-ARH-GEN-173).
149:     *   Подтверждено следование `interagency/` воркфлоу.
150:     *   Активирована языковая политика «Русский + мат».
27. **Memory Adapter Contract (S5.1)** ✅:
    *   Внедрен `MemoryAdapter` в `shared/memory`.
    *   Рефакторинг `RaiChatService` и `ExternalSignalsService` на использование адаптера.
    *   Верифицировано 10/10 тестов, изоляция тенантов сохранена.

28. **Memory Storage Canon (S5.2)** ✅:
    *   Сформирован канон хранения долговременной памяти `MEMORY_CANON.md` (AG-MEMORY-CANON-001).
    *   Определены 3 уровня (S-Tier, M-Tier, L-Tier) и принцип "Carcass + Flex".
    *   Изоляция `companyId` формально закреплена во всех слоях.

29. **Memory Schema Implementation (S5.3)** ✅:
    *   Добавлены модели `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` в Prisma.
    *   Сохранена старая модель `MemoryEntry` для обратной совместимости.
    *   Созданы DTO типы в `memory.types.ts` и соблюдена изоляция.

30. **CI/CD Stability (pnpm fix)** ✅:
    *   Устранён конфликт версий pnpm в GitHub Actions (`Multiple versions of pnpm specified`).
    *   Ворклоу переведены на авто-детект версии из `package.json`.
    *   Обновлён `pnpm/action-setup@v4`.

31. **Memory Adapter Bugfixes (S5.4)** ✅:
    *   `DefaultMemoryAdapter.appendInteraction` переведен на новую таблицу `MemoryInteraction`.
    *   `userId` прокинут из JWT через `RaiChatController` / `RaiChatService` / `ExternalSignalsService` в carcass памяти.
    *   Внедрена recursive JSON sanitization для `attrs.metadata` и `attrs.toolCalls` без обнуления всего payload.
    *   `embedding` пишется транзакционно через `create + raw vector update`; невалидные векторы отсекаются.
    *   Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.

32. **SupervisorAgent API Integration (Phase B closeout)** ✅:
    *   Создан `SupervisorAgent` как отдельный orchestration layer для `rai-chat`.
    *   `RaiChatService` превращен в thin facade над `SupervisorAgent`.
    *   Сохранены typed tools, widgets, memory, advisory и append-flow без ломки API-контракта.
    *   Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.

33. **Episodes/Profile Runtime Integration (S5.5)** ✅:
    *   `DefaultMemoryAdapter.getProfile/updateProfile` больше не заглушки и работают с `MemoryProfile`.
    *   `appendInteraction` теперь пишет компактный `MemoryEpisode` рядом с raw interaction.
    *   `SupervisorAgent` использует profile context в ответе и обновляет профиль после interaction.
    *   Верификация: `apps/api` tsc PASS, targeted jest PASS, ревью APPROVED.

34. **Memory Observability Debug Panel (S5.6)** ✅:
    *   В `RaiChatResponseDto` добавлено поле `memoryUsed`.
    *   `SupervisorAgent` возвращает безопасный summary по episode/profile context.
    *   В web chat добавлена debug-плашка `Memory Used` для привилегированного режима.
    *   Верификация: `apps/api` tsc PASS, `apps/api` targeted jest PASS, `apps/web` store test PASS.

35. **Agent-First Sprint 1 P1 — Tools Registry Domain Bridge (2026-03-03)** ✅:
    *   `RaiToolsRegistry` расширен 4 боевыми инструментами: `compute_deviations`, `compute_plan_fact`, `emit_alerts`, `generate_tech_map_draft`.
    *   Typed payload/result контракты добавлены в `rai-tools.types.ts`; `companyId` только из `RaiToolActorContext`, никогда из payload.
    *   `generate_tech_map_draft` замкнут на `TechMapService.createDraftStub()` — создаёт DRAFT с правильным tenant-scope (TODO: полная генерация — Sprint TechMap Intake).
    *   В `SupervisorAgent` добавлен `detectIntent()` — keyword routing по 4 паттернам (отклонения, kpi/план-факт, алерты, техкарта).
    *   DI: `DeviationService`, `ConsultingService`, `AgroEscalationLoopService`, `TechMapService` подключены в `RaiChatModule`.
    *   `axios` добавлен в `apps/api/package.json` (runtime-блокер `HttpResilienceModule` устранён).
    *   Верификация: `apps/api` tsc PASS, unit 14/14 PASS, smoke curl PASS. Ревью APPROVED.

36. **Agent-First Sprint 1 P2 — Tests, E2E Smoke & Telegram Linking (2026-03-03)** ✅:
    *   Прогнаны unit-тесты на все 4 tool-маршрута и `detectIntent` — 14/14 PASS.
    *   Выполнены 4 live smoke-проверки через `POST /api/rai/chat`: все 4 тула подтверждены.
    *   `generate_tech_map_draft` создал реальную запись `TechMap` в БД (`status=DRAFT`, `companyId=default-rai-company`, `crop=rapeseed`).
    *   Telegram linking cascade проверен: `telegram.update.ts` поддерживает link-patch для `AgroEventDraft`, но Telegram→`/api/rai/chat` маршрута нет — зафиксировано в backlog.
    *   `PROJECT_EXECUTION_CHECKLIST.md` обновлён с truth-sync по Sprint 1.
    *   Верификация: unit 14/14 PASS, smoke 4/4 PASS, TechMap DRAFT в БД подтверждён. Ревью APPROVED.

37. **Techmap Prompt Synthesis (2026-03-03)** ✅:
    *   Синтезирован мета-промт для создания Техкарты на основе 6 AI-отчетов.
    *   Объединены требования из `Промт_Гранд_Синтез.md` и `Промт_синтез.md`.
    *   Добавлены строгие критерии экстракции (Блоки A-H) из оригинального `Промт для исследования`, чтобы исключить "воду" и саммари.

38. **TechMap Grand Synthesis — Полный Синтез 6 AI-исследований (2026-03-03)** ✅:
    *   Прочитаны все 6 источников: ChatGPT, ChatGPT#2, CLUADE, COMET, GEMINI, GROK.
    *   Создан `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` — 770 строк, 8 частей:

39. **TM POST-A: TechMapService Consolidation + Docs (2026-03-04)** ✅:
    *   После `ACCEPTED` исполнен план `interagency/plans/2026-03-04_tm-post-a_consolidation.md`.
    *   Методы `activate` и `createNextVersion` перенесены в доменный `apps/api/src/modules/tech-map/tech-map.service.ts` без изменения сигнатур.
    *   `ConsultingModule` переведён на `TechMapModule`; локальный `apps/api/src/modules/consulting/tech-map.service.ts` удалён.
    *   В `TechMapModule` добавлены `TechMapValidator` и `UnitNormalizationService` (providers/exports) для единого сервиса.
    *   Документация TM-POST.5 обновлена: `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` + `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-services-api.tm4-tm5.md`.
        - Часть 1: Executive Summary (7 фундаментальных аксиом, консенсус всех источников)
        - Часть 2: Модель данных (15+ сущностей с JSON-схемами, enum-словари, Provenance/Confidence)
        - Часть 3: Методология расчётов (нормы высева, окна GDD, дозы удобрений, ЭПВ, AdaptiveRules, валидация)
        - Часть 4: Юридическая и операционная модель (Contract Core + Execution Layer, ChangeOrder, Evidence, DAG, матрица делегирования ИИ↔Человек)
        - Часть 5: Регионализация (3 профиля) + Экономика (бюджет, KPI, правила перерасхода)
        - Часть 6: Карта противоречий (7 конфликтов с архитектурными вердиктами)
        - Часть 7: 10 инженерных слепых зон (мульти-полевая оптимизация, склад, офлайн-режим и др.)
        - Часть 8: Мини-пример (10 операций для озимого рапса MARITIME_HUMID)
    *   Документ готов как технический базис для имплементации модуля TechMap в RAI EP.

39. **TechMap Implementation Master Checklist (2026-03-03)** ✅:
    *   Проведён полный аудит кодовой базы: найдены существующие `TechMap`, `MapStage`, `MapOperation`, `MapResource`, `ExecutionRecord`, `Field`, `Season`, `Rapeseed`, `AgronomicStrategy`, `GenerationRecord`, `DivergenceRecord`.
    *   Gap-анализ: ~60% сущностей из GRAND_SYNTHESIS покрыты, недостаёт `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone`, `Evidence`, `ChangeOrder`, `AdaptiveRule`.
    *   Создан `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` — мастер-чеклист на 5 спринтов (TM-1..TM-5) + пост-консолидация.
    *   Создана директория `docs/00_STRATEGY/TECHMAP/SPRINTS/` для промтов кодеру.

40. **TechMap Sprint TM-1 — Data Foundation CLOSED (2026-03-03)** ✅:
    *   Добавлены 4 новые Prisma-модели: `SoilProfile` (L1639), `RegionProfile` (L1666), `InputCatalog` (L1691), `CropZone` (L1712).
    *   Добавлены 5 Prisma enums: `SoilGranulometricType`, `ClimateType`, `InputType`, `OperationType`, `ApplicationMethod`.
    *   Расширены существующие модели nullable-полями: `Field` (+slope/drainage/protectedZones), `TechMap` (+budgetCap/hash/cropZoneId), `MapOperation` (+BBCH-окна/dependencies/evidenceRequired), `MapResource` (+inputCatalogId/rates/applicationMethod).
    *   Созданы Zod DTO: `apps/api/src/modules/tech-map/dto/` (4 файла + 4 spec).
    *   Верификация: `prisma validate` ✅, `db push` ✅, `tsc --noEmit` ✅, 8/8 DTO-тестов ✅.
    *   Ревью Orchestrator: APPROVED. Pre-existing failures в 8 модулях (NestJS DI) подтверждены как не scope TM-1.
    *   Decision-ID: `AG-TM-DATA-001` (DECISIONS.log).
    *   TM-2 промт создан: `interagency/prompts/2026-03-03_tm-2_dag-validation.md`.

41. **TechMap Sprint TM-2 — DAG + Validation CLOSED (2026-03-03)**:
    *   Реализованы `DAGValidationService` (DFS + CPM критический путь), `TechMapValidationEngine` (7 классов ошибок: HARD_STOP/WARNING), `TankMixCompatibilityService`.
    *   Реализованы 3 pure-function калькулятора: `SeedingRateCalculator`, `FertilizerDoseCalculator`, `GDDWindowCalculator`.
    *   Добавлены в `TechMapService`: `validateTechMap()`, `validateDAG()`, `getCalculationContext()`.
    *   Тесты: validation/ 15/15 PASS, calculators/ 9/9 PASS, tech-map/ 56/56 PASS. tsc PASS.
    *   Decision-ID: `AG-TM-DAG-002`.

42. **TechMap Sprint TM-3 — Evidence + ChangeOrder CLOSED (2026-03-03)** ✅:
    *   Добавлены Prisma-модели: `Evidence`, `ChangeOrder`, `Approval` + 5 enums.
    *   Расширены `Company`, `TechMap`, `MapOperation` relation-полями. `PrismaService` обновлён tenant-列表ом.
    *   Реализованы: `EvidenceService` (attachEvidence, validateOperationCompletion, getByOperation) и `ChangeOrderService` (5 методов с routing по ролям + $transaction).
    *   Zod DTO: evidence, change-order, approval + 6 spec.
    *   Тесты: 5 suites / 16/16 PASS. prisma validate/db push/tsc PASS.
    *   Ревью Orchestrator: APPROVED. `calculateContingency` с nullable-дефолтом, append-only через транзакции, FSM не переписан.
    *   Decision-ID: `AG-TM-EV-003`.
    *   TM-3 промт: `interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md`.

43. **TechMap Sprint TM-4 — Adaptive Rules + Regionalization CLOSED (2026-03-04)** ✅:
    *   Модели: `AdaptiveRule` (triggerType, condition/changeTemplate Json, isActive, lastEvaluatedAt), `HybridPhenologyModel` (gddToStage Json, baseTemp, companyId optional).
    *   Enums: `TriggerType` (WEATHER/NDVI/OBSERVATION/PHENOLOGY/PRICE), `TriggerOperator` (GT/GTE/LT/LTE/EQ/NOT_EQ).
    *   Сервисы: `TriggerEvaluationService` (pure `evaluateCondition` + `evaluateTriggers` + `applyTriggeredRule` → ChangeOrderService), `RegionProfileService` (3 climate profile sowing windows, suggestOperationTypes: CONTINENTAL_COLD→DESICCATION mandatory, MARITIME_HUMID→2×FUNGICIDE), `HybridPhenologyService` (GDD→BBCH prediction, tenant→global lookup).
    *   DTO: adaptive-rule, hybrid-phenology.
    *   Тесты: 17/17 адресных PASS (5 suites). Регрессия tech-map/: 22 suites / 75 tests PASS.
    *   Fix: опечатка `tecmhMap` в `tech-map.concurrency.spec.ts` исправлена.
    *   Decision-ID: `AG-TM-AR-004`.

44. **TechMap Sprint TM-5 — Economics + Contract Core CLOSED (2026-03-04)** ✅:
    *   Модель: `BudgetLine` (TechMap-scoped: techMapId, category, plannedCost, actualCost, tolerancePct). Enum: `BudgetCategory` (9 категорий).
    *   Сервисы: `TechMapBudgetService` (calculateBudget с byCategory ledger/withinCap/overCap; checkOverspend: SEEDS 5%, остальные 10% tolerance → ChangeOrderService), `TechMapKPIService` (pure `computeKPIs`: C_ha, C_t, marginPerHa, marginPct, riskAdjustedMarginPerHa, variancePct), `ContractCoreService` (generateContractCore, inline recursive `stableStringify` → SHA-256 → `TechMap.basePlanHash`, verifyIntegrity), `RecalculationEngine` (event-driven: CHANGE_ORDER_APPLIED/ACTUAL_YIELD_UPDATED/PRICE_CHANGED/TRIGGER_FIRED).
    *   DTO: budget-line, tech-map-kpi.
    *   Тесты: 20/20 адресных PASS (6 suites). Регрессия: 28 suites / 95 tests PASS.
    *   Ревью: APPROVED. `computeKPIs` pure fn, `stableStringify` recursive без внешних dep, `basePlanHash` не дублировался.
    *   Decision-ID: `AG-TM-EC-005`.

## 2026-03-04 — Оркестратор: POST-B и POST-C промты

**Действие**: Создание промтов для пост-спринтов B и C

### POST-B: Season → CropZone + Rapeseed → CropVariety
- Файл: `interagency/prompts/2026-03-04_tm-post-b_season-cropzone-cropvariety.md`
- Decision-ID: AG-TM-POST-B-006
- Статус: READY_FOR_PLAN (🔴 Высокий риск — миграция данных, обязателен pg_dump)
- Ключевые ограничения: Season.fieldId → nullable, CropZone.cropZoneId → NOT NULL для TechMap, Rapeseed модель НЕ удаляется (deprecated)

### POST-C: UI TechMap Workbench v2
- Файл: `interagency/prompts/2026-03-04_tm-post-c_ui-workbench-v2.md`
- Decision-ID: AG-TM-POST-C-007
- Статус: DONE (Завершена конфигурация UI компонентов для техкарты)

46. **TM-POST-C: UI TechMap Workbench v2 CLOSED (2026-03-04)** ✅:
    * Отчет утвержден (APPROVED).
    * Реализована DAG-визуализация без внешних библиотек (на SVG).
    * Создана EvidencePanel (UI загрузки) и ChangeOrderPanel (запросы на изменения).
    * isFrozen режим жестко отключает интерфейс по Transition-политикам.
    * TypeScript (`tsc --noEmit`), Jest (`testPathPatterns=TechMapWorkbench`) PASS.

45. **TM-POST-B: Season → CropZone + Rapeseed → CropVariety CLOSED (2026-03-04)** ✅:
    *   Модели: `Season` (fieldId nullable), `CropZone` (primary link), `CropVariety`, `CropVarietyHistory`, `CropType` enum внедрены.
    *   `TechMapService` переключен на `CropZone` как основной источник связи.
    *   Data-migration: `Rapeseed` -> `CropVariety` и `Season` -> `CropZone` выполнены (idempotent скрипты).
    *   Backup: `backups/rai_platform_20260304T114020Z.dump` создан перед DDL.
    *   Верификация: tsc PASS, prisma validate PASS, tests (34 + 95) PASS. Ревью APPROVED.

47. **AI Multi-Agent Architecture Design (2026-03-04)** ✅:
    *   Проведено глубокое исследование (Phase 1) 35+ модулей и Prisma-схемы.
    *   Создан `docs/RAI_AI_SYSTEM_RESEARCH.md` (12 секций).
    *   Создан `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` (14 секций) — мульти-агентная система с 5 специализированными агентами.
    *   Спроектированы: Tool Registry (14 тулов), 3-слойная память, 4 тира моделей, HITL-матрица, Roadmap на 3 стадии.
    *   Обновлен `memory-bank/activeContext.md`.
    *   Ревью: DONE. Готов к имплементации Stage 1.

48. **A_RAI Фаза 1 — Старт декомпозиции SupervisorAgent (2026-03-04)** [IN_PROGRESS]:
    *   Принят к исполнению `CURSOR SOFTWARE FACTORY — STARTER PROMPT.md`.
    *   Прочитаны все обязательные документы: `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`, `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `PROJECT_EXECUTION_CHECKLIST.md`.
    *   Состояние: все задачи Фаза 1-3 A_RAI открыты; все Sprint S-серии и TM-серии DONE.
    *   Определён первый шаг: IntentRouter + AgroToolsRegistry + TraceId Binding.
    *   Создан промт: `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md`.
    *   Зарегистрированы Decision-ID: AG-ARAI-F1-001, AG-ARAI-F1-002, AG-ARAI-F1-003, AG-ARAI-F1-004, AG-ARAI-F2-001, AG-ARAI-F2-002, AG-ARAI-F2-003, AG-ARAI-F3-001, AG-ARAI-F3-002, AG-ARAI-F3-003 в `DECISIONS.log`.
    *   Обновлены: `A_RAI_IMPLEMENTATION_CHECKLIST.md` (пп. 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3 → `[/]`), `interagency/INDEX.md`, `memory-bank/task.md`.
    *   Промт F1-3: `interagency/prompts/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md`.
    *   Промт F1-4 (Декомпозиция SupervisorAgent: MemoryCoordinator, AgentRuntime, ResponseComposer): `interagency/prompts/2026-03-04_a_rai-f1-4_supervisor-decomposition.md`.
    *   Промт F2-1 (Parallel Fan-Out + ToolCall Planner): `interagency/prompts/2026-03-04_a_rai-f2-1_parallel-fan-out.md`.
    *   Промт F2-2 (EconomistAgent + KnowledgeAgent): `interagency/prompts/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md`.
    *   Промт F2-3 (Eval & Quality: AgentScoreCard, GoldenTestSet): `interagency/prompts/2026-03-04_a_rai-f2-3_eval-quality.md`.
    *   Промт F3-1 (Мониторинг и автономность: MonitoringAgent, AutonomousExecutionContext): `interagency/prompts/2026-03-05_a_rai-f3-1_monitoring-agent.md`.
    *   Промт F3-2 (Политики рисков: RiskPolicyEngine, Two-Person Rule): `interagency/prompts/2026-03-05_a_rai-f3-2_risk-policy.md`.
    *   Промт F3-3 (Конфиденциальность: SensitiveDataFilter, Red-Team Suite): `interagency/prompts/2026-03-05_a_rai-f3-3_privacy-red-team.md`.
    *   Промт F4-1 (Explainability Panel): `interagency/prompts/2026-03-05_a_rai-f4-1_explainability-panel.md` [APPROVED].
    *   Промт F4-2 (TraceSummary Data Contract v1): `interagency/prompts/2026-03-05_a_rai-f4-2_tracesummary-contract.md` [APPROVED].
    *   Промт F4-3 (Evidence Tagging MVP): `interagency/prompts/2026-03-05_a_rai-f4-3_evidence-tagging.md` [APPROVED].
    *   Промт F4-4 (Truthfulness Engine BS%): `interagency/prompts/2026-03-05_a_rai-f4-4_truthfulness-engine.md` [APPROVED].
    *   Промт F4-5 (Truthfulness Panel API): `interagency/prompts/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` [APPROVED].
    *   Промт F4-6 (Drift Alerts): `interagency/prompts/2026-03-05_a_rai-f4-6_drift-alerts.md` (добавлено в индекс).

