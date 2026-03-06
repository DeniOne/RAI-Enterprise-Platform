# Paperclip AI Research — 2026-03-06

## Источник
https://github.com/paperclipai/paperclip

## Что это
Open-source (MIT) оркестратор AI-агентов. Node.js + TypeScript + Drizzle ORM + PostgreSQL + React.
«Операционная система для компаний без людей» — менеджер задач для AI-агентов.

## Ключевые паттерны для заимствования

### 1. Cost Tracking (ВЫСОКИЙ приоритет)
- Таблица `costEvents`: agentId, costCents, inputTokens, outputTokens, model, occurredAt
- Автоматическая пауза агента при превышении budgetMonthlyCents
- Агрегация по компании и по агенту
- **Применимость**: Интеграция с SupervisorAgent для трекинга стоимости LLM-запросов

### 2. Approval Workflow (ВЫСОКИЙ приоритет)
- Generic approval system: type, status (pending/approved/rejected/revision_requested)
- Side-effects на approve/reject (активация агента, etc.)
- **Применимость**: ChangeOrders в техкартах, AI audit decisions

### 3. Config Revisions (СРЕДНИЙ приоритет)
- Версионирование конфигураций с diff: beforeConfig, afterConfig, changedKeys
- source: patch | rollback | api
- **Применимость**: Аудит изменений в tech-map, generative-engine configs

### 4. Heartbeat Engine (СРЕДНИЙ приоритет)
- Periodic wakeup mechanism для агентов
- Task sessions, run logs, wakeup requests
- **Применимость**: Health monitoring для AI-пайплайнов

## Что НЕ брать
- Drizzle ORM (мы на Prisma)
- UI (свой фронт)
- Auth (свой стек)
- Multi-company as-is (наша LegalEntity/Farm богаче)

## Сравнение с Stage 2 (2026-03-06)

### Главный gap RAI EP — Cost Control
- В `AI_SWARM_ARCHITECTURE_ECONOMICS.md` детально описана экономика ($3-500/мес)
- В Production-Readiness Checklist §2 BudgetController = НЕ ГОТОВО
- В коде НОЛЬ строк cost tracking
- Paperclip показывает элегантное решение за один день

### Где RAI EP сильнее Paperclip
- AI Intelligence: Evidence→BS%→Governance spine, TechCouncil, Anti-hallucination
- Explainability: 3 уровня (Surface/Analytical/Forensic), TraceSummary, Safe Replay
- Security: RiskGate, Draft→Commit, tenant isolation, prompt injection protection
- Домен: агрономия (TechMap, BBCH, севооборот, СЗР)

### Где Paperclip сильнее RAI EP
- Cost Tracking: полноценный costEvents + auto-pause при budget exceed
- Config Revisions: beforeConfig/afterConfig/changedKeys для агентов
- Agent Auth: JWT + API keys для M2M
- Task Management: labels, comments, attachments, assignments
- Goal Hierarchy: goals → projects → issues

## Решение
Забрать из Paperclip: Cost Tracking → Config Revisions → Agent API Keys.
Подробный анализ в artifacts.
