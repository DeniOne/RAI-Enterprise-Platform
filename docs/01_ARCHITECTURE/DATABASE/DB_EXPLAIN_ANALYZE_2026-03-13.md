---
id: DOC-ARC-DATABASE-DB-EXPLAIN-ANALYZE-2026-03-13-1R6Y
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_EXPLAIN_ANALYZE_2026-03-13

- Generated at: `2026-03-13T21:55:51.835Z`
- Source: staging/local DB from `.env` `DATABASE_URL`
- Scope: `Season`, `Task`, `HarvestPlan`, `Party` hot-path queries

## Season hot path: companyId + status + createdAt DESC

- params: companyId=default-rai-company, status=PLANNING

```sql
SELECT id, "companyId", status, "createdAt"
FROM seasons
WHERE "companyId" = $1 AND status = $2::"SeasonStatus"
ORDER BY "createdAt" DESC
LIMIT 50;
```

```text
Limit  (cost=1.03..1.03 rows=1 width=76) (actual time=0.028..0.030 rows=1 loops=1)
  Buffers: shared hit=1
  ->  Sort  (cost=1.03..1.03 rows=1 width=76) (actual time=0.027..0.028 rows=1 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=1
        ->  Seq Scan on seasons  (cost=0.00..1.02 rows=1 width=76) (actual time=0.015..0.016 rows=1 loops=1)
              Filter: (("companyId" = 'default-rai-company'::text) AND (status = ('PLANNING'::cstring)::"SeasonStatus"))
              Rows Removed by Filter: 1
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=16
Planning Time: 0.341 ms
Execution Time: 0.057 ms
```

## Task hot path: companyId + status + createdAt DESC

- params: companyId=default-rai-company, status=PENDING

```sql
SELECT id, "companyId", "seasonId", status, "createdAt"
FROM tasks
WHERE "companyId" = $1 AND status = $2::"TaskStatus"
ORDER BY "createdAt" DESC
LIMIT 100;
```

```text
Limit  (cost=1.05..1.05 rows=1 width=108) (actual time=0.026..0.028 rows=1 loops=1)
  Buffers: shared hit=1
  ->  Sort  (cost=1.05..1.05 rows=1 width=108) (actual time=0.025..0.026 rows=1 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=1
        ->  Seq Scan on tasks  (cost=0.00..1.04 rows=1 width=108) (actual time=0.013..0.014 rows=1 loops=1)
              Filter: (("companyId" = 'default-rai-company'::text) AND (status = ('PENDING'::cstring)::"TaskStatus"))
              Rows Removed by Filter: 1
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=7
Planning Time: 0.278 ms
Execution Time: 0.057 ms
```

## HarvestPlan hot path: companyId + seasonId + createdAt DESC

- params: companyId=default-rai-company, seasonId=demo-season-2026-kuban-1

```sql
SELECT id, "companyId", "seasonId", status, "createdAt"
FROM harvest_plans
WHERE "companyId" = $1 AND "seasonId" = $2
ORDER BY "createdAt" DESC
LIMIT 100;
```

```text
Limit  (cost=1.02..1.03 rows=1 width=108) (actual time=0.027..0.029 rows=1 loops=1)
  Buffers: shared hit=1
  ->  Sort  (cost=1.02..1.03 rows=1 width=108) (actual time=0.026..0.027 rows=1 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=1
        ->  Seq Scan on harvest_plans  (cost=0.00..1.01 rows=1 width=108) (actual time=0.011..0.012 rows=1 loops=1)
              Filter: (("companyId" = 'default-rai-company'::text) AND ("seasonId" = 'demo-season-2026-kuban-1'::text))
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=2
Planning Time: 0.224 ms
Execution Time: 0.048 ms
```

## Party hot path: companyId + status + createdAt DESC

- params: companyId=default-rai-company, status=ACTIVE

```sql
SELECT id, "companyId", status, "createdAt"
FROM commerce_parties
WHERE "companyId" = $1 AND status = $2::"PartyEntityStatus"
ORDER BY "createdAt" DESC
LIMIT 100;
```

```text
Limit  (cost=1.09..1.09 rows=1 width=76) (actual time=0.028..0.030 rows=4 loops=1)
  Buffers: shared hit=1
  ->  Sort  (cost=1.09..1.09 rows=1 width=76) (actual time=0.026..0.027 rows=4 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=1
        ->  Seq Scan on commerce_parties  (cost=0.00..1.08 rows=1 width=76) (actual time=0.014..0.017 rows=4 loops=1)
              Filter: (("companyId" = 'default-rai-company'::text) AND (status = ('ACTIVE'::cstring)::"PartyEntityStatus"))
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=5
Planning Time: 0.209 ms
Execution Time: 0.051 ms
```
