# STAGE 2 — Truth Sync по ключевым claims

Дата: 2026-03-05  
Назначение: свести ключевые claims из `docs/00_STRATEGY/STAGE 2` к формату `claim -> doc -> code evidence -> verdict` без самообмана.

## Легенда

- `CONFIRMED` — claim реально подтверждается кодом.
- `PARTIAL` — claim есть, но урезан, не полностью wired или заметно слабее, чем продают доки.
- `PROCESS_ONLY` — это больше процесс/регламент, чем реально исполняемый runtime-механизм.
- `STALE` — документ отстал от текущего кода.
- `MISSING` — claim в доках есть, а в коде как целостной реализации не найден.

## Runtime и Agent OS

| Claim | Doc | Code evidence | Verdict |
|---|---|---|---|
| Персистентный Agent OS shell: чат живёт в оболочке и не размонтируется при навигации | `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, `PROJECT_EXECUTION_CHECKLIST.md` | `apps/web/components/layouts/AppShell.tsx`, `apps/web/components/ai-chat/LeftRaiChatDock.tsx`, `apps/web/app/(app)/layout.tsx`, `apps/web/lib/stores/ai-chat-store.ts` | `CONFIRMED` |
| Горизонтальная навигация `TopNav` заменила sidebar | `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, `PROJECT_EXECUTION_CHECKLIST.md` | `apps/web/components/navigation/TopNav.tsx`, `apps/web/components/layouts/AppShell.tsx` | `CONFIRMED` |
| Канонический `WorkspaceContext` с refs/summaries, а не только route | `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, `PROJECT_EXECUTION_CHECKLIST.md` | `apps/web/shared/contracts/workspace-context.ts`, `apps/web/lib/stores/workspace-context-store.ts`, `apps/web/components/ai-chat/AiChatRoot.tsx`, `apps/web/app/consulting/techmaps/active/page.tsx`, `apps/web/app/(app)/commerce/contracts/page.tsx`, `apps/web/app/consulting/execution/manager/page.tsx` | `CONFIRMED` |
| Канонический чатовый endpoint `POST /api/rai/chat` в `apps/api` | `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, `PROJECT_EXECUTION_CHECKLIST.md` | `apps/api/src/modules/rai-chat/rai-chat.controller.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `apps/api/src/modules/rai-chat/rai-chat.module.ts` | `CONFIRMED` |
| `MemoryAdapter` введён как обязательный слой и реально подключён | `RAI_AI_SYSTEM_RESEARCH.md`, `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, `RAI_EP — Agent-First Sprint 1 Spec (v1).md` | `apps/api/src/shared/memory/memory-adapter.interface.ts`, `apps/api/src/shared/memory/default-memory-adapter.service.ts`, `apps/api/src/shared/memory/memory.module.ts`, `apps/api/src/modules/rai-chat/memory/memory-coordinator.service.ts` | `CONFIRMED` |
| `Supervisor` декомпозирован на `IntentRouter`, `MemoryCoordinator`, `AgentRuntime`, `ResponseComposer` | `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `apps/api/src/modules/rai-chat/intent-router/intent-router.service.ts`, `apps/api/src/modules/rai-chat/memory/memory-coordinator.service.ts`, `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`, `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` | `CONFIRMED` |
| `BudgetController` — полноценный governor токенов и деградации в основном runtime-потоке | `RAI_AI_SYSTEM_ARCHITECTURE.md`, `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md` | `apps/api/src/modules/rai-chat/security/budget-controller.service.ts`, `apps/api/src/modules/rai-chat/security/budget-controller.service.spec.ts`, `apps/api/src/modules/rai-chat/rai-chat.module.ts` | `PARTIAL` |
| Parallel fan-out — дефолтная параллельная оркестрация агентов/тулов | `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`, `apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts`, `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` | `CONFIRMED` |
| Tool-gated доступ через доменные registry вместо прямого лаза в БД | `RAI_AI_SYSTEM_ARCHITECTURE.md` | `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/agro-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/finance-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/risk-tools.registry.ts`, `apps/api/src/modules/rai-chat/tools/knowledge-tools.registry.ts` | `CONFIRMED` |
| `PROJECT_REALITY_MAP`: в веб-чате есть только route, канонического `WorkspaceContext` не видно | `PROJECT_REALITY_MAP.md` | `apps/web/lib/stores/workspace-context-store.ts`, `apps/web/shared/contracts/workspace-context.ts`, `apps/web/app/consulting/techmaps/active/page.tsx`, `apps/web/app/(app)/commerce/contracts/page.tsx` | `STALE` |

## Память, безопасность и агро-контур

| Claim | Doc | Code evidence | Verdict |
|---|---|---|---|
| Tenant isolation: `companyId` enforce на каждом уровне | `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`, `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` | `apps/api/src/shared/prisma/prisma.service.ts`, `apps/api/src/shared/tenant-context/tenant-context.service.ts`, `apps/api/src/shared/tenant-context/tenant-context.interceptor.ts`, `apps/api/src/shared/tenant-context/tenant-scope.ts` | `CONFIRMED` |
| Память реально tenant/user scoped и идёт через adapter | `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`, `RAI_AI_SYSTEM_RESEARCH.md` | `apps/api/src/shared/memory/default-memory-adapter.service.ts`, `apps/api/src/shared/memory/memory-adapter.spec.ts`, `apps/api/src/modules/rai-chat/memory/memory-coordinator.service.ts` | `CONFIRMED` |
| Telegram / agro flow: `Draft -> Link/Fix -> Confirm -> Commit` реально боевой | `PROJECT_EXECUTION_CHECKLIST.md`, `RAI_EP — Agent-First Sprint 1 Spec (v1).md` | `apps/api/src/modules/agro-events/agro-events.controller.ts`, `apps/api/src/modules/agro-events/agro-events.service.ts`, `apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts`, `apps/api/src/modules/agro-events/dto/agro-events.dto.ts`, `apps/telegram-bot/src/telegram/telegram.update.ts` | `CONFIRMED` |
| `AgroEscalationLoopService` создаёт эскалации после коммита событий | `PROJECT_EXECUTION_CHECKLIST.md`, `RAI_AI_SYSTEM_RESEARCH.md`, `RAI_EP — Agent-First Sprint 1 Spec (v1).md` | `apps/api/src/modules/agro-events/agro-escalation-loop.service.ts`, `apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts`, `apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts` | `CONFIRMED` |
| Telegram-бот реально подключён к draft/confirm/link циклу | `PROJECT_EXECUTION_CHECKLIST.md` | `apps/telegram-bot/src/telegram/telegram.update.ts`, `apps/telegram-bot/src/shared/api-client/api-client.service.ts`, `apps/telegram-bot/src/telegram/telegram.update.spec.ts` | `CONFIRMED` |
| MUST-gate и полный `fix`-цикл надёжно закрыты отдельными явными тестами | `PROJECT_EXECUTION_CHECKLIST.md` | `apps/api/src/modules/agro-events/agro-events.orchestrator.service.spec.ts`, `apps/api/src/modules/agro-events/agro-events.validator.ts`, `apps/telegram-bot/src/telegram/telegram.update.spec.ts` | `PARTIAL` |
| Output PII filter встроен в ответный контур и умеет логировать инциденты | `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.ts`, `apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.spec.ts`, `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`, `apps/api/src/modules/rai-chat/incident-ops.service.ts` | `CONFIRMED` |

## Observability, quality, evolution и registry

| Claim | Doc | Code evidence | Verdict |
|---|---|---|---|
| Explainability panel / Control Tower реально существуют как backend + UI | `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `CURSOR SOFTWARE FACTORY — STARTER PROMPT.md` | `apps/api/src/modules/explainability/explainability-panel.controller.ts`, `apps/api/src/modules/explainability/explainability-panel.service.ts`, `apps/api/src/modules/explainability/trace-topology.service.ts`, `apps/web/app/(app)/control-tower/page.tsx`, `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx` | `CONFIRMED` |
| `Evidence Tagging`: каждое утверждение привязано к источнику и это доезжает до форензики | `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md` | Источники evidence реально генерят `apps/api/src/modules/rai-chat/agents/knowledge-agent.service.ts`, `apps/api/src/modules/rai-chat/agents/economist-agent.service.ts`; composer их собирает в `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`; но `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` не пишет `metadata.evidence` в `aiAuditEntry` | `PARTIAL` |
| `BS%` — честно считается по трейсу и реально feed’ит observability | `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `CURSOR SOFTWARE FACTORY — STARTER PROMPT.md` | `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`, `apps/api/src/modules/rai-chat/trace-summary.service.ts`, `apps/api/src/modules/explainability/explainability-panel.service.ts`, `apps/web/app/(app)/control-tower/page.tsx`; но `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` пишет `TraceSummary` с нулями и без evidence wiring | `PARTIAL` |
| `Quality & Evals Panel` показывает `Acceptance Rate`, `Correction Rate`, `BS%`, `Evidence Coverage` | `A_RAI_IMPLEMENTATION_CHECKLIST.md` | UI есть в `apps/web/app/(app)/control-tower/page.tsx`; `AgentScoreCard` есть в `packages/prisma-client/schema.prisma`; сервисы есть в `apps/api/src/modules/rai-chat/eval/agent-scorecard.service.ts`; но на самой панели видны в основном `BS%` и `Evidence Coverage` | `PARTIAL` |
| Автономность регулируется по `BS%` и quality alerts | `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `apps/api/src/modules/rai-chat/autonomy-policy.service.ts`, `apps/api/src/modules/rai-chat/quality-alerting.service.ts`, `apps/api/src/modules/rai-chat/monitoring-trigger.service.ts`, `apps/api/src/modules/rai-chat/trace-summary.service.ts` | `PARTIAL` |
| Governance counters и incidents feed реально живые | `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `apps/api/src/modules/rai-chat/incidents-governance.controller.ts`, `apps/api/src/modules/rai-chat/incident-ops.service.ts`, `apps/web/app/(app)/governance/security/page.tsx`, `packages/prisma-client/schema.prisma` (`SystemIncident`) | `PARTIAL` |
| `PromptChange RFC` внедрён как формальный исполняемый процесс с eval/canary/rollback | `PROMPT_CHANGE_RFC.md`, `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md` | Есть куски механики: `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`, `apps/api/src/modules/adaptive-learning/services/canary.service.ts`, `apps/api/src/modules/adaptive-learning/adaptive-learning.controller.ts`; но целостного RFC workflow под агентные промты не видно | `PARTIAL` |
| `GoldenTestSet` / `EvalRun` реально production-grade, а не заглушка | `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `PROMPT_CHANGE_RFC.md` | `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`, `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.spec.ts` | `PARTIAL` |
| `Agent Configurator` существует как UI + API настройки агентов | `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `apps/web/app/(app)/control-tower/agents/page.tsx`, `apps/api/src/modules/explainability/agents-config.controller.ts`, `apps/api/src/modules/explainability/agent-management.service.ts`, `packages/prisma-client/schema.prisma` (`AgentConfiguration`) | `PARTIAL` |
| `Phase 4.6` полноценный registry-модуль: `AgentProfile`, `AgentToolMapping`, `TenantAgentAccess`, отдельный `AgentRegistryModule` | `A_RAI_AGENT_REGISTRY_PROMPT.md` | В коде найден только `AgentConfiguration` и CRUD-конфиги: `packages/prisma-client/schema.prisma`, `apps/api/src/modules/explainability/agent-management.service.ts`, `apps/api/src/modules/explainability/agents-config.controller.ts` | `MISSING` |

## Сухой вывод

- Реально живое и подтверждённое: `Agent OS shell`, `WorkspaceContext`, `chat API`, `MemoryAdapter`, `tenant isolation`, `typed tools`, `agro draft->commit`, `agro escalation`, `control-tower basic`.
- Живое, но слабее заявленного: `BudgetController`, `BS%`, `Evidence Tagging`, `quality panels`, `autonomy-by-BS%`, `incidents/governance`, `PromptChange RFC`.
- Пока в доках жирнее, чем в коде: полноценный `Agent Registry` из `Phase 4.6`.

## Главный риск самообмана

Самый опасный разрыв сейчас один: папка продаёт forensic-grade `truthfulness / BS% / evidence` контур, а код пока не довозит evidence до audit-трейса так, как этого требует собственная архитектура. Это уже не косметика, а структурная дыра.
