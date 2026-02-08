# Advisory S3 Monitoring Window

## Window Metadata
- Rollout stage: `S3` (`50%`)
- Window type: post-launch stabilization
- Minimum duration: `N/A for DEV_PREPROD`
- DEV gate criterion: `>=20 PASS snapshots`, `0 FAIL`, stable `S3`, kill-switch `disabled`
- Owner: `SRE + TechLead`

## Monitoring Cadence
- Every 2h: `pnpm --dir apps/api run monitor:advisory:s3`
- Every 24h: refresh load profile (`25/50 VU`) and compare with baseline
- Daily review: incident/runbook status and audit anomalies

## Mandatory Gates During Window
- Rollout stage remains `S3`
- Kill-switch remains `disabled` in normal operation
- `errorRate < 3%`
- `p95 < 2500ms`, `p99 < 4000ms`
- `acceptRate >= 0.10`
- `decisionLagAvgMinutes <= 45`

## Escalation Rules
- Any gate breach -> immediate triage + incident channel update
- Repeated breach (>2 checks) -> rollback review (`S2`)
- Security anomaly -> emergency kill-switch + incident runbook

## Evidence Artifacts
- `docs/04-ENGINEERING/ADVISORY_LOAD_STRESS_REPORT.md`
- `docs/04-ENGINEERING/ADVISORY_ONCALL_DRILL_REPORT_2026-02-08.md`
- `docs/04-ENGINEERING/ADVISORY_DR_REHEARSAL_REPORT_2026-02-08.md`
- `docs/04-ENGINEERING/ADVISORY_SECURITY_GATE_REPORT_SPRINT6.md`
- `docs/04-ENGINEERING/ADVISORY_S3_MONITORING_LOG.jsonl`
- `docs/04-ENGINEERING/ADVISORY_S3_MONITORING_REPORT.md`

## Automation Commands
- Snapshot check: `pnpm --dir apps/api run monitor:advisory:s3`
- Append snapshot to log: `pnpm --dir apps/api run monitor:advisory:s3:collect`
- Rebuild aggregated report: `pnpm --dir apps/api run monitor:advisory:s3:summarize`
- Full cycle (collect + summarize + gate evaluate): `pnpm --dir apps/api run monitor:advisory:s3:cycle`

## Exit Criteria (Ready for S4 Gate)
- DEV_PREPROD: at least `20` snapshots with no fails
- No critical SLO violations
- Stable advisory quality and conversion
- Updated go/no-go packet for `S4 (100%)`
