---
id: DOC-ARC-DECISIONS-ADR-DB-002-SCHEMA-FRAGMENTATION-OWNERSHIP
layer: Architecture
type: ADR
status: accepted
version: 0.1.0
owners: [@techlead, @backend-lead, @data-architecture]
last_updated: 2026-03-13
---
# ADR_DB_002: Schema Fragmentation and Ownership

## Статус
`Accepted` (2026-03-13, DB refactor program)

## Контекст

`schema.prisma` вырос до монолитного графа, где ownership и границы доменов неочевидны.
Попытки дробить схему без governance приводят к over-modularization и дрейфу отношений.

## Решение

1. В первой итерации закрепляются 8 верхнеуровневых доменов:
- `platform_core`
- `org_legal`
- `agri_planning`
- `agri_execution`
- `finance`
- `crm_commerce`
- `ai_runtime`
- `integration_reliability`
2. Подконтуры:
- `ai_runtime/knowledge_memory`
- `ai_runtime/risk_governance`
- `quarantine_sandbox/research_rd`
3. Вводится ownership через `DOMAIN_OWNERSHIP_MANIFEST.md`.
4. Fragmentation проводится только после утверждения ownership и CI checks.
5. Новые cross-domain relations без ADR запрещены.

## Последствия

Плюсы:
- понятный owner для каждой модели;
- снижение blast radius миграций;
- быстрее добавляются новые сущности без перепрошивки ядра.

Минусы:
- дополнительный governance overhead;
- нужен compose-pipeline и review discipline.

## Guardrails

- fragment layout не заменяет domain boundaries;
- `knowledge_memory` и `risk_governance` не выделяются в отдельные top-level domains на первом проходе;
- `research_rd` остается в quarantine до отдельного решения.

## Verification

- каждый PR с моделью содержит owner mapping;
- CI валидирует ownership manifest;
- forbidden relation checks включены.
