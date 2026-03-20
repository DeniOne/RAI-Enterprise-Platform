---
id: DOC-ARC-DATABASE-DB-INDEX-EVIDENCE-REGISTER-1UEE
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_INDEX_EVIDENCE_REGISTER

## Purpose

Каждый новый/удаляемый индекс должен иметь evidence-запись.
Индексные изменения без evidence-регистра запрещены.

## Required fields for new index

- `query_shape`
- `frequency`
- `latency_pain`
- `expected_selectivity`
- `model/table`
- `index_definition`
- `owner_domain`
- `phase`

## Required fields for index removal

- `candidate_index`
- `production_observation_window`
- `observed_usage`
- `write_impact`
- `rollback_plan`

## New indexes (Phase 6 wave 1)

| Table | Index name | Index shape | Query shape | Frequency | Latency pain | Expected selectivity | Owner | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `harvest_plans` | `harvest_plans_companyId_seasonId_idx` | `(companyId, seasonId)` | `where companyId + seasonId` | high | list/lookup lag in planning flows | high (tenant+season narrow) | `agri_execution` | `phase_6` |
| `harvest_plans` | `harvest_plans_companyId_status_createdAt_idx` | `(companyId, status, createdAt)` | `where companyId + status order by createdAt desc` | high | dashboard lag | medium-high | `agri_execution` | `phase_6` |
| `tasks` | `tasks_companyId_seasonId_idx` | `(companyId, seasonId)` | `where companyId + seasonId` | high | operator task list lag | high | `agri_execution` | `phase_6` |
| `tasks` | `tasks_companyId_status_createdAt_idx` | `(companyId, status, createdAt)` | `where companyId + status order by createdAt desc` | high | queue/list lag | medium-high | `agri_execution` | `phase_6` |
| `cmr_deviation_reviews` | `cmr_deviation_reviews_companyId_status_createdAt_idx` | `(companyId, status, createdAt)` | `where companyId + status order by createdAt desc` | medium-high | governance board lag | medium | `agri_execution` | `phase_6` |
| `cmr_risks` | `cmr_risks_companyId_status_createdAt_idx` | `(companyId, status, createdAt)` | `where companyId + status order by createdAt desc` | medium-high | risk registry lag | medium | `agri_execution` | `phase_6` |
| `cmr_risks` | `cmr_risks_companyId_type_createdAt_idx` | `(companyId, type, createdAt)` | `where companyId + type order by createdAt desc` | medium | risk filter lag | medium | `agri_execution` | `phase_6` |
| `economic_events` | `economic_events_companyId_type_createdAt_idx` | `(companyId, type, createdAt)` | `where companyId + type order by createdAt desc` | high | finance feed lag | medium-high | `finance` | `phase_6` |
| `economic_events` | `economic_events_companyId_seasonId_createdAt_idx` | `(companyId, seasonId, createdAt)` | `where companyId + seasonId order by createdAt desc` | medium-high | season finance projection lag | medium | `finance` | `phase_6` |
| `ledger_entries` | `ledger_entries_companyId_createdAt_idx` | `(companyId, createdAt)` | `where companyId order by createdAt desc` | high | ledger timeline lag | medium | `finance` | `phase_6` |
| `commerce_parties` | `commerce_parties_companyId_status_createdAt_idx` | `(companyId, status, createdAt)` | `where companyId + status order by createdAt desc` | medium-high | party workspace lag | medium | `crm_commerce` | `phase_6` |

## Removal candidates

Observation window started.
Snapshot: `docs/01_ARCHITECTURE/DATABASE/DB_INDEX_OBSERVATION_WINDOW_2026-03-13.md`.

## Removal policy (pre-filled template for next wave)

| Candidate index | Production observation window | Observed usage | Write impact | Rollback plan |
| --- | --- | --- | --- | --- |
| `seasons_status_companyId_idx` (mirror to `seasons_companyId_status_idx`) | `14 days` production traffic | `idx_scan=0` (snapshot start) | expected write gain on `seasons` updates | recreate index migration prepared before drop |
| `tasks_companyId_idx` | `14 days` production traffic | `idx_scan=0` (snapshot start) | expected write gain on `tasks` writes | recreate index migration prepared before drop |
| `commerce_parties_companyId_legalName_idx` | `14 days` production traffic | `idx_scan=0` (snapshot start) | expected write gain on `commerce_parties` writes | recreate index migration prepared before drop |
