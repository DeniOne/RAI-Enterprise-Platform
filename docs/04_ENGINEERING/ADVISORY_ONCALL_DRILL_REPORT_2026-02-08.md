---
id: DOC-ENG-GEN-107
type: Service Spec
layer: Engineering
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# Advisory On-call Drill Report (Sprint 6)

## Session Metadata
- Session ID: `ADVISORY-ONCALL-DRILL-2026-02-08`
- Date (UTC): `2026-02-08T22:23:46.298Z`
- Environment: `local-dev`
- Base URL: `http://localhost:4000`
- Trace Prefix: `drill-1770589424581`

## Scenario
- Forced rollout gate failure at stage `S2` (`errorRate=0.08`, `p95=3800ms`, `conversion=0.04`).
- Validate auto-stop audit path.
- Validate kill-switch containment path.
- Validate rollback to safer rollout stage (`S1`).

## Timeline
1. Login successful.
2. Rollout configured to `S2` (`autoStopEnabled=true`).
3. Gate evaluated as `pass=false` with expected failure reasons.
4. Kill-switch enabled.
5. Pilot status verified as `enabled=false`.
6. Kill-switch disabled.
7. Rollout rolled back to `S1`.

## Checks
- `gateFailPassFlag`: `true`
- `autoStopAuditExists`: `true`
- `gateAuditExists`: `true`
- `killSwitchAuditExists`: `true`
- `pilotDisabledOnKillSwitch`: `true`

## Result
- Final Status: `PASS`
- Conclusion: operational drill confirms readiness of alert/escalation response path for advisory rollout incidents.

## Execution Command
```bash
pnpm --dir apps/api run drill:advisory:oncall
```
