# DB_INDEX_OBSERVATION_WINDOW_2026-03-13

- Snapshot at: `2026-03-13T22:02:49.626Z`
- Observation window: `14 days`
- Goal: подтвердить low-value index removal перед drop wave.

## Candidate index usage snapshot

| Table | Index | idx_scan | idx_tup_read | idx_tup_fetch | index_size_bytes | Observation |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `seasons` | `seasons_companyId_status_idx` | 3 | 3 | 3 | 16384 | used (keep) |
| `seasons` | `seasons_status_companyId_idx` | 0 | 0 | 0 | 16384 | candidate for removal (needs full window) |
| `tasks` | `tasks_companyId_idx` | 0 | 0 | 0 | 16384 | candidate for removal (needs full window) |
| `harvest_plans` | `harvest_plans_companyId_idx` | 21 | 18 | 17 | 16384 | used (keep) |
| `commerce_parties` | `commerce_parties_companyId_legalName_idx` | 0 | 0 | 0 | 16384 | candidate for removal (needs full window) |
| `commerce_parties` | `commerce_parties_companyId_status_createdAt_idx` | 0 | 0 | 0 | 16384 | candidate for removal (needs full window) |

## Table write pressure snapshot

| Table | n_live_tup | n_tup_ins | n_tup_upd | n_tup_del | seq_scan | idx_scan |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `seasons` | 2 | 2 | 1 | 0 | 42 | 21 |
| `tasks` | 2 | 2 | 0 | 0 | 177 | 6 |
| `harvest_plans` | 1 | 1 | 1 | 0 | 19 | 28 |
| `commerce_parties` | 4 | 4 | 3 | 0 | 15 | 169 |

## Decision policy

- Drop допускается только если `idx_scan=0` на всем observation window и нет регрессий по latency.
- Для mirror pair `season_company_status_idx` / `season_status_company_idx` удаляется только один индекс после финального confirm.
- Перед drop обязателен rollback migration для recreate индекса.
