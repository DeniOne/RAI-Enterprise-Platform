# REPORT — A_RAI Фаза 1.1: IntentRouter + AgroToolsRegistry + TraceId Binding
Дата: 2026-03-04  
Статус: final  
Промпт: `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md`  
Decision-ID: AG-ARAI-F1-001

## Что было целью
Реализовать три пункта Фазы 1 A_RAI: (1) IntentRouter — вынести классификацию из SupervisorAgent в отдельный сервис; (2) AgroToolsRegistry — выделить агро-инструменты из RaiToolsRegistry с делегированием; (3) TraceId Binding — запись в AiAuditEntry после каждого ответа чата.

## Что сделано (факты)
- **IntentRouterService:** создан `intent-router.service.ts` и `intent-router.types.ts`. Методы `classify(message, workspaceContext)` → IntentClassification и `buildAutoToolCall(message, request, classification?)` → RaiToolCall | null. Логика детерминированная (regex), LLM-ready.
- **SupervisorAgent:** удалены `detectIntent()` и `buildAutoToolCall()`; инжектированы IntentRouterService и PrismaService; вызов `intentRouter.classify()` и `intentRouter.buildAutoToolCall()`; после формирования response — fire-and-forget `writeAiAuditEntry({ companyId, traceId, toolNames, intentMethod })`.
- **AgroToolsRegistry:** создан `agro-tools.registry.ts` с регистрацией только `ComputeDeviations` и `GenerateTechMapDraft`; интерфейс `register()`, `has()`, `execute()`. RaiToolsRegistry при `execute()` для этих имён делегирует в AgroToolsRegistry; из registerBuiltInTools удалены оба инструмента.
- **AiAuditEntry:** в schema.prisma добавлена модель с полями id, traceId, companyId, toolNames (String[]), model, intentMethod, tokensUsed, createdAt; в Company добавлена связь aiAuditEntries.
- **Модуль:** в RaiChatModule добавлены провайдеры IntentRouterService и AgroToolsRegistry.
- **Тесты:** supervisor-agent.service.spec — добавлены моки IntentRouter и PrismaService (aiAuditEntry.create), вызов AgroToolsRegistry.onModuleInit(); для авто-интентов подставлены buildAutoToolCall/classify. rai-tools.registry.spec — добавлен реальный AgroToolsRegistry в createRegistry(). Новые: intent-router.service.spec.ts (8 кейсов), agro-tools.registry.spec.ts (4 кейса).

## Изменённые файлы
- **Новые:**  
  `apps/api/src/modules/rai-chat/intent-router/intent-router.service.ts`  
  `apps/api/src/modules/rai-chat/intent-router/intent-router.types.ts`  
  `apps/api/src/modules/rai-chat/intent-router/intent-router.service.spec.ts`  
  `apps/api/src/modules/rai-chat/tools/agro-tools.registry.ts`  
  `apps/api/src/modules/rai-chat/tools/agro-tools.registry.spec.ts`
- **Изменённые:**  
  `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`  
  `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`  
  `apps/api/src/modules/rai-chat/rai-chat.module.ts`  
  `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`  
  `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`  
  `packages/prisma-client/schema.prisma` (модель AiAuditEntry + связь в Company)

## Проверки/прогоны
- `cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit` — **PASS**
- `pnpm test -- --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts` — **6/6 PASS**
- `pnpm test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts` — **PASS**
- `pnpm test -- --runInBand src/modules/rai-chat/intent-router/intent-router.service.spec.ts` — **8/8 PASS**
- `pnpm test -- --runInBand src/modules/rai-chat/tools/agro-tools.registry.spec.ts` — **4/4 PASS**
- `packages/prisma-client`: `DATABASE_URL=postgresql://x/x pnpm exec prisma validate` — **PASS**

## Что сломалось / что не получилось
- Не запускались: полный `--testPathPattern="src/modules/rai-chat"` (external-signals.service.spec.ts падает из-за отсутствия MEMORY_ADAPTER в тестовом модуле — не в scope F1-1). Остальные тесты rai-chat по supervisor/tools/intent-router/agro — проходят.
- db push не выполнялся (нет доступа к БД в среде); для продакшена после выката нужно выполнить миграцию/ push для таблицы ai_audit_entries.

## Следующий шаг
- Ревью от TECHLEAD (Antigravity). После APPROVED — при необходимости db push / миграция на окружении.
- Smoke: после поднятия API выполнить POST /api/rai/chat и проверить наличие записи в AiAuditEntry с traceId из ответа.
