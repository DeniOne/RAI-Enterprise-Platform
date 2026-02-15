---
id: DOC-ENG-GEN-100
type: Service Spec
layer: Engineering
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Advisory Canary Rollout Protocol (Sprint 6)

## 1. Scope
- Service scope: advisory API + Web dashboard advisory panel + Telegram advisory commands.
- Tenant scope: production tenants eligible for phased rollout.
- Exclusions: non-advisory modules and experimental integrations.

## 2. Rollout Stages
- Stage 0: `0%` (pre-canary baseline)
- Stage 1: `10%`
- Stage 2: `25%`
- Stage 3: `50%`
- Stage 4: `100%`

## 3. Gate Metrics (per stage)
- Availability/SLO: API success rate within approved error budget.
- Latency: P95/P99 for advisory read/write-path within target SLO.
- Quality: recommendation conversion and reject-with-reason ratio not degraded beyond threshold.
- Safety: no Sev-1/Sev-2 incidents, no tenant isolation breaches.

## 4. Promotion Rules
- Hold each stage for agreed observation window.
- Promote only if all gate metrics are green for full window.
- Require explicit stage approval by on-call tech lead.

## 5. Auto-Stop Rules
- Trigger auto-stop on sustained SLO breach over configured window.
- Trigger auto-stop on repeated 5xx spikes above threshold.
- Trigger auto-stop on safety incident or audit anomaly.

## 6. Rollback Rules
- Rollback to previous stable stage on gate failure.
- Rollback to `0%` on Sev-1/Sev-2 or unresolved safety event.
- Record rollback event with `traceId`, actor, timestamp, reason.

## 7. Execution Checklist
- [ ] Rollout stage configuration approved.
- [ ] Alert routing and escalation chain verified.
- [ ] Kill-switch tested in production-like environment.
- [ ] Rollback rehearsed and validated.
- [ ] Decision log updated after each stage.

## 8. Evidence Log (to fill during rollout)
- Stage:
- Start timestamp (UTC):
- End timestamp (UTC):
- Gate metrics snapshot:
- Decision (promote/hold/rollback):
- Decision owner:
- Incident notes:

## 9. References
- `docs/06-IMPLEMENTATION/PHASE_GAMMA/SPRINT_6_CHECKLIST.md`
- `docs/04-ENGINEERING/ADVISORY_INCIDENT_RUNBOOK.md`
- `docs/01-ARCHITECTURE/PRINCIPLES/SECURITY_CANON.md`
