---
id: DOC-EXE-07-EXECUTION-AI-COPILOT-RELEASE-GO-NO-GO-2-FSA2
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
---
# AI Copilot / Decision Intelligence — Go/No-Go Packet (2026-03-13)

Status: READY FOR INTERNAL + PILOT ROLLOUT

## 1. Scope Covered

- AI Dock memory hints + suggested actions.
- Contextual `chief_agronomist` escalation/review flow.
- `Стратегия -> Прогнозы` deterministic MVP.
- Control Tower memory visibility + trace forensics `memoryLane`.
- Data scientist runtime bridge to deterministic `DecisionIntelligenceService`.

## 2. Foundation Gate Verdict (WS0)

| Gate | Verdict | Evidence |
| --- | --- | --- |
| Tenant scope enforcement | PASS | Prisma tenant enforcement + RLS migrations, tenant-aware controllers/services |
| Idempotency on critical write paths | PASS | Idempotency interceptor and keys on expert/forecast flows |
| Outbox hardening (`SKIP LOCKED` + relay control) | PASS | outbox relay hardening and wakeup path |
| Mandatory human review for high-impact actions | PASS | expert review/outcome flow (`accept` / `hand_off` / `create_task`) |
| Memory pruning/archival lifecycle control | PASS | memory maintenance/control-plane + lifecycle workers/alerts |
| Rate limiting on AI/expert/forecast APIs | PASS | throttling on rai-chat/expert/ofs forecast endpoints |
| Trace + audit trail on high-impact flows | PASS | traceId + audit events on forecast and expert review paths |

## 3. Telemetry Contract (Rollout Metrics)

Metrics exported in `/api/invariants/metrics/prometheus`:

- `ai_memory_hint_shown_total`
- `expert_review_requested_total`
- `expert_review_completed_total`
- `strategy_forecast_run_total`
- `strategy_forecast_degraded_total`
- `strategy_forecast_latency_ms`
- `memory_lane_populated_total`

## 4. Feature Flags / Rollout Order

Flags:

- `RAI_MEMORY_HINTS_ENABLED`
- `RAI_CHIEF_AGRONOMIST_PANEL_ENABLED`
- `RAI_STRATEGY_FORECASTS_ENABLED`
- `RAI_CONTROL_TOWER_MEMORY_ENABLED`
- `RAI_FOUNDATION_RELEASE_READY`

Rollout sequence:

1. `internal admin`
2. `founder/director`
3. `pilot tenant`
4. `broader internal users`

## 5. Go/No-Go Criteria

Go when all hold:

- no known tenant leakage defects;
- trace coverage = 100% for expert/forecast runs;
- no raw memory leakage in standard mode;
- degraded forecast path returns structured response, not 5xx;
- expert timeout/needs-context path keeps human hand-off available.

## 6. Residual Backlog (Next Iteration, Non-Blocker for MVP)

- advanced causal core / optimization core (beyond deterministic MVP heuristics);
- champion/challenger automation and deeper calibration dashboards;
- expanded scenario persistence and collaborative scenario workflows.
