---
id: DOC-ARC-DECISIONS-ADR-DB-005-INDEX-AND-QUERY-GOVER-1UH9
layer: Architecture
type: ADR
status: approved
version: 0.1.0
owners: [@techlead, @backend-lead, @data-architecture]
last_updated: 2026-03-13
---
# ADR_DB_005: Index and Query Governance

## Статус
`Accepted` (2026-03-13, DB refactor program)

## Контекст

В схеме много шаблонных индексов (`companyId`), но не хватает workload-driven composite индексов.
Это дает write-cost и не закрывает hot query paths.

## Решение

1. Индексы добавляются только под подтвержденные query paths.
2. Шаблонные и зеркальные индексы удаляются только после production evidence.
3. Hot delegates получают приоритетный index budget.
4. Append-heavy и read-heavy таблицы рассматриваются отдельно.
5. Outbox/order paths индексируются только после нормализации scope columns.

## Последствия

Плюсы:
- реальное ускорение hot-path операций;
- меньше write amplification;
- прозрачная связь между кодом и индексным слоем.

Минусы:
- нужно поддерживать query evidence discipline;
- нельзя “быстро накидать индексов” без проверки.

## Guardrails

- speculative index additions запрещены;
- любые index removals требуют evidence;
- CI должен ловить duplicate/weak patterns.

## Verification

- `DB_INDEX_AUDIT.md` используется как source для index backlog;
- CI-сценарии проверяют дубли и слабополезные паттерны;
- критичные hot queries имеют workload-confirmed indexes.
