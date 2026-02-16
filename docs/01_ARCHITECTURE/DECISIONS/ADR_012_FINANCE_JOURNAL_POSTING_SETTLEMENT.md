---
id: DOC-ARC-ADR-012
layer: Architecture
type: ADR
status: approved
version: 1.0.0
---

# ADR-012: Finance Domain Redesign (Journal/Posting/Settlement)

Дата: 2026-02-16

## Context
- Требуется усилить финансовый домен так, чтобы ingest path был явно структурирован как:
- `journal` (семантическая фаза),
- `posting` (сбалансированные проводки),
- `settlement` (трассировка закрытия обязательств).

## Decision
- В `EconomyService` вводится явный domain policy-слой:
- `resolveJournalPhase(...)` для классификации события (`ACCRUAL|SETTLEMENT|ADJUSTMENT|BOOTSTRAP|OTHER`),
- `resolveSettlementRef(...)` для детерминированной settlement traceability,
- `assertBalancedPostings(...)` как runtime guard перед записью проводок.
- Финансовые metadata обогащаются полями `journalPhase` и `settlementRef`.
- Перед `ledgerEntry.createMany` выполняется проверка баланса `DEBIT == CREDIT` на нормализованных posting-amount.

## Consequences
- Плюсы:
- Явная финансовая семантика в event metadata.
- Дополнительный runtime barrier против несбалансированных проводок.
- Улучшенная трассировка settlement-path для аудита.
- Минусы:
- Усложнение ingest path.
- Появляется обязательный compatibility контроль для metadata envelope.

## Status
- Implemented in code and covered by tests.
