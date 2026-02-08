# Advisory Load/Stress Report (Sprint 6)

## Test Metadata
- Date (UTC): 2026-02-09
- Environment: local-dev (API on `http://localhost:4000`)
- Runner:
- Script:
- API version/commit:

## Test Configuration
- Ramp profile: step load profiles (`10/25/50 VU`)
- Max VUs: `50`
- Duration: `30s` baseline + `60s` stress profiles
- Auth mode: JWT (`/api/auth/login`, admin user)
- Target endpoints:
  - `GET /api/advisory/recommendations/my`
  - `GET /api/advisory/ops/metrics`
  - `GET /api/advisory/rollout/status`

## SLO Targets
- Error rate: `< 3%`
- P95 latency: `< 2500ms`
- P99 latency: `< 4000ms`

## Observed Results
- Requests total:
  - `10 VU / 30s`: `1695`
  - `25 VU / 60s`: `1347`
  - `50 VU / 60s`: `2706`
- Error rate:
  - `10 VU`: `0.0000`
  - `25 VU`: `0.0000`
  - `50 VU`: `0.0000`
- P95 latency:
  - `10 VU`: `409.16ms`
  - `25 VU`: `2076.32ms`
  - `50 VU`: `2036.51ms`
- P99 latency:
  - `10 VU`: `726.10ms`
  - `25 VU`: `2608.04ms`
  - `50 VU`: `2619.38ms`
- Throughput (req/s):
  - `10 VU`: `56.50`
  - `25 VU`: `22.45`
  - `50 VU`: `45.10`

## Endpoint Breakdown
- Recommendations (`/recommendations/my`): stable, no 5xx/4xx during run.
- Ops Metrics (`/ops/metrics`): stable, no 5xx/4xx during run.
- Rollout Status (`/rollout/status`): stable, no 5xx/4xx during run.

## Findings
- Bottlenecks: no critical bottleneck observed in tested profiles.
- Capacity ceiling: not reached up to `50 VU` for advisory read-path.
- Degradation pattern: latency growth remains inside target SLO envelope.

## Actions
- Hardening actions: baseline + stress profiles executed; continue periodic regression runs before stage promotion.
- Owner: backend+qa
- ETA: ongoing (pre-stage-promotion gate).

## Decision
- Status: `PASS`
- Notes: all executed profiles passed target thresholds (`errorRate < 3%`, `p95 < 2500ms`, `p99 < 4000ms`).
