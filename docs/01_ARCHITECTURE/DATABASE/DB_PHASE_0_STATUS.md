---
id: DOC-ARC-DATABASE-DB-PHASE-0-STATUS-WRRE
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PHASE_0_STATUS

## Scope

Этот файл фиксирует фактический старт `Phase 0` из `DB_REFACTOR_CHECKLIST.md`.

Обязательная дисциплина обновления:
- после каждой логической задачи синхронизировать status, checklist, зависимые артефакты и memory-bank;
- отсутствие синхронизации = задача не считается закрытой.

## Done

- [x] Создан governance ADR пакет:
- [x] `ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`
- [x] `ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`
- [x] `ADR_DB_003_ENUM_GOVERNANCE.md`
- [x] `ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`
- [x] `ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`
- [x] ADR index обновлен и содержит DB ADR entries.
- [x] Добавлены CI scripts для Phase 0:
- [x] `scripts/check-model-scope-manifest.cjs`
- [x] `scripts/check-domain-ownership-manifest.cjs`
- [x] `scripts/check-db-forbidden-relations.cjs`
- [x] `scripts/check-db-enum-growth.cjs`
- [x] `scripts/check-db-duplicate-indexes.cjs`
- [x] `scripts/check-heavy-prisma-includes.cjs`
- [x] `scripts/check-db-phase0-gate.cjs`
- [x] Добавлены package scripts:
- [x] `gate:db:scope`
- [x] `gate:db:ownership`
- [x] `gate:db:forbidden-relations`
- [x] `gate:db:enum-growth`
- [x] `gate:db:index-quality`
- [x] `gate:db:heavy-includes`
- [x] `gate:db:phase0`
- [x] Устранен конфликт `EventConsumption` в `PrismaService` (дублирование в tenant/system списках).
- [x] Выполнен прогон `pnpm gate:db:phase0` в warn-режиме.
- [x] Выполнен прогон `pnpm gate:db:phase0:enforce` (успешно, без hard failures).
- [x] Сформирован initial backlog по direct `Company` relation в control-plane моделях.
- [x] `MODEL_SCOPE_MANIFEST.md` синхронизирован до полного покрытия `195/195` моделей current contour.
- [x] `gate:db:phase0:enforce` включен в обязательный CI workflow (`.github/workflows/invariant-gates.yml`).
- [x] Зафиксирована mandatory sync discipline для всех следующих логических задач (checklists + dependent files + memory-bank).
- [x] `DB_REFACTOR_CHECKLIST` усилен до execution-packet уровня: добавлена canonical precedence chain, companion artifacts set и числовые program-level KPI baseline/targets.
- [x] Подключены дополнительные DB governance gates, используемые фазами 3-6 (`phase3/projections/enum-register/index-evidence`) в CI workflow.

## In progress

- [x] Формальное утверждение ADR и policy документов владельцами доменов.

## Blockers

- [x] Нет блокеров для Phase 0 gate.

## Next execution slice

1. Поддерживать `gate:db:phase0:enforce` как обязательный pre-merge gate.
2. Не допускать drift между checklist/status/manifest/policy документами.
