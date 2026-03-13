---
id: DOC-ARC-DECISIONS-ADR-DB-003-ENUM-GOVERNANCE
layer: Architecture
type: ADR
status: proposed
version: 0.1.0
owners: [@techlead, @backend-lead, @data-architecture]
last_updated: 2026-03-13
---
# ADR_DB_003: Enum Governance

## Статус
`Proposed` (Phase 0 governance)

## Контекст

Enum слой разросся и содержит смешанные semantics:
- технические и FSM enum;
- evolving business vocabulary;
- jurisdiction-sensitive словари;
- дублирующиеся enum families.

Это увеличивает migration noise и усложняет эволюцию модели.

## Решение

Каждый enum обязан иметь taxonomy class:
- `technical closed enum`
- `FSM/status invariant enum`
- `business evolving vocabulary`
- `jurisdiction-sensitive vocabulary`
- `tenant-customizable vocabulary`
- `suspicious duplicate enum family`

Правила:
- первые два класса остаются enum;
- остальные переводятся в reference/config tables или нормализуются;
- cleanup выполняется по domain ownership, не ad hoc.

## Последствия

Плюсы:
- предсказуемый schema evolution;
- меньше churn в Prisma generated types;
- проще поддерживать multi-tenant и multi-jurisdiction вариативность.

Минусы:
- требуется migration strategy для reference tables;
- нужен governance процесс на каждое новое enum-значение.

## Guardrails

- нельзя добавлять enum без taxonomy decision;
- запрещены новые duplicate families без ADR;
- literal defects фиксируются в ближайшей cleanup wave.

## Verification

- у каждого enum есть taxonomy метка в `DB_ENUM_RATIONALIZATION.md`;
- overlap matrices (`risk-*`, `status-*`, `source-*`, `type-*`, `mode-*`) поддерживаются.
